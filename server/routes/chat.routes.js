const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const ChatService = require('../services/ChatService');
const QuizService = require('../services/QuizService');
const UsageTracker = require('../services/UsageTracker');
const { userRateLimiter } = require('../middleware/userRateLimiter.middleware');
const Message = require('../models/Message');
const Repo = require('../models/Repo');

/**
 * @route POST /api/chat/message
 * @desc Send a question and get an AI answer
 * @access Private
 */
router.post('/message', protect, userRateLimiter, async (req, res) => {
  const { repoId, question } = req.body;
  const startTime = Date.now();


  if (!req.user?.apiKey) {
    return res.status(400).json({
      error: 'API_KEY_REQUIRED',
      message: 'Please add your LLM API key in Dashboard (Backend Security Setup) and try again.'
    });
  }

  if (!repoId || !question) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: 'Repo ID and question are required'
    });
  }

  try {
    const repo = await Repo.findOne({ _id: repoId, userId: req.user._id });
    if (!repo) {
      return res.status(404).json({
        error: 'REPO_NOT_FOUND',
        message: 'Repository not found'
      });
    }

    if (repo.status === 'indexing') {
      // Auto-recovery for server crashes: if stuck indexing for > 15 mins (was 5 mins)
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (repo.updatedAt < fifteenMinsAgo) {
         repo.status = 'failed';
         await repo.save();
         return res.status(400).json({
           error: 'INDEXING_STUCK',
           message: 'The indexing process stalled or timed out. Please delete this repository and try cloning it again.'
         });
      }
      return res.status(202).json({
        error: 'INDEXING_IN_PROGRESS',
        message: 'Repository is still being indexed. Please try again in 30 seconds.'
      });
    }

    if (repo.status === 'failed') {
      return res.status(400).json({
        error: 'INDEXING_FAILED',
        message: 'Indexing failed. Your API key may be invalid, lack credits, or the repository was too large. Please delete it and clone again.'
      });
    }

    if (repo.status !== 'ready') {
       return res.status(400).json({
         error: 'UNKNOWN_STATE',
         message: 'Repository is in an unknown state.'
       });
    }

    // 1. Get recent conversation history context
    const recentMessages = await Message.find({ repoId, userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5); // Get last 5 exchanges
    
    let historyContext = "";
    if (recentMessages.length > 0) {
      historyContext = recentMessages.reverse().map(m => `User: ${m.question}\nAI: ${m.answer}`).join("\n\n");
    }

    // 2. Get AI response with context awareness
    const aiResult = await ChatService.chat(question, repoId, req.user, historyContext);

    // 2. Save message to history
    const message = await Message.create({
      repoId,
      userId: req.user._id,
      username: req.user.name,
      avatar: req.user.avatar,
      question,
      answer: aiResult.answer,
      fileRef: aiResult.fileRef,
      provider: aiResult.provider,
      model: aiResult.model,
      tokensUsed: aiResult.tokensUsed
    });

    res.status(200).json({
      messageId: message._id,
      question: message.question,
      answer: message.answer,
      fileRef: message.fileRef,
      provider: message.provider,
      model: message.model,
      timestamp: message.createdAt
    });

    // 3. Log usage asynchronously
    UsageTracker.logRequest({
      userId: req.user._id,
      repoId,
      provider: aiResult.provider,
      model: aiResult.model,
      question,
      tokensUsed: aiResult.tokensUsed,
      cached: aiResult.cached || false,
      responseTimeMs: Date.now() - startTime,
      status: 'success'
    });
  } catch (error) {
    console.error('Chat Point Error:', error);
    const msg = error.message || 'Failed to get AI response';
    const isAuthError = /invalid|api key|unauthorized|401|403|encrypted key format/i.test(msg);
    const isChromaError = /chroma|ECONNREFUSED.*8000|dimension mismatch/i.test(msg);
    const userMessage = isAuthError
      ? 'Invalid or expired API key. Please check your key in Dashboard (Backend Security Setup) and try again.'
      : isChromaError
        ? 'Vector search is unavailable. Ensure ChromaDB is running (e.g. docker or CHROMA_URL) and try again.'
        : msg;
    res.status(500).json({
      error: 'CHAT_FAILED',
      message: userMessage
    });

    UsageTracker.logRequest({
      userId: req.user._id,
      repoId,
      provider: req.user?.provider || 'unknown',
      model: req.user?.model || 'unknown',
      question,
      responseTimeMs: Date.now() - startTime,
      status: 'error',
      errorMessage: msg
    });
  }
});

/**
 * @route GET /api/chat/:repoId/history
 * @desc Get chat history for a repo
 * @access Private
 */
router.get('/:repoId/history', protect, async (req, res) => {
    try {
        const messages = await Message.find({ 
            repoId: req.params.repoId, 
            userId: req.user._id 
        }).sort({ createdAt: -1 }).limit(50);
        
        res.status(200).json({ messages });
    } catch (error) {
        console.error('Get History Error:', error);
        res.status(500).json({
            error: 'SERVER_ERROR',
            message: 'Failed to fetch chat history'
        });
    }
});

/**
 * @route POST /api/chat/quiz
 * @desc Generate a comprehension quiz for the repo
 * @access Private
 */
router.post('/quiz', protect, async (req, res) => {
  const { repoId } = req.body;
  
  if (!repoId) {
    return res.status(400).json({ error: 'Repository ID is required' });
  }

  try {
    const questions = await QuizService.generateQuiz(repoId, req.user);
    res.status(200).json({ questions });
  } catch (error) {
    console.error('Quiz Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate quiz questions' });
  }
});

module.exports = router;

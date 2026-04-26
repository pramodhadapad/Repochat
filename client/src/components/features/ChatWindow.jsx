import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Terminal, Users, Loader2, Mic, MicOff, Share2, Copy, Check, HelpCircle, RefreshCw, Baby, Volume2, Square, Download, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatService, repoService } from '../../services/api';
import useStore from '../../store/useStore';
import socketService from '../../services/socket';
import LLMSelector from './LLMSelector';
import ChatTemplates from './ChatTemplates';
import TypewriterMessage from './TypewriterMessage';
import SmartMessage from './SmartMessage';
import toast from 'react-hot-toast';

const ChatWindow = ({ onFileSelect }) => {
  const { currentRepo, user, setCurrentRepo } = useStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userCount, setUserCount] = useState(1);
  const [shareLoading, setShareLoading] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [reindexLoading, setReindexLoading] = useState(false);
  const [isELI5, setIsELI5] = useState(false);
  const [speakingText, setSpeakingText] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [newMsgIds, setNewMsgIds] = useState(new Set());
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Real-time Listeners
    socketService.on('user-joined', ({ username, count }) => {
      setUserCount(count);
      setMessages(prev => [...prev, { 
        id: `system_${Date.now()}`, 
        role: 'system', 
        content: `${username} joined the session.` 
      }]);
    });

    socketService.on('user-left', ({ count }) => {
      setUserCount(count);
    });

    socketService.on('new-message', (message) => {
      // Avoid duplicate messages if the sender is also the current user
      // (though typically server handles this)
      setMessages(prev => {
        if (prev.find(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    return () => {
      socketService.off('user-joined');
      socketService.off('user-left');
      socketService.off('new-message');
    };
  }, []);

  useEffect(() => {
    if (currentRepo) {
      const fetchHistory = async () => {
        try {
          const res = await chatService.getHistory(currentRepo._id);
          // Convert backend message format to UI format if necessary
          const history = res.data.messages.map(m => ({
            id: m._id,
            role: 'user',
            content: m.question,
            answer: m.answer,
            fileRef: m.fileRef,
            timestamp: m.createdAt
          }));
          
          // Flatten history for display
          const displayMsgs = [];
          history.reverse().forEach(h => {
            displayMsgs.push({ id: h.id + '_q', role: 'user', content: h.content });
            displayMsgs.push({ id: h.id + '_a', role: 'assistant', content: h.answer, fileRef: h.fileRef });
          });
          
          setMessages(displayMsgs.length > 0 ? displayMsgs : [
            { id: 'welcome', role: 'assistant', content: "Hello! Ask me anything about this codebase." }
          ]);
        } catch (err) {
          console.error('History fetch failed:', err);
        }
      };
      fetchHistory();
    }
  }, [currentRepo]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !currentRepo) return;

    const userMsg = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    
    // Broadcast message to other collaborators
    socketService.socket?.emit('chat-message', { repoId: currentRepo._id, message: userMsg });

    setInput('');

    setIsTyping(true);

    try {
      const questionToSend = isELI5 
        ? `Explain this to me using simple analogies, as if I were a 5-year-old: ${input}`
        : input;
        
      const res = await chatService.sendMessage(currentRepo._id, questionToSend);
      
      // Handle the 202 Indexing In Progress response
      if (res.status === 202 || res.data.error === 'INDEXING_IN_PROGRESS') {
        setMessages(prev => [...prev, {
          id: `sys_${Date.now()}`,
          role: 'assistant',
          content: res.data.message || "Repository is still being indexed. Please wait a moment."
        }]);
        return;
      }

      const aiMsgId = res.data.messageId || `ai_${Date.now()}`;
      const aiMsg = { 
        id: aiMsgId, 
        role: 'assistant', 
        content: res.data.answer,
        fileRef: res.data.fileRef,
        timestamp: res.data.timestamp
      };
      setNewMsgIds(prev => new Set(prev).add(aiMsgId));
      setMessages(prev => [...prev, aiMsg]);

      // MCP-Style Auto Redirection: If AI suggests a file, open it immediately
      if (res.data.fileRef && onFileSelect) {
        onFileSelect(res.data.fileRef);
      }
    } catch (err) {
      console.error('Chat failed:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Sorry, I encountered an error while processing your request.";
      setMessages(prev => [...prev, { 
        id: `error_${Date.now()}`, 
        role: 'assistant', 
        content: errorMsg 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev.length > 0 ? ' ' : '') + transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleShare = async () => {
    if (!currentRepo) return;
    setShareLoading(true);
    try {
      // In a real app, this would hit the POST /api/share/create endpoint
      // We'll simulate the response for now or use axios if we have the service
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/share/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('repochat-storage') || '{}')?.state?.token}`
        },
        body: JSON.stringify({ repoId: currentRepo._id })
      });
      const data = await res.json();
      const shareUrl = `${window.location.origin}/collab/${data.shareId}`;
      
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Collaboration link copied to clipboard!');
    } catch (err) {
      console.error('Share failed:', err);
      toast.error('Failed to create share link');
    } finally {
      setShareLoading(false);
    }
  };

  const handleQuiz = async () => {
    if (!currentRepo) return;
    setQuizLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/chat/quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('repochat-storage') || '{}')?.state?.token}`
        },
        body: JSON.stringify({ repoId: currentRepo._id })
      });
      const data = await res.json();
      
      if (data && (Array.isArray(data.questions) || Array.isArray(data))) {
        const questionsList = Array.isArray(data.questions) ? data.questions : data;
        setMessages(prev => [
            ...prev, 
            { 
              id: `quiz_${Date.now()}`, 
              role: 'assistant', 
              content: "I've generated some comprehension questions for you to test your knowledge of this repository:\n\n" + questionsList.map((q, i) => `${i+1}. ${q}`).join('\n')
            }
        ]);
        toast.success('Quiz generated!');
      }
    } catch (err) {
      console.error('Quiz failed:', err);
      toast.error('Failed to generate quiz');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleRetryIndexing = async () => {
    if (!currentRepo || currentRepo.status !== 'failed') return;
    setReindexLoading(true);
    try {
      await repoService.reindexRepo(currentRepo._id);
      toast.success('Re-indexing started. Status will update in a moment.');
      setCurrentRepo({ ...currentRepo, status: 'indexing' });
      const res = await repoService.getRepo(currentRepo._id);
      setCurrentRepo(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to start re-indexing';
      toast.error(typeof msg === 'string' ? msg : 'Failed to start re-indexing');
    } finally {
      setReindexLoading(false);
    }
  };

  const handleSpeak = (text) => {
    if (speakingText === text) {
      window.speechSynthesis.cancel();
      setSpeakingText(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeakingText(null);
    setSpeakingText(text);
    window.speechSynthesis.speak(utterance);
  };

  const handleExport = () => {
    const mdContent = messages.map(m => {
      if (m.role === 'system') return `> **System:** ${m.content}\n`;
      const sender = m.role === 'user' ? 'You' : 'AI';
      let content = `### ${sender}\n${m.content}\n`;
      if (m.fileRef) {
        content += `*Reference: \`${m.fileRef.path}:${m.fileRef.startLine}\`*\n`;
      }
      return content;
    }).join('\n---\n\n');
    
    const blob = new Blob(["# RepoChat Export\n\n" + mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repochat-${currentRepo?.name || 'export'}-chat.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Chat exported to Markdown');
  };

  const handleScanBugs = async () => {
    if (!currentRepo) return;
    setScanLoading(true);
    setMessages(prev => [...prev, { id: `scan_q_${Date.now()}`, role: 'user', content: '🔍 Scan this codebase for bugs and security vulnerabilities' }]);
    setIsTyping(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/chat/scan-bugs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('repochat-storage') || '{}')?.state?.token}`
        },
        body: JSON.stringify({ repoId: currentRepo._id })
      });
      const data = await res.json();
      if (data.report) {
        const scanMsgId = `scan_${Date.now()}`;
        setNewMsgIds(prev => new Set(prev).add(scanMsgId));
        setMessages(prev => [...prev, { id: scanMsgId, role: 'assistant', content: data.report }]);
        toast.success('Bug scan complete!');
      } else {
        setMessages(prev => [...prev, { id: `scan_err_${Date.now()}`, role: 'assistant', content: data.message || 'Scan could not be completed.' }]);
      }
    } catch (err) {
      console.error('Bug scan failed:', err);
      toast.error('Bug scan failed');
    } finally {
      setScanLoading(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Users className="w-4 h-4 text-primary-400" />
           <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
             Live: {userCount} {userCount === 1 ? 'dev' : 'devs'}
           </span>
        </div>
        <div className="flex items-center gap-2">
            <LLMSelector />
            <button
              onClick={() => setIsELI5(!isELI5)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isELI5 
                ? 'bg-purple-600/20 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Explain Like I'm 5"
            >
              <Baby className="w-3 h-3" />
              ELI5
            </button>
            {currentRepo?.status === 'failed' && (
              <button
                onClick={handleRetryIndexing}
                disabled={reindexLoading}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 rounded-xl text-xs font-bold transition-all border border-amber-500/30"
              >
                {reindexLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Retry indexing
              </button>
            )}
            <button 
              onClick={handleQuiz}
              disabled={quizLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700"
            >
              {quizLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <HelpCircle className="w-3 h-3" />}
              Quiz Me
            </button>
            <button
              onClick={handleScanBugs}
              disabled={scanLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl text-xs font-bold transition-all border border-red-600/20"
            >
              {scanLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldAlert className="w-3 h-3" />}
              Scan Bugs
            </button>
            <button 
              onClick={handleShare}
              disabled={shareLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary-600/10 hover:bg-primary-600/20 text-primary-400 rounded-xl text-xs font-bold transition-all border border-primary-600/20"
            >
              {shareLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Share2 className="w-3 h-3" />}
              Share
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700"
              title="Export to Markdown"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence>
          {messages.map((msg) => (
            msg.role === 'system' ? (
              <div key={msg.id} className="flex justify-center">
                <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  {msg.content}
                </span>
              </div>
            ) : (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-primary-400'
              }`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              
              <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                <div className={`px-4 py-3 rounded-2xl leading-relaxed text-sm relative group ${
                  msg.role === 'user' 
                  ? 'bg-primary-600 text-white rounded-tr-none shadow-lg shadow-primary-600/10' 
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none pr-10'
                }`}>
                  {msg.role === 'assistant' && newMsgIds.has(msg.id)
                    ? <TypewriterMessage text={msg.content} />
                    : msg.role === 'assistant'
                      ? <SmartMessage content={msg.content} />
                      : msg.content
                  }
                  
                  {msg.role === 'assistant' && (
                    <button 
                      onClick={() => handleSpeak(msg.content)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                      title={speakingText === msg.content ? "Stop reading" : "Read aloud"}
                    >
                      {speakingText === msg.content ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                
                {msg.fileRef && (
                  <button 
                    onClick={() => onFileSelect(msg.fileRef)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl text-[11px] text-primary-400 transition-all group font-mono"
                  >
                    <Terminal className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span>{msg.fileRef.path}:{msg.fileRef.startLine}</span>
                  </button>
                )}
              </div>
            </motion.div>
            )
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-primary-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none">
              <div className="flex gap-1.5 h-4 items-center">
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-6 bg-slate-950 border-t border-slate-900">
        {messages.length <= 1 && <ChatTemplates onSelect={(prompt) => setInput(prompt)} />}
        <div className="relative group">
          <textarea
            id="chat-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about the code..."
            className="w-full bg-slate-900 text-white placeholder-slate-400 border border-slate-800 rounded-2xl pl-6 pr-24 py-4 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all resize-none min-h-[56px] max-h-32 text-sm"
          />
          <div className="absolute right-3 bottom-2 flex items-center gap-2">
            <button 
              onClick={toggleListening}
              className={`p-2 rounded-xl transition-all ${
                isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'text-slate-500 hover:text-white'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button 
               onClick={handleSend}
               disabled={!input.trim() || isTyping}
               className={`p-2 rounded-xl transition-all ${
                 input.trim() && !isTyping ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
               }`}
             >
              {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;

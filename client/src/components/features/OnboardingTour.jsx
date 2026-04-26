import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

const STEPS = [
  {
    title: 'Welcome to RepoChat! 🚀',
    description: 'Your AI-powered codebase companion. Let me show you around in 30 seconds.',
    emoji: '👋'
  },
  {
    title: 'Step 1: Add Your API Key',
    description: 'Head to the Dashboard and paste your LLM API key (OpenAI, Gemini, Claude, etc.) in the "Backend Security Setup" card. Your key is encrypted server-side.',
    emoji: '🔑'
  },
  {
    title: 'Step 2: Import a Repository',
    description: 'Click "Import Repo" and paste any public GitHub URL. RepoChat will clone, parse, and index the entire codebase for AI-powered search.',
    emoji: '📦'
  },
  {
    title: 'Step 3: Start Chatting!',
    description: 'Ask questions like "Explain the architecture" or "Find security bugs". Use the template buttons for quick prompts. Toggle ELI5 mode for simple explanations.',
    emoji: '💬'
  },
  {
    title: 'Pro Tips ⚡',
    description: 'Use Ctrl+K to focus chat, Ctrl+B to toggle sidebar. Click the 🔊 icon to hear AI responses read aloud. Export chats as Markdown for your notes.',
    emoji: '⌨️'
  }
];

const OnboardingTour = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleComplete = () => {
    localStorage.setItem('repochat-onboarding-done', 'true');
    setIsVisible(false);
    setTimeout(() => onComplete?.(), 300);
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleComplete();
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!isVisible) return null;

  const currentStep = STEPS[step];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

        {/* Modal */}
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-black/50"
        >
          {/* Close */}
          <button
            onClick={handleComplete}
            className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Emoji */}
          <div className="w-16 h-16 rounded-2xl bg-primary-600/10 border border-primary-500/20 flex items-center justify-center text-3xl mb-6 shadow-lg shadow-primary-500/10">
            {currentStep.emoji}
          </div>

          {/* Content */}
          <h2 className="text-xl font-bold text-white mb-3">{currentStep.title}</h2>
          <p className="text-slate-400 leading-relaxed text-sm mb-8">{currentStep.description}</p>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-primary-500' : i < step ? 'w-1.5 bg-primary-500/50' : 'w-1.5 bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={step === 0}
              className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                step === 0
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary-600/20"
            >
              {step === STEPS.length - 1 ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Get Started!
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingTour;

import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { Github, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../components/common/ThemeProvider';
import LogoutModal from '../components/auth/LogoutModal';
import { useState, useEffect } from 'react';

const Landing = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useStore();
  const { theme, toggleTheme } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // If we have a token, this page should be invisible as we are being redirected
  if (token) return null;

  useEffect(() => {
    if (user) {
      // We don't auto-open, but we'll show it if they try to "Get Started"
    }
  }, [user]);

  const handleLoginClick = () => {
    if (user) {
      setShowLogoutModal(true);
    } else {
      handleGoogleLogin();
    }
  };

  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const handleGithubLogin = () => {
    if (user) {
      setShowLogoutModal(true);
    } else {
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      window.location.href = `${backendUrl}/api/auth/github`;
    }
  };

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col overflow-x-hidden bg-[#f5f8f8] dark:bg-[#101e22] font-['Inter',sans-serif] text-slate-900 dark:text-slate-100 antialiased">
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />

      {/* Animated Blob Background */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-[#0db9f2]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{ animationDelay: '2s' }} />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{ animationDelay: '4s' }} />

      {/* Particle Effect Overlay */}
      <div className="absolute inset-0 particle-bg pointer-events-none" />

      <div className="layout-container flex h-full grow flex-col relative z-10">
        {/* Top Navigation */}
        <header className="flex items-center justify-between px-6 py-4 lg:px-20 sticky top-0 z-50 backdrop-blur-md bg-[#f5f8f8]/80 dark:bg-[#101e22]/80 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="text-[#0db9f2]">
              <span className="material-symbols-outlined text-4xl">account_tree</span>
            </div>
            <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">RepoChat</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
            <button
              onClick={user ? () => navigate('/dashboard') : handleLoginClick}
              className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-lg h-10 px-5 bg-[#0db9f2] text-[#101e22] text-sm font-bold transition-all hover:opacity-90 active:scale-95"
            >
              {user ? 'Dashboard' : 'Sign In'}
            </button>
          </div>
        </header>

        <main className="flex-1">
          {/* Hero Section */}
          <div className="px-6 py-16 lg:py-24 max-w-7xl mx-auto flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0db9f2]/5 border border-[#0db9f2]/30 text-[#0db9f2] text-xs font-semibold mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(13,185,242,0.1)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0db9f2] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0db9f2]" />
                </span>
                New: GPT-4o Support Integrated
              </div>

              <h1 className="text-slate-900 dark:text-white text-5xl lg:text-7xl font-black leading-tight tracking-tight mb-6 max-w-4xl">
                Chat with any Git Repo{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0db9f2] via-blue-400 to-[#0db9f2] animate-text-shimmer bg-[length:200%_auto]">
                  instantly
                </span>{' '}
                in your Words
              </h1>

              <p className="text-slate-600 dark:text-slate-400 text-lg lg:text-xl max-w-2xl mb-10">
                Unlock the power of your codebase with AI-driven conversations. Understand complex logic, find bugs, and document code simply by asking.
              </p>

              {/* Auth Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button
                  onClick={user ? () => navigate('/dashboard') : handleLoginClick}
                  className="flex items-center justify-center gap-3 min-w-[240px] rounded-xl h-14 px-6 bg-white text-slate-900 border border-slate-200 shadow-sm hover:bg-slate-50 transition-all font-semibold hover:scale-[1.02] active:scale-[0.98] duration-200 shadow-lg hover:shadow-[#0db9f2]/10"
                >
                  <img
                    alt="Google Logo"
                    className="w-5 h-5"
                    src="/google-logo.svg"
                  />
                  <span>{user ? 'Go to Dashboard' : 'Sign in with Google'}</span>
                </button>

                {!user ? (
                  <button
                    onClick={handleGithubLogin}
                    className="flex items-center justify-center gap-3 min-w-[240px] rounded-xl h-14 px-6 bg-slate-900 text-white hover:bg-black transition-all font-semibold border border-slate-700 hover:scale-[1.02] active:scale-[0.98] duration-200 shadow-lg hover:shadow-[#0db9f2]/10"
                  >
                    <Github className="w-5 h-5" />
                    <span>Sign in with GitHub</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className="flex items-center justify-center gap-3 min-w-[240px] rounded-xl h-14 px-6 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-semibold hover:scale-[1.02] active:scale-[0.98] duration-200"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </motion.div>

            {/* Dashboard Preview Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-16 w-full max-w-5xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-3 overflow-hidden shadow-[0_0_50px_-12px_rgba(13,185,242,0.3)]"
            >
              <div className="rounded-lg bg-[#f5f8f8] dark:bg-[#101e22] aspect-video flex items-center justify-center border border-slate-200 dark:border-slate-800">
                <img
                  alt="Code Editor Interface with AI chat sidebar"
                  className="w-full h-full object-cover rounded-lg opacity-80"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdyJyA2L5YdzW4ald8daXsfbNOsjFeGLKPTsdkZBpCAtAMZ3c4cktuvyLlYSriPEhz5b_60KNqtF7EiIySjiJzwYbzzEwu_TVSQny-JsopYZEhMRCqePgMGQkagIonuJKzAsqkShynAY07x__37vEa376FLweBXj-Ez_x9K7IeuClXMRnLXITSESWn7uKr8yvdBwGy71BT5VQtg0qBzZoqN1zX2CPDxGDFRTiZV4fnwtQIzpgZs0C7LFObPKDSHf14_Le576dKGlwe"
                />
              </div>
            </motion.div>
          </div>

          {/* Features Section */}
          <div className="px-6 py-20 lg:px-20 bg-slate-50 dark:bg-slate-900/50">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col gap-4 mb-16">
                <h2 className="text-slate-900 dark:text-white text-3xl lg:text-4xl font-black tracking-tight">
                  Powerful Features
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl">
                  Everything you need to understand complex repositories in seconds.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard
                  icon="smart_toy"
                  title="AI-Powered Q&A"
                  description="Ask complex questions about your code and get instant, accurate answers backed by deep LLM context analysis."
                />
                <FeatureCard
                  icon="link"
                  title="Import Any Git URL"
                  description="Simply paste any public or private GitHub, GitLab, or BitBucket URL to start chatting immediately."
                />
                <FeatureCard
                  icon="verified_user"
                  title="Privacy First"
                  description="Your code stays yours. We prioritize end-to-end security and data privacy in every single interaction."
                />
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="flex flex-col gap-10 px-6 py-12 lg:px-20 border-t border-slate-200 dark:border-slate-800 bg-[#f5f8f8] dark:bg-[#101e22]">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <div className="text-[#0db9f2]">
                <span className="material-symbols-outlined text-3xl">account_tree</span>
              </div>
              <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">RepoChat</h2>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8">
              <a className="text-slate-600 dark:text-slate-400 hover:text-[#0db9f2] transition-colors text-sm font-medium cursor-not-allowed opacity-50" aria-disabled="true" title="Coming soon">Terms of Service</a>
              <a className="text-slate-600 dark:text-slate-400 hover:text-[#0db9f2] transition-colors text-sm font-medium cursor-not-allowed opacity-50" aria-disabled="true" title="Coming soon">Privacy Policy</a>
              <a className="text-slate-600 dark:text-slate-400 hover:text-[#0db9f2] transition-colors text-sm font-medium" href="mailto:support@repochat.ai">Contact Us</a>
              <a className="text-slate-600 dark:text-slate-400 hover:text-[#0db9f2] transition-colors text-sm font-medium" href="https://github.com/pramodhadapad/Repochat" target="_blank" rel="noopener noreferrer">Documentation</a>
            </div>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-sm">
              &copy; 2026 RepoChat Inc. Designed for developers who love to ship fast.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="group flex flex-col gap-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101e22] p-8 transition-all hover:shadow-lg hover:border-[#0db9f2]/50">
    <div className="w-12 h-12 rounded-xl bg-[#0db9f2]/10 flex items-center justify-center text-[#0db9f2] group-hover:bg-[#0db9f2] group-hover:text-[#101e22] transition-colors">
      <span className="material-symbols-outlined text-3xl">{icon}</span>
    </div>
    <div className="flex flex-col gap-2">
      <h3 className="text-slate-900 dark:text-white text-xl font-bold">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
  </div>
);

export default Landing;

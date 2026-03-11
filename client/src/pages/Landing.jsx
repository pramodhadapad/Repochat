import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { Github, MessageSquare, Zap, Globe, Shield, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../components/common/ThemeProvider';
import LogoutModal from '../components/auth/LogoutModal';
import ParticlesBackground from '../components/common/ParticlesBackground';
import { useState, useEffect } from 'react';

const Landing = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useStore();
  const { theme, toggleTheme } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // If we have a token, this page should be invisible as we are being redirected
  if (token) return null;

  useEffect(() => {
    // If user is already logged in, we stay on landing but flag the modal for any login clicks
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
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden selection:bg-primary-500/30 transition-colors duration-300">
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />

      <ParticlesBackground />

      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-72 h-72 bg-primary-600/10 dark:bg-primary-600/20 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-indigo-600/10 dark:bg-indigo-600/20 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-primary-600/20">
            R
          </div>
          <span className="text-2xl font-bold tracking-tight">RepoChat</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
          <button
            onClick={user ? () => navigate('/dashboard') : handleLoginClick}
            className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black font-semibold rounded-full hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-lg"
          >
            {user ? 'Dashboard' : 'Sign In'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            Chat with any <span className="bg-gradient-to-r from-primary-500 to-indigo-500 bg-clip-text text-transparent">Git Repo</span> <br />
            instantly in your Words...!
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Paste a Git URL, we index the entire codebase using AI, and you start asking questions.
            Accurate, hallucination-free, and always cited to the exact line number.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={user ? () => navigate('/dashboard') : handleLoginClick}
              className="w-full sm:w-auto px-10 py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-500 transition-all shadow-xl shadow-primary-600/30 flex items-center justify-center gap-2 group"
            >
              {user ? 'Go to Dashboard' : 'Sign in with Google'}
              <Zap className="w-5 h-5 group-hover:fill-current" />
            </button>
            {!user ? (
              <button
                onClick={handleGithubLogin}
                className="w-full sm:w-auto px-10 py-4 bg-slate-900 dark:bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-all shadow-xl shadow-slate-900/30 flex items-center justify-center gap-2"
              >
                Sign in with GitHub
                <Github className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full sm:w-auto px-10 py-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                Sign Out
              </button>
            )}
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-32 text-left">
          <FeatureCard
            icon={<MessageSquare className="w-6 h-6 text-primary-500" />}
            title="AI-Powered Q&A"
            description="Understand complex codebases in minutes. Ask about architecture, patterns, or specific logic."
          />
          <FeatureCard
            icon={<Globe className="w-6 h-6 text-indigo-500" />}
            title="Import Any Git URL"
            description="Works with GitHub, GitLab, and Bitbucket. Just paste the link and let our engine handle the rest."
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6 text-primary-500" />}
            title="Privacy First"
            description="Your code is never stored longer than needed. We only index metadata and public repositories."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-slate-100 dark:border-slate-900 mt-20 text-center text-slate-500">
        <p>&copy; 2026 RepoChat — Built for Developers by Developers</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-primary-500/30 transition-all group">
    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
  </div>
);

export default Landing;

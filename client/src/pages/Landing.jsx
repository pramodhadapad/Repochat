import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { Github, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../components/common/ThemeProvider';
import LogoutModal from '../components/auth/LogoutModal';
import { useState, useEffect } from 'react';
import TechMarquee from '../components/landing/TechMarquee';

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
    <div
      className="relative min-h-screen w-full flex flex-col overflow-x-hidden font-ferrari antialiased transition-colors duration-300"
      style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}
    >
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />

      <div className="layout-container flex h-full grow flex-col relative z-10">
        {/* Top Navigation */}
        <header
          className="flex items-center justify-between px-6 py-4 lg:px-20 transition-colors duration-300"
          style={{ backgroundColor: 'var(--theme-bg)', borderBottom: '1px solid var(--theme-border)' }}
        >
          <div className="flex items-center gap-3">
            <div style={{ color: 'var(--theme-text)' }}>
              <span className="material-symbols-outlined text-4xl">account_tree</span>
            </div>
            <h2 className="text-xl font-medium tracking-[0.08px]" style={{ color: 'var(--theme-text)' }}>RepoChat</h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded transition-colors hover:opacity-80"
              style={{ border: '1px solid var(--theme-border)' }}
              aria-label="Toggle Theme"
            >
              {theme === 'github'
                ? <Moon className="w-5 h-5" style={{ color: 'var(--theme-text)' }} />
                : <Sun className="w-5 h-5" style={{ color: 'var(--theme-text)' }} />
              }
            </button>
            <button
              onClick={user ? () => navigate('/dashboard') : handleLoginClick}
              className="flex min-w-[100px] cursor-pointer items-center justify-center rounded h-[44px] px-[10px] py-[12px] text-white text-[16px] font-normal tracking-[1.28px] transition-all hover:opacity-90"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              {user ? 'DASHBOARD' : 'SIGN IN'}
            </button>
          </div>
        </header>

        <main className="flex-1">
          {/* Hero Section */}
          <div
            className="px-6 pt-20 pb-0 lg:pt-[80px] lg:pb-0 w-full flex flex-col items-center text-center transition-colors duration-300"
            style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center w-full max-w-7xl mx-auto"
            >
              <div className="uppercase font-body text-[12px] tracking-[1px] mb-8" style={{ color: 'var(--theme-muted)' }}>
                New: GPT-4o Support Integrated
              </div>

              <h1 className="text-[32px] md:text-[52px] font-medium leading-[1.20] tracking-normal mb-6 max-w-4xl" style={{ color: 'var(--theme-text)' }}>
                Chat with any Git Repo instantly in your Words
              </h1>

              <p className="text-[14px] md:text-[16px] font-normal leading-[1.50] max-w-2xl mb-10 tracking-[0.195px]" style={{ color: 'var(--theme-muted)' }}>
                Unlock the power of your codebase with AI-driven conversations. Understand complex logic, find bugs, and document code simply by asking.
              </p>

              {/* Auth Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button
                  onClick={user ? () => navigate('/dashboard') : handleLoginClick}
                  className="flex items-center justify-center gap-3 min-w-[240px] rounded h-[44px] px-[10px] py-[12px] font-normal tracking-[1.28px] transition-colors hover:opacity-90"
                  style={{ backgroundColor: 'var(--theme-text)', color: 'var(--theme-bg)', border: '1px solid var(--theme-text)' }}
                >
                  <img
                    alt="Google Logo"
                    className="w-5 h-5"
                    src="/google-logo.svg"
                  />
                  <span>{user ? 'GO TO DASHBOARD' : 'SIGN IN WITH GOOGLE'}</span>
                </button>

                {!user ? (
                  <button
                    onClick={handleGithubLogin}
                    className="flex items-center justify-center gap-3 min-w-[240px] rounded h-[44px] px-[10px] py-[12px] bg-transparent transition-colors font-normal tracking-[1.28px] hover:opacity-80"
                    style={{ color: 'var(--theme-text)', border: '1px solid var(--theme-text)' }}
                  >
                    <Github className="w-5 h-5" />
                    <span>SIGN IN WITH GITHUB</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className="flex items-center justify-center gap-3 min-w-[240px] rounded h-[44px] px-[10px] py-[12px] bg-transparent transition-colors font-normal tracking-[1.28px] hover:opacity-80"
                    style={{ color: 'var(--theme-text)', border: '1px solid var(--theme-text)' }}
                  >
                    SIGN OUT
                  </button>
                )}
              </div>
            </motion.div>

            {/* Dashboard Preview Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-[80px] w-full max-w-5xl"
            >
              <div
                className="aspect-video flex items-center justify-center"
                style={{ backgroundColor: 'var(--theme-bg)', border: '1px solid var(--theme-border)' }}
              >
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-none"
                >
                  <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </motion.div>
          </div>

          <div
            className="w-full flex flex-col items-center pb-[60px] transition-colors duration-300"
            style={{ backgroundColor: 'var(--theme-bg)', borderBottom: '1px solid var(--theme-border)' }}
          >
            <div className="w-full mt-4 md:mt-6 lg:mt-8">
              <TechMarquee row={1} />
            </div>
            <div className="w-full mt-4 md:mt-6">
              <TechMarquee row={2} />
            </div>
          </div>

          {/* Features Section */}
          <div
            className="px-6 py-[80px] lg:px-20 transition-colors duration-300"
            style={{ backgroundColor: 'var(--theme-surface)' }}
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col gap-4 mb-16 pl-6" style={{ borderLeft: '4px solid var(--theme-primary)' }}>
                <h2 className="text-[26px] font-medium tracking-normal" style={{ color: 'var(--theme-text)' }}>
                  Powerful Features
                </h2>
                <p className="font-body uppercase text-[12px] tracking-[1px]" style={{ color: 'var(--theme-muted)' }}>
                  Everything you need to understand complex repositories in seconds.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-[40px]">
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
        <footer
          className="flex flex-col gap-10 px-6 py-[40px] lg:px-[25px] transition-colors duration-300"
          style={{ backgroundColor: 'var(--theme-surface)', color: 'var(--theme-text)' }}
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <div style={{ color: 'var(--theme-text)' }}>
                <span className="material-symbols-outlined text-3xl">account_tree</span>
              </div>
              <h2 className="text-[16px] font-medium tracking-[0.08px]" style={{ color: 'var(--theme-text)' }}>RepoChat</h2>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8">
              <a className="font-body uppercase text-[12px] tracking-[1px] cursor-not-allowed opacity-50 transition-colors" style={{ color: 'var(--theme-muted)' }} aria-disabled="true" title="Coming soon">Terms of Service</a>
              <a className="font-body uppercase text-[12px] tracking-[1px] cursor-not-allowed opacity-50 transition-colors" style={{ color: 'var(--theme-muted)' }} aria-disabled="true" title="Coming soon">Privacy Policy</a>
              <a className="font-body uppercase text-[12px] tracking-[1px] transition-colors hover:opacity-80" style={{ color: 'var(--theme-muted)' }} href="mailto:support@repochat.ai">Contact Us</a>
              <a className="font-body uppercase text-[12px] tracking-[1px] transition-colors hover:opacity-80" style={{ color: 'var(--theme-muted)' }} href="https://github.com/pramodhadapad/Repochat" target="_blank" rel="noopener noreferrer">Documentation</a>
            </div>
          </div>
          <div className="text-center mt-[40px]">
            <p className="font-body uppercase text-[11px] tracking-[1px]" style={{ color: 'var(--theme-muted)' }}>
              &copy; 2026 RepoChat Inc. Designed for developers who love to ship fast.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="group flex flex-col gap-5 pb-6 transition-all bg-transparent" style={{ borderBottom: '1px solid var(--theme-border)' }}>
    <div className="w-12 h-12 flex items-center" style={{ color: 'var(--theme-text)' }}>
      <span className="material-symbols-outlined text-3xl">{icon}</span>
    </div>
    <div className="flex flex-col gap-2">
      <h3 className="text-[24px] font-normal" style={{ color: 'var(--theme-text)' }}>{title}</h3>
      <p className="text-[13px] font-normal leading-[1.50] tracking-[0.195px]" style={{ color: 'var(--theme-muted)' }}>{description}</p>
    </div>
  </div>
);

export default Landing;

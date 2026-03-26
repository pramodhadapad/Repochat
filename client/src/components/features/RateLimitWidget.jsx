import { useState, useEffect } from 'react';
import { Activity, Clock, Zap } from 'lucide-react';

/**
 * Displays the user's current rate limit status.
 * Shows requests used vs total, with a progress bar and reset timer.
 * Uses localStorage to track client-side request counts since the server
 * uses express-rate-limit which returns headers.
 */
const RateLimitWidget = () => {
  const [stats, setStats] = useState({
    used: 0,
    limit: 30,
    resetIn: '--:--',
  });

  useEffect(() => {
    // Read from localStorage (set by API interceptor)
    const updateStats = () => {
      const stored = JSON.parse(localStorage.getItem('repochat-rate-stats') || '{}');
      setStats({
        used: stored.used || 0,
        limit: stored.limit || 30,
        resetIn: stored.resetIn || '--:--',
      });
    };
    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const percentage = Math.min((stats.used / stats.limit) * 100, 100);
  const isWarning = percentage > 70;
  const isDanger = percentage > 90;

  return (
    <div className="bg-white/5 dark:bg-slate-900/30 border border-white/[0.08] backdrop-blur-md p-5 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-green-400'}`} />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rate Limit</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <Clock className="w-3 h-3" />
          <span>Resets: {stats.resetIn}</span>
        </div>
      </div>

      <div className="flex items-end justify-between mb-2">
        <span className={`text-2xl font-bold ${isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-green-400'}`}>
          {stats.used}
        </span>
        <span className="text-xs text-slate-500">/ {stats.limit} requests</span>
      </div>

      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isDanger && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-red-400">
          <Zap className="w-3 h-3" />
          <span>Approaching limit — responses may slow down</span>
        </div>
      )}
    </div>
  );
};

export default RateLimitWidget;

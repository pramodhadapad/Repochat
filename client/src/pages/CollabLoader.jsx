import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const CollabLoader = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const resolveShare = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('repochat-storage') || '{}')?.state?.token;
        if (!token) {
          toast.error('Please login to join the collaboration.');
          navigate('/');
          return;
        }

        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/share/${shareId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data && res.data.repoId) {
          const repoId = typeof res.data.repoId === 'object' ? res.data.repoId._id : res.data.repoId;
          navigate(`/repo/${repoId}`);
        } else {
          setError('Invalid collaboration link.');
        }
      } catch (err) {
        console.error('Resolve Share Error:', err);
        setError('Collaboration link expired or not found.');
      }
    };

    resolveShare();
  }, [shareId, navigate]);

  if (error) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-6 opacity-50" />
        <h2 className="text-2xl font-bold text-slate-200 mb-2">Oops!</h2>
        <p className="text-slate-400 max-w-sm mb-6">{error}</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-xl text-primary-400 hover:text-white transition-all font-bold"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-4" />
      <p className="text-slate-400 font-medium animate-pulse uppercase tracking-[0.2em] text-xs">Resolving Collaboration...</p>
    </div>
  );
};

export default CollabLoader;

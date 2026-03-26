import { Sparkles, FileSearch, ShieldAlert, Cpu } from 'lucide-react';

const templates = [
  {
    icon: <Cpu className="w-4 h-4" />,
    label: 'Explain Architecture',
    prompt: 'Can you explain the high-level architecture of this repository? What are the core components?'
  },
  {
    icon: <ShieldAlert className="w-4 h-4" />,
    label: 'Find Bugs',
    prompt: 'Are there any obvious security vulnerabilities or major bugs in this codebase?'
  },
  {
    icon: <FileSearch className="w-4 h-4" />,
    label: 'List API Endpoints',
    prompt: 'Can you list all the major API endpoints and their purposes?'
  },
  {
    icon: <Sparkles className="w-4 h-4" />,
    label: 'How does Auth work?',
    prompt: 'Explain the authentication and authorization flow in this application.'
  }
];

const ChatTemplates = ({ onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {templates.map((t, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(t.prompt)}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-all duration-300 border border-slate-700/50 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10 group"
        >
          <span className="text-primary-400 group-hover:text-primary-300 transition-colors">
            {t.icon}
          </span>
          {t.label}
        </button>
      ))}
    </div>
  );
};

export default ChatTemplates;

import React from 'react';
import { 
  Files, 
  Search, 
  GitBranch, 
  Play, 
  Blocks, 
  Settings, 
  CircleUserRound, 
  TestTube2,
  Home
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ActivityBar = ({ activeTab, onTabChange }) => {
  const topItems = [
    { id: 'home', icon: Home, label: 'Dashboard' },
    { id: 'explorer', icon: Files, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'git', icon: GitBranch, label: 'Source Control' },
    { id: 'debug', icon: Play, label: 'Run and Debug' },
    { id: 'testing', icon: TestTube2, label: 'Testing' },
  ];

  const bottomItems = [];


  const NavItem = ({ item }) => {
    const isActive = activeTab === item.id;
    const Icon = item.icon;

    return (
      <div
        className={cn(
          "group relative flex items-center justify-center w-12 h-12 cursor-pointer transition-colors",
          isActive ? "text-white" : "text-[#858585] hover:text-[#d7d7d7]"
        )}
        onClick={() => onTabChange(item.id)}
        title={item.label}
      >
        {isActive && (
          <div className="absolute left-0 w-[2px] h-full bg-[#007acc]" />
        )}
        <Icon className={cn("w-6 h-6", isActive ? "scale-100" : "scale-90 group-hover:scale-100 transition-transform")} strokeWidth={1.5} />
      </div>
    );
  };

  return (
    <div className="w-12 h-full bg-[#333333] flex flex-col items-center justify-between py-2 border-r border-[#2b2b2b]">
      <div className="flex flex-col w-full gap-0.5">
        {topItems.map((item) => <NavItem key={item.id} item={item} />)}
      </div>
      <div className="flex flex-col w-full gap-0.5">
        {bottomItems.map((item) => <NavItem key={item.id} item={item} />)}
      </div>
    </div>
  );
};

export default ActivityBar;

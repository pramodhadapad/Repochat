import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const TopMenuBar = ({ onCommand }) => {
  const menus = [
    { label: 'File', items: [
        { label: 'New Text File', cmd: 'FILE_NEW_FILE' },
        { label: 'New File...', cmd: 'FILE_NEW_FILE' },
        { label: 'Separator' },
        { label: 'Open Folder...', cmd: 'FILE_OPEN_FOLDER' },
        { label: 'Separator' },
        { label: 'Save', cmd: 'FILE_SAVE' },
        { label: 'Exit', cmd: 'EXIT' }
    ]},
    { label: 'Edit', items: [
        { label: 'Undo' }, 
        { label: 'Redo' }, 
        { label: 'Separator' }, 
        { label: 'Cut' }, 
        { label: 'Copy' }, 
        { label: 'Paste' }
    ]},
    { label: 'Selection', items: [
        { label: 'Select All' }, 
        { label: 'Expand Selection' }
    ]},
    { label: 'View', items: [
        { label: 'Toggle Sidebar', cmd: 'VIEW_TOGGLE_SIDEBAR' },
        { label: 'Toggle Panel', cmd: 'VIEW_TOGGLE_PANEL' },
        { label: 'Appearance' }
    ]},
    { label: 'Go', items: [
        { label: 'Back' }, 
        { label: 'Forward' }
    ]},
    { label: 'Run', items: [
        { label: 'Start Debugging' }
    ]},
    { label: 'Terminal', items: [
        { label: 'New Terminal', cmd: 'NAV_TERMINAL' }
    ]},
    { label: 'Help', items: [
        { label: 'Documentation' },
        { label: 'About', cmd: 'HELP_ABOUT' }
    ]},
  ];

  return (
    <div className="h-9 bg-[#1e1e1e] border-b border-[#2b2b2b] flex items-center px-2 select-none z-50">
      <div className="flex items-center gap-1">
        <div className="w-5 h-5 mr-2 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.5 1H1.5C1.22386 1 1 1.22386 1 1.5V14.5C1 14.7761 1.22386 15 1.5 15H14.5C14.7761 15 15 14.7761 15 14.5V1.5C15 1.22386 14.7761 1 14.5 1ZM14 14H2V2H14V14Z" fill="#007ACC"/>
                <path d="M12 4H4V12H12V4ZM11 11H5V5H11V11Z" fill="#007ACC"/>
            </svg>
        </div>
        {menus.map((menu) => (
          <DropdownMenu.Root key={menu.label}>
            <DropdownMenu.Trigger asChild>
              <button className="px-3 py-1 text-[13px] text-[#cccccc] hover:bg-[#333333] hover:text-white rounded transition-colors outline-none">
                {menu.label}
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content 
                className="min-w-[200px] bg-[#252526] border border-[#454545] p-1 shadow-xl z-[100] animate-in fade-in zoom-in duration-75"
                sideOffset={2}
                align="start"
              >
                {menu.items.map((item, idx) => {
                  if (item.label === 'Separator') {
                    return <div key={`sep-${idx}`} className="h-[1px] bg-[#454545] my-1 mx-2" />;
                  }
                  
                  const label = typeof item === 'string' ? item : item.label;
                  const cmd = typeof item === 'string' ? null : item.cmd;

                  return (
                    <DropdownMenu.Item 
                      key={`${label}-${idx}`}
                      onClick={() => cmd && onCommand(cmd)}
                      className="flex items-center px-6 py-1.5 text-[13px] text-[#cccccc] hover:bg-[#007acc] hover:text-white outline-none cursor-default rounded-sm"
                    >
                      {label}
                    </DropdownMenu.Item>
                  );
                })}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ))}
      </div>
      <div className="flex-1 flex justify-center overflow-hidden">
         <span className="text-[12px] text-[#858585] truncate max-w-[400px]">
            RepoChat — Visual Studio Code AI Edition
         </span>
      </div>
    </div>
  );
};

export default TopMenuBar;


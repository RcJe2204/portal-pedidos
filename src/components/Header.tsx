'use client'

import React from 'react';
import { Bell } from 'lucide-react';

interface HeaderProps {
  isCollapsed: boolean;
}

const Header: React.FC<HeaderProps> = ({ isCollapsed }) => {
  return (
    <header className={'fixed top-0 z-40 h-16 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 flex items-center justify-between ' + (isCollapsed ? 'left-16' : 'left-64') + ' right-0 transition-all duration-300'}>
      <div className="text-xl font-semibold text-gray-900">Dashboard</div>
      <div className="flex items-center gap-4">
        <Bell className="h-5 w-5 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors" />
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500 text-sm font-medium text-white">
          AD
        </div>
      </div>
    </header>
  );
};

export default Header;
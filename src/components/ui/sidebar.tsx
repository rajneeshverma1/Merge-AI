'use client';

import React from 'react';
import { X, MessageSquare, User } from 'lucide-react';

interface SidebarProps {
  leftSidebarOpen: boolean;
  closeSidebar: () => void;
}

const Sidebar = ({ leftSidebarOpen, closeSidebar }: SidebarProps) => {
  return (
    <>
      {leftSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-72 bg-stone-900/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          leftSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5">
            <h2 className="text-white text-lg font-semibold tracking-tight">Merge AI</h2>
            <button
              onClick={closeSidebar}
              className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat History */}
          <nav className="flex-1 px-4 py-2">
            <ul className="space-y-2">
              <li>
                <button className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl bg-stone-800/60 hover:bg-stone-800 text-stone-200 hover:text-white transition-colors">
                  <MessageSquare className="w-5 h-5 text-stone-400" />
                  <span className="text-sm font-medium">Chat History</span>
                </button>
              </li>
            </ul>
          </nav>

          {/* Profile footer */}
          <div className="p-5 bg-stone-900/50">
            <div className="flex items-center space-x-3 text-stone-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
                <User className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">User Account</span>
                <span className="text-xs text-stone-400">Local Session</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

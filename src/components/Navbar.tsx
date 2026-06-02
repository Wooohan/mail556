import React from 'react';
import { Mail, Users, Send, Settings, Database, RefreshCw } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onResetAll: () => void;
}

export default function Navbar({ activeTab, setActiveTab, onResetAll }: NavbarProps) {
  const navItems = [
    { id: 'accounts', label: 'Gmail Accounts', icon: Mail },
    { id: 'contacts', label: 'Contacts List', icon: Users },
    { id: 'campaigns', label: 'Campaigns Panel', icon: Send },
  ];

  return (
    <header id="nav-header" className="sticky top-0 z-50 bg-white border-b border-gray-100 card-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center text-white font-medium shadow-md">
              <Send className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl tracking-tight text-gray-950">
                Equinox <span className="text-brand-gradient">Mail</span>
              </h1>
              <p className="text-[10px] font-mono text-gray-400 tracking-wider uppercase -mt-1">Paced Cold Emailing</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50/50 text-[#7C5CFC] font-semibold border-b-2 border-[#7C5CFC] rounded-b-none'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#7C5CFC]' : 'text-gray-400'}`} />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Action Trigger */}
          <div className="flex items-center">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to reset all data? This deletes all campaigns, contacts, and connected accounts.')) {
                  onResetAll();
                }
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border border-dashed border-red-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Full Reset</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}

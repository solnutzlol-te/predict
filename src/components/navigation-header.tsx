/**
 * Navigation header component
 * Displays top navigation bar with logo, menu items, and social links
 * Based on professional crypto platform design
 */

import { Github, Twitter, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationHeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function NavigationHeader({ activeTab = 'predictions', onTabChange }: NavigationHeaderProps) {
  const navItems = [
    { id: 'predictions', label: 'Predictions' },
    { id: 'charts', label: 'Charts' },
    { id: 'backtesting', label: 'Backtesting' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'history', label: 'History' },
    { id: 'watchlist', label: 'Watchlist' },
  ];

  const handleNavClick = (id: string) => {
    if (onTabChange) {
      onTabChange(id);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800/50 bg-black/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path 
                  d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">monfutures</span>
          </div>

          {/* Navigation Menu */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? 'text-white bg-gray-800'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg"
              asChild
            >
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github size={20} />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg"
              asChild
            >
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <Twitter size={20} />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg"
              asChild
            >
              <a href="https://t.me" target="_blank" rel="noopener noreferrer">
                <Send size={20} />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { Button } from './ui/Button';

interface AppShellProps {
  children: React.ReactNode;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', path: '/' },
  { id: 'scripts', label: 'Scripts', icon: '📄', path: '/scripts' },
  { id: 'summaries', label: 'Summaries', icon: '📝', path: '/summaries' },
  { id: 'compare', label: 'Compare', icon: '⚖️', path: '/compare' },
  { id: 'settings', label: 'Settings', icon: '⚙️', path: '/settings' },
];

const pageVariants = {
  initial: { opacity: 0, x: -20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: 20 }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4
};

const sidebarVariants = {
  open: { width: '240px', opacity: 1 },
  closed: { width: '64px', opacity: 0.9 }
};

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { theme, setTheme, animationsEnabled, toggleAnimations } = useTheme();
  const [activeNavItem, setActiveNavItem] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleNavItemClick = (itemId: string) => {
    setActiveNavItem(itemId);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        className="bg-slate-800 border-r border-slate-700 flex flex-col"
        variants={sidebarVariants}
        animate={sidebarCollapsed ? 'closed' : 'open'}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-lg font-bold text-gradient">
                  Script Analyzer
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Secure & Private
                </p>
              </motion.div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="p-2 hover:bg-slate-700"
            >
              <span className="text-slate-400">
                {sidebarCollapsed ? '→' : '←'}
              </span>
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.id}>
                <motion.button
                  className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
                    activeNavItem === item.id
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                  onClick={() => handleNavItemClick(item.id)}
                  whileHover={animationsEnabled ? { scale: 1.02 } : {}}
                  whileTap={animationsEnabled ? { scale: 0.98 } : {}}
                  transition={{ duration: 0.15 }}
                >
                  <span className="text-lg mr-3">{item.icon}</span>
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span
                        className="font-medium"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex flex-col space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="justify-start p-2 hover:bg-slate-700"
            >
              <span className="text-lg mr-3">
                {theme === 'dark' ? '☀️' : '🌙'}
              </span>
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    className="text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAnimations}
              className="justify-start p-2 hover:bg-slate-700"
            >
              <span className="text-lg mr-3">
                {animationsEnabled ? '🎬' : '⏸️'}
              </span>
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    className="text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {animationsEnabled ? 'Animations On' : 'Animations Off'}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-slate-800 border-b border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-100">
                {navigationItems.find(item => item.id === activeNavItem)?.label || 'Dashboard'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Manage your script analysis workflow
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm">
                Help
              </Button>
              <Button variant="primary" size="sm">
                Upload Script
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content with Transitions */}
        <main className="flex-1 overflow-auto bg-slate-900">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeNavItem}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';

interface ToastNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  isVisible,
  onClose,
  title,
  message,
  type = 'success',
  duration = 4000,
}) => {
  const { animationsEnabled } = useTheme();

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 border-green-500 text-green-50';
      case 'info':
        return 'bg-blue-600 border-blue-500 text-blue-50';
      case 'warning':
        return 'bg-yellow-600 border-yellow-500 text-yellow-50';
      case 'error':
        return 'bg-red-600 border-red-500 text-red-50';
      default:
        return 'bg-green-600 border-green-500 text-green-50';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '✅';
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-4 right-4 z-40 max-w-sm"
        initial={animationsEnabled ? { opacity: 0, x: 300, scale: 0.8 } : { opacity: 1 }}
        animate={animationsEnabled ? { opacity: 1, x: 0, scale: 1 } : { opacity: 1 }}
        exit={animationsEnabled ? { opacity: 0, x: 300, scale: 0.8 } : { opacity: 0 }}
        transition={{ duration: 0.3, ease: 'backOut' }}
      >
        <div className={`rounded-lg border shadow-lg p-4 ${getTypeStyles()}`}>
          <div className="flex items-start space-x-3">
            <span className="text-xl flex-shrink-0 mt-0.5">
              {getTypeIcon()}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm mb-1">
                {title}
              </h4>
              <p className="text-sm opacity-90">
                {message}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Progress bar */}
          <motion.div
            className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
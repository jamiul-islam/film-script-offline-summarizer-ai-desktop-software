import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';

interface ConfettiAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
  message?: string;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
}

const confettiColors = [
  '#FFD700', // Gold
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Light Yellow
  '#BB8FCE', // Light Purple
];

const generateConfetti = (count: number): ConfettiPiece[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100, // Percentage across screen
    y: -10, // Start above screen
    rotation: Math.random() * 360,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    size: Math.random() * 8 + 4, // 4-12px
    delay: Math.random() * 0.5, // 0-0.5s delay
  }));
};

export const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({
  isVisible,
  onComplete,
  message = 'Analysis Complete! 🎉',
}) => {
  const { animationsEnabled } = useTheme();
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (isVisible && animationsEnabled) {
      setConfettiPieces(generateConfetti(50));

      // Auto-hide after animation completes
      const timer = setTimeout(() => {
        onComplete();
      }, 4000);

      return () => clearTimeout(timer);
    } else if (isVisible && !animationsEnabled) {
      // If animations are disabled, just show the message briefly
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, animationsEnabled, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Confetti Pieces */}
        {animationsEnabled &&
          confettiPieces.map(piece => (
            <motion.div
              key={piece.id}
              className="absolute"
              style={{
                left: `${piece.x}%`,
                width: `${piece.size}px`,
                height: `${piece.size}px`,
                backgroundColor: piece.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
              initial={{
                y: piece.y,
                rotate: piece.rotation,
                scale: 0,
              }}
              animate={{
                y: window.innerHeight + 100,
                rotate: piece.rotation + 720, // Two full rotations
                scale: [0, 1, 1, 0.8],
              }}
              transition={{
                duration: 3 + Math.random() * 2, // 3-5 seconds
                delay: piece.delay,
                ease: 'easeOut',
                scale: {
                  times: [0, 0.1, 0.9, 1],
                  duration: 3 + Math.random() * 2,
                },
              }}
            />
          ))}

        {/* Success Message */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -50 }}
          transition={{
            duration: 0.6,
            ease: 'backOut',
            delay: 0.2,
          }}
        >
          <motion.div
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-4 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm"
            animate={
              animationsEnabled
                ? {
                    scale: [1, 1.05, 1],
                    rotate: [0, 1, -1, 0],
                  }
                : {}
            }
            transition={{
              duration: 2,
              repeat: 1,
              ease: 'easeInOut',
            }}
          >
            <div className="text-center">
              <motion.div
                className="text-3xl mb-2"
                animate={
                  animationsEnabled
                    ? {
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.2, 1],
                      }
                    : {}
                }
                transition={{
                  duration: 1,
                  repeat: 2,
                  ease: 'easeInOut',
                }}
              >
                🎉
              </motion.div>
              <h3 className="text-xl font-bold mb-1">{message}</h3>
              <p className="text-sm opacity-90">
                Your script summary is ready to view!
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Sparkle Effects */}
        {animationsEnabled &&
          Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute w-2 h-2 bg-yellow-300 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                rotate: 360,
              }}
              transition={{
                duration: 2,
                delay: Math.random() * 3,
                repeat: 1,
                ease: 'easeInOut',
              }}
            />
          ))}

        {/* Overlay for click to dismiss */}
        <motion.div
          className="absolute inset-0 bg-black/10 cursor-pointer pointer-events-auto"
          onClick={onComplete}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

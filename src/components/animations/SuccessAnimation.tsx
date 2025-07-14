
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { Check, ShoppingBag, Printer } from 'lucide-react';

interface SuccessAnimationProps {
  show: boolean;
  message: string;
  subMessage?: string;
  onComplete?: () => void;
  type?: 'sale' | 'print' | 'generic';
}

const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  show,
  message,
  subMessage,
  onComplete,
  type = 'generic'
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (show) {
      setShowConfetti(true);
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
      
      const timer = setTimeout(() => {
        setShowConfetti(false);
        if (onComplete) {
          setTimeout(onComplete, 500);
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  const getIcon = () => {
    switch (type) {
      case 'sale':
        return <ShoppingBag className="w-16 h-16 text-white" />;
      case 'print':
        return <Printer className="w-16 h-16 text-white" />;
      default:
        return <Check className="w-16 h-16 text-white" />;
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {showConfetti && (
        <Confetti
          width={dimensions.width}
          height={dimensions.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.15}
        />
      )}
      
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          transition: { 
            type: 'spring',
            stiffness: 300,
            damping: 20
          }
        }}
        exit={{ scale: 0.5, opacity: 0 }}
        className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ 
            scale: 1,
            transition: { 
              delay: 0.2,
              type: 'spring',
              stiffness: 300,
              damping: 20
            }
          }}
          className="rounded-full bg-white/20 p-4 inline-flex items-center justify-center mb-6"
        >
          {getIcon()}
        </motion.div>
        
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
            transition: { delay: 0.3 }
          }}
          className="text-2xl font-bold text-white mb-2"
        >
          {message}
        </motion.h2>
        
        {subMessage && (
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ 
              y: 0, 
              opacity: 1,
              transition: { delay: 0.4 }
            }}
            className="text-white/80"
          >
            {subMessage}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

export default SuccessAnimation;


import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface CartItemAnimationProps {
  isVisible: boolean;
  productName: string;
  onComplete?: () => void;
}

const CartItemAnimation: React.FC<CartItemAnimationProps> = ({ 
  isVisible, 
  productName, 
  onComplete 
}) => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        if (onComplete) onComplete();
      }, 1200);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          className="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 
                    bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3"
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { 
              type: 'spring',
              stiffness: 500,
              damping: 25
            }
          }}
          exit={{ 
            opacity: 0, 
            y: -30, 
            scale: 0.8,
            transition: { duration: 0.2 } 
          }}
        >
          <Sparkles className="w-5 h-5 text-yellow-200 animate-pulse" />
          <span className="font-semibold text-lg">¡{productName} agregado!</span>
          <Sparkles className="w-5 h-5 text-yellow-200 animate-pulse" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CartItemAnimation;

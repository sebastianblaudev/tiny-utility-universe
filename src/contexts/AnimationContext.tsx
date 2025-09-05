
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type AnimationLevel = 'none' | 'minimal' | 'moderate' | 'high';

interface AnimationContextType {
  animationLevel: AnimationLevel;
  setAnimationLevel: (level: AnimationLevel) => void;
  isEnabled: boolean;
  enableAnimations: () => void;
  disableAnimations: () => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export const AnimationProvider = ({ children }: { children: ReactNode }) => {
  const [animationLevel, setAnimationLevel] = useState<AnimationLevel>('moderate');
  const [isEnabled, setIsEnabled] = useState(true);

  const enableAnimations = () => setIsEnabled(true);
  const disableAnimations = () => setIsEnabled(false);

  return (
    <AnimationContext.Provider 
      value={{ 
        animationLevel, 
        setAnimationLevel, 
        isEnabled, 
        enableAnimations, 
        disableAnimations 
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};

// Animation variants for reuse throughout the app
export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export const slideInVariants = {
  hidden: { x: 20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } },
  exit: { x: -20, opacity: 0, transition: { duration: 0.2 } }
};

export const scaleInVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } },
  exit: { scale: 0.95, opacity: 0, transition: { duration: 0.2 } }
};

export const itemAddedVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 500, damping: 25 } },
  exit: { scale: 0.8, opacity: 0, transition: { duration: 0.2 } }
};

export const successVariants = {
  hidden: { scale: 0.5, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      type: 'spring',
      stiffness: 300,
      damping: 20
    }
  },
  exit: { scale: 1.2, opacity: 0, transition: { duration: 0.3 } }
};

// Reusable animated components
export const AnimatedPage: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isEnabled } = useAnimation();
  
  if (!isEnabled) return <>{children}</>;
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeInVariants}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

export const AnimatedCard: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isEnabled } = useAnimation();
  
  if (!isEnabled) return <>{children}</>;
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={scaleInVariants}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
};

export const AnimatedItem: React.FC<{ children: ReactNode; delay?: number }> = ({ 
  children, 
  delay = 0 
}) => {
  const { isEnabled } = useAnimation();
  
  if (!isEnabled) return <>{children}</>;
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={itemAddedVariants}
      transition={{ delay }}
      layout
    >
      {children}
    </motion.div>
  );
};

export const AnimatedList: React.FC<{ 
  children: ReactNode;
  staggerChildren?: number;
}> = ({ 
  children, 
  staggerChildren = 0.05
}) => {
  const { isEnabled } = useAnimation();
  
  if (!isEnabled) return <>{children}</>;
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{
        visible: {
          transition: { 
            staggerChildren 
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedSuccess: React.FC<{ 
  show: boolean;
  children: ReactNode;
}> = ({ 
  show,
  children
}) => {
  const { isEnabled } = useAnimation();
  
  if (!isEnabled) return show ? <>{children}</> : null;
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={successVariants}
          className="flex items-center justify-center absolute inset-0 z-50"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const AnimatedButton: React.FC<{
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ children, onClick, className = "" }) => {
  const { isEnabled } = useAnimation();
  
  if (!isEnabled) return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
  
  return (
    <motion.button
      onClick={onClick}
      className={className}
      whileTap={{ scale: 0.95 }}
      whileHover={{ 
        scale: 1.03,
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
      }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.button>
  );
};

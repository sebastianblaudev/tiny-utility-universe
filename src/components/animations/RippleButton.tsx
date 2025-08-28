
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface RippleButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  color?: string;
}

interface Ripple {
  x: number;
  y: number;
  id: number;
}

const RippleButton: React.FC<RippleButtonProps> = ({ 
  children, 
  className = "", 
  onClick, 
  color = "rgba(255, 255, 255, 0.5)" 
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const id = Date.now();
    const newRipple = { x, y, id };
    
    setRipples(prevRipples => [...prevRipples, newRipple]);
    
    if (onClick) onClick();
  };
  
  useEffect(() => {
    const duration = 600;
    
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples(prevRipples => prevRipples.slice(1));
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [ripples]);
  
  return (
    <motion.button
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
      whileTap={{ scale: 0.97 }}
    >
      {children}
      
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
            backgroundColor: color,
            borderRadius: '50%',
            pointerEvents: 'none'
          }}
          initial={{ width: 0, height: 0, opacity: 0.6 }}
          animate={{ 
            width: 300, 
            height: 300, 
            opacity: 0,
            transition: {
              duration: 0.6,
              ease: 'easeOut'
            }
          }}
        />
      ))}
    </motion.button>
  );
};

export default RippleButton;

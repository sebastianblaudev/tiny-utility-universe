
import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { Wifi, WifiOff } from 'lucide-react';

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const isOnline = useOnlineStatus();

  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    in: {
      opacity: 1,
      y: 0,
    },
    exit: {
      opacity: 0,
      y: -20,
    },
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.3,
  };

  return (
    <>
      {!isOnline && (
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-0 left-0 right-0 bg-red-500 text-white py-2 px-4 text-center z-50 flex items-center justify-center gap-2"
        >
          <WifiOff size={18} />
          <span>Sin conexión! Los datos se sincronizarán cuando vuelva en línea.</span>
        </motion.div>
      )}

      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
        className="h-full w-full"
      >
        {children}
      </motion.div>

      {isOnline && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="fixed bottom-4 right-4 bg-green-500 text-white py-1 px-3 rounded-full text-xs flex items-center gap-1 opacity-70"
        >
          <Wifi size={12} />
          <span>Conectado</span>
        </motion.div>
      )}
    </>
  );
};

export default PageTransition;

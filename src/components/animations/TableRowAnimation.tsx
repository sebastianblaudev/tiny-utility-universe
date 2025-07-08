
import React from 'react';
import { motion } from 'framer-motion';

interface TableRowAnimationProps {
  children: React.ReactNode;
  index: number;
}

const TableRowAnimation: React.FC<TableRowAnimationProps> = ({ children, index }) => {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: { 
          delay: index * 0.05,
          duration: 0.2
        }
      }}
      exit={{ opacity: 0, y: 20 }}
      whileHover={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        transition: { duration: 0.1 }
      }}
      className="transition-colors"
    >
      {children}
    </motion.tr>
  );
};

export default TableRowAnimation;

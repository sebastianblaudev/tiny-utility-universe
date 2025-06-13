
import { useState } from 'react';

export const useSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const toggle = () => setIsOpen(!isOpen);

  return {
    isOpen,
    onOpen,
    onClose,
    toggle
  };
};

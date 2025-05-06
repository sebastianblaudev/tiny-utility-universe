
import React from 'react';
import confetti from 'canvas-confetti';

export const useConfetti = () => {
  const showConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return { showConfetti };
};

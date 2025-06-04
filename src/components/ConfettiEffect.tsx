
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';

const ConfettiEffect = () => {
  const { width, height } = useWindowSize();
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    // Automatically stop confetti after 5 seconds
    const timer = setTimeout(() => {
      setIsActive(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!isActive) return null;

  return (
    <Confetti
      width={width}
      height={height}
      recycle={false}
      numberOfPieces={300}
      gravity={0.3}
      colors={['#F2FCE2', '#FEF7CD', '#FEC6A1', '#E5DEFF', '#FFDEE2', '#FDE1D3', '#D3E4FD', '#8B5CF6', '#D946EF', '#F97316', '#0EA5E9']}
    />
  );
};

export default ConfettiEffect;

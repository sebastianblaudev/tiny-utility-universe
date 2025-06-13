
import { useEffect, useState } from 'react';
import { Scissors } from 'lucide-react';

interface LoadingScreenProps {
  onComplete?: () => void;
  duration?: number;
}

const LoadingScreen = ({ onComplete, duration = 3000 }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Iniciando BarberPOS...');

  const loadingMessages = [
    'Iniciando BarberPOS...',
    'Preparando herramientas...',
    'Configurando sistema...',
    '¡Listo para cortar!'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2;
        
        // Change loading text based on progress
        if (newProgress >= 25 && newProgress < 50) {
          setLoadingText(loadingMessages[1]);
        } else if (newProgress >= 50 && newProgress < 75) {
          setLoadingText(loadingMessages[2]);
        } else if (newProgress >= 75) {
          setLoadingText(loadingMessages[3]);
        }
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete?.(), 500);
          return 100;
        }
        
        return newProgress;
      });
    }, duration / 50);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/10 via-black to-gray-950/20"></div>
      
      {/* Minimal floating particles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-0.5 h-0.5 bg-white/20 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/3 w-0.5 h-0.5 bg-white/10 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/2 w-0.5 h-0.5 bg-white/15 rounded-full animate-pulse delay-700"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center space-y-12">
        {/* Logo - Clean and minimalist */}
        <div className="transform animate-fade-in">
          <img 
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/37y33OJ-clLqDjKmKEn8VUHgWWwNkNEj4nv5RZ.png" 
            alt="BarberPOS Logo" 
            className="h-24 w-auto mx-auto filter drop-shadow-2xl transition-all duration-500 hover:scale-105"
          />
        </div>

        {/* App Title with minimal styling */}
        <div className="space-y-3">
          <h1 className="text-2xl font-light text-white tracking-wider">
            BarberPOS
          </h1>
          <p className="text-gray-400 text-xs font-light tracking-widest uppercase">
            Sistema Profesional
          </p>
        </div>

        {/* Loading Text */}
        <p className="text-gray-300 text-sm font-light tracking-wide">
          {loadingText}
        </p>

        {/* Minimal Progress Bar */}
        <div className="w-64 mx-auto space-y-4">
          <div className="bg-gray-800/30 rounded-full h-px overflow-hidden">
            <div 
              className="bg-white/60 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            >
            </div>
          </div>
          <p className="text-gray-500 text-xs font-light tracking-wider">
            {progress}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;

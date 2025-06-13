
import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

interface LoginSuccessEffectProps {
  isActive: boolean;
  onComplete: () => void;
  userName?: string;
}

const LoginSuccessEffect = ({ isActive, onComplete, userName }: LoginSuccessEffectProps) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    // Show content after a brief delay
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 200);

    // Complete effect after 2 seconds (reduced from 3)
    const completeTimer = setTimeout(() => {
      setShowContent(false);
      setTimeout(onComplete, 300);
    }, 2000);

    return () => {
      clearTimeout(contentTimer);
      clearTimeout(completeTimer);
    };
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Simple background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-black to-gray-950/20"></div>

      {/* Main content */}
      <div 
        className={`
          relative z-10 text-center transform transition-all duration-500 ease-out
          ${showContent 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
          }
        `}
      >
        {/* Simple check icon */}
        <div className="mb-6">
          <CheckCircle className="h-16 w-16 mx-auto text-green-400" />
        </div>

        {/* Clean text */}
        <div className="space-y-3">
          <h1 className="text-2xl font-light text-white">
            Acceso Concedido
          </h1>
          
          {userName && (
            <p className="text-lg text-gray-300 font-light">
              Bienvenido, <span className="text-white">{userName}</span>
            </p>
          )}
          
          <div className="flex items-center justify-center space-x-2 text-gray-400 mt-4">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-light">Cargando BarberPOS...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSuccessEffect;

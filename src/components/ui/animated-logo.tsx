
import { useState, useEffect } from 'react';
import { Scissors } from 'lucide-react';

interface AnimatedLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const AnimatedLogo = ({ className = "", size = "md", showText = true }: AnimatedLogoProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const sizeClasses = {
    sm: "h-12 w-auto",
    md: "h-16 w-auto", 
    lg: "h-20 w-auto",
    xl: "h-24 w-auto"
  };

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      {/* Logo Container with Animation */}
      <div className={`
        transform transition-all duration-1000 ease-out
        ${isVisible 
          ? 'translate-y-0 opacity-100 scale-100 rotate-0' 
          : 'translate-y-12 opacity-0 scale-75 rotate-12'
        }
      `}>
        <div className="relative group">
          {showText && (
            <>
              {/* Glow Effect Background - only when showing text */}
              <div className="absolute inset-0 bg-gradient-to-r from-barber-400 via-barber-500 to-barber-600 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 animate-pulse"></div>
              
              {/* Main Logo with background */}
              <div className="relative bg-white rounded-full p-4 shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                <img 
                  src="/lovable-uploads/511104df-026a-46d9-bf3f-fc3dd4b01357.png" 
                  alt="BarberPOS Logo" 
                  className={`${sizeClasses[size]} filter drop-shadow-lg transition-all duration-300 group-hover:brightness-110`}
                />
              </div>
              
              {/* Floating Scissors Animation */}
              <div className="absolute -top-2 -right-2 text-barber-500 animate-bounce opacity-75">
                <Scissors className="h-6 w-6 transform rotate-45" />
              </div>
            </>
          )}
          
          {!showText && (
            /* Clean logo without background when no text */
            <img 
              src="/lovable-uploads/511104df-026a-46d9-bf3f-fc3dd4b01357.png" 
              alt="BarberPOS Logo" 
              className={`${sizeClasses[size]} filter drop-shadow-2xl transition-all duration-300 group-hover:scale-105`}
            />
          )}
        </div>
      </div>

      {/* Animated Text */}
      {showText && (
        <div className={`
          mt-4 transform transition-all duration-1200 delay-300 ease-out
          ${isVisible 
            ? 'translate-y-0 opacity-100' 
            : 'translate-y-8 opacity-0'
          }
        `}>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-barber-600 via-barber-700 to-barber-800 bg-clip-text text-transparent animate-pulse">
            BarberPOS
          </h1>
          <p className="text-gray-500 text-sm mt-1 opacity-80">
            Sistema Profesional de Barbería
          </p>
        </div>
      )}
    </div>
  );
};

export default AnimatedLogo;

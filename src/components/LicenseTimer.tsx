
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Clock } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { motion } from 'framer-motion';
import { useLicense } from '@/contexts/LicenseContext';

interface LicenseTimerProps {
  onDismiss: () => void;
}

const LicenseTimer: React.FC<LicenseTimerProps> = ({ onDismiss }) => {
  const [hoursLeft, setHoursLeft] = useState(23);
  const [minutesLeft, setMinutesLeft] = useState(59);
  const [secondsLeft, setSecondsLeft] = useState(59);
  const [isOpen, setIsOpen] = useState(true);
  const isOnline = useOnlineStatus();
  const { licenseEndTime } = useLicense();

  useEffect(() => {
    const updateRemainingTime = () => {
      if (!licenseEndTime) return;
      
      const now = Date.now();
      const timeLeft = Math.max(0, licenseEndTime - now);
      
      if (timeLeft <= 0) {
        setHoursLeft(0);
        setMinutesLeft(0);
        setSecondsLeft(0);
        return;
      }
      
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      
      setHoursLeft(hours);
      setMinutesLeft(minutes);
      setSecondsLeft(seconds);
    };

    // Initial update
    updateRemainingTime();
    
    // Set timer to update every second
    const timerInterval = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(timerInterval);
  }, [licenseEndTime]);

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem('has_shown_license_timer', 'true');
    setTimeout(onDismiss, 300); // Give time for animation to complete
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full mb-6">
      <CollapsibleContent forceMount>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/20 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700" 
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardContent className="pt-6 pb-4">
              <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-3">
                  <Clock className="h-6 w-6 text-orange-500" />
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Período de prueba</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Te quedan <span className="font-medium">{hoursLeft}h {minutesLeft}m {secondsLeft}s</span> para probar el sistema
                    </p>
                  </div>
                </div>
                <Button 
                  variant="default" 
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => window.open('https://mpago.la/2byf2WP', '_blank')}
                  disabled={!isOnline}
                >
                  ACTIVAR LICENCIA
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default LicenseTimer;

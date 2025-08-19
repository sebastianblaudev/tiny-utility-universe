
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface LicenseContextType {
  showLicenseTimer: boolean;
  setShowLicenseTimer: (show: boolean) => void;
  licenseEndTime: number | null;
  resetLicenseTimer: () => void;
  dismissLicenseTimerManually: () => void;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
};

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showLicenseTimer, setShowLicenseTimer] = useState<boolean>(false);
  const [licenseEndTime, setLicenseEndTime] = useState<number | null>(null);
  const { licenseInfo } = useAuth();

  useEffect(() => {
    const storedEndTime = localStorage.getItem('license_end_time');
    const hasShownLicenseTimer = localStorage.getItem('has_shown_license_timer') === 'true';
    
    if (storedEndTime) {
      setLicenseEndTime(parseInt(storedEndTime, 10));
      setShowLicenseTimer(!licenseInfo.isActive && !hasShownLicenseTimer);
    } else if (!licenseInfo.isActive && !hasShownLicenseTimer) {
      // Set end time to 24 hours from now (minus 1 second to start at 23:59:59)
      const endTime = Date.now() + (24 * 60 * 60 * 1000) - 1000;
      localStorage.setItem('license_end_time', endTime.toString());
      setLicenseEndTime(endTime);
      setShowLicenseTimer(true);
    }
  }, [licenseInfo.isActive]);

  const resetLicenseTimer = () => {
    localStorage.removeItem('license_end_time');
    localStorage.removeItem('has_shown_license_timer');
    setLicenseEndTime(null);
    setShowLicenseTimer(false);
  };

  const dismissLicenseTimerManually = () => {
    localStorage.setItem('has_shown_license_timer', 'true');
    setShowLicenseTimer(false);
  };

  return (
    <LicenseContext.Provider 
      value={{ 
        showLicenseTimer, 
        setShowLicenseTimer, 
        licenseEndTime, 
        resetLicenseTimer,
        dismissLicenseTimerManually
      }}
    >
      {children}
    </LicenseContext.Provider>
  );
};

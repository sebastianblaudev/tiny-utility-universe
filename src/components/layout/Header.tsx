
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Settings } from 'lucide-react';
import { SimpleSupabaseSyncIndicator } from '@/components/sync/SimpleSupabaseSyncIndicator';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img 
            src="https://barberpos.app/lovable-uploads/b3bd2bb0-9a16-46b2-a7a8-f2b2181003fa.png" 
            alt="BarberPOS Logo" 
            className="h-8 w-auto"
          />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            BarberPOS
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Indicador de sincronización simplificado */}
          <SimpleSupabaseSyncIndicator />
          
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <User className="h-4 w-4" />
            <span>{currentUser?.name}</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSettings}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;

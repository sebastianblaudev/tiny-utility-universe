
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="rounded-full transition-colors hover:bg-muted dark:hover:bg-gray-800"
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 text-gray-700" />
      ) : (
        <Sun className="h-5 w-5 text-amber-400" />
      )}
      <span className="sr-only">
        {theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
      </span>
    </Button>
  );
};

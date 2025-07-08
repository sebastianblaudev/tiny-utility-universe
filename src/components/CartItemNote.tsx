
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Check, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CartItemNoteProps {
  itemId: string;
  initialNote?: string;
  onSaveNote: (itemId: string, note: string) => void;
}

const CartItemNote: React.FC<CartItemNoteProps> = ({ 
  itemId, 
  initialNote = '',
  onSaveNote
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState(initialNote);

  const handleSaveNote = () => {
    onSaveNote(itemId, note);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveNote();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setNote(initialNote); // Reset to original note if cancelled
    }
  };

  return (
    <div className="mt-1 flex items-center text-xs">
      {isEditing ? (
        <div className="flex w-full items-center gap-1">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Agregar nota (ej: sin palta)"
            className="h-7 text-xs"
            autoFocus
          />
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-6 w-6" 
            onClick={handleSaveNote}
          >
            <Check size={14} />
          </Button>
        </div>
      ) : (
        <div className="flex w-full items-center gap-1">
          {note ? (
            <>
              <MessageSquare size={14} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <span className="text-xs italic text-gray-600 dark:text-gray-400 flex-1 truncate">{note}</span>
            </>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" 
                    onClick={() => setIsEditing(true)}
                  >
                    <MessageSquare size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Agregar nota</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {note && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6" 
              onClick={() => setIsEditing(true)}
            >
              <Pencil size={14} />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CartItemNote;

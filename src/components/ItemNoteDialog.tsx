
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote } from "lucide-react";

interface ItemNoteDialogProps {
  open: boolean;
  onClose: () => void;
  itemIndex: number;
  initialNote?: string;
  onSaveNote: (index: number, note: string) => void;
}

export const ItemNoteDialog: React.FC<ItemNoteDialogProps> = ({
  open,
  onClose,
  itemIndex,
  initialNote = "",
  onSaveNote,
}) => {
  const [note, setNote] = useState(initialNote);

  const handleSaveNote = () => {
    onSaveNote(itemIndex, note.trim());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#111111] border-[#333333] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center text-white">
            <StickyNote className="h-5 w-5 mr-2 text-orange-400" />
            Agregar comentario
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <Textarea
            placeholder="Escribe instrucciones especiales o comentarios para este producto..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[120px] bg-[#1A1A1A] border-[#333333] text-white placeholder:text-zinc-500 focus:border-orange-500"
            autoFocus
          />
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="bg-[#1A1A1A] border-[#333333] text-white hover:bg-[#252525] hover:border-orange-500"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveNote}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemNoteDialog;

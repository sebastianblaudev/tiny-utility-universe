import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Check, Edit, FileText, Trash2, 
  DollarSign, Calendar, User, X, Save
} from 'lucide-react';
import { getDraftSales, deleteDraftSale, renameDraftSale, DraftSale } from '@/utils/draftSalesUtils';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currencyFormat';

interface SavedDraftsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDraft: (draft: DraftSale) => void;
}

const SavedDraftsDialog: React.FC<SavedDraftsDialogProps> = ({ isOpen, onClose, onLoadDraft }) => {
  const [drafts, setDrafts] = useState<DraftSale[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(isOpen);
  const [selectedDraft, setSelectedDraft] = useState<DraftSale | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  
  useEffect(() => {
    const handleOpenDialog = () => {
      setIsDialogOpen(true);
    };
    
    window.addEventListener('open-draft-dialog', handleOpenDialog);
    
    return () => {
      window.removeEventListener('open-draft-dialog', handleOpenDialog);
    };
  }, []);
  
  useEffect(() => {
    setIsDialogOpen(isOpen);
  }, [isOpen]);
  
  useEffect(() => {
    if (isDialogOpen) {
      setDrafts(getDraftSales());
    }
  }, [isDialogOpen]);
  
  const handleDeleteDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteDraftSale(id)) {
      setDrafts(drafts.filter(draft => draft.id !== id));
      toast.success('Borrador eliminado');
    } else {
      toast.error('No se pudo eliminar el borrador');
    }
  };

  const handleStartRename = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDraft(drafts.find(draft => draft.id === id));
    setNewName(currentName);
    setIsRenaming(true);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (newName.trim()) {
      if (renameDraftSale(id, newName.trim())) {
        setDrafts(drafts.map(draft => 
          draft.id === id ? { ...draft, name: newName.trim() } : draft
        ));
        toast.success('Nombre actualizado');
      } else {
        toast.error('No se pudo actualizar el nombre');
      }
    }
    setSelectedDraft(null);
    setIsRenaming(false);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDraft(null);
    setIsRenaming(false);
  };

  const handleLoadDraft = (draft: DraftSale) => {
    onLoadDraft(draft);
    handleClose();
    toast.success(`Borrador "${draft.name}" cargado`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    onClose();
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ventas Guardadas</DialogTitle>
          <DialogDescription>
            Recupera ventas guardadas anteriormente para continuar con el proceso
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          {drafts.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <FileText className="mx-auto h-10 w-10 opacity-30 mb-2" />
              <p>No hay ventas guardadas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {drafts.map(draft => (
                <div 
                  key={draft.id}
                  onClick={() => handleLoadDraft(draft)}
                  className="border rounded-md p-3 cursor-pointer hover:bg-accent transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {selectedDraft?.id === draft.id ? (
                        <div className="flex items-center gap-1 flex-1">
                          <Input 
                            value={newName} 
                            onChange={(e) => setNewName(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="h-8"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => handleSaveRename(draft.id, e)}
                            className="h-8 w-8"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleCancelRename}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium">{draft.name}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => handleStartRename(draft.id, draft.name, e)}
                            className="h-7 w-7"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(draft.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>{formatCurrency(draft.total)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>{draft.items.length} productos</span>
                      </div>
                      {draft.customer && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{draft.customer.nombre || 'Cliente'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={(e) => handleDeleteDraft(draft.id, e)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SavedDraftsDialog;

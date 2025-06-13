
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { User } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface Branch {
  id: string;
  name: string;
}

interface UserFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  user: User | null;
  branches: Branch[];
}

const UserFormDialog = ({ isOpen, onClose, onSave, user, branches }: UserFormDialogProps) => {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<"owner" | "admin" | "barber">("barber");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { currentUser, isOwner } = useAuth();

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPin(user.pin);
      setRole(user.role);
    } else {
      // Reset form for new user
      setName("");
      setPin("");
      setRole("barber");
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = "El nombre es requerido";
    }
    
    if (!pin.trim()) {
      newErrors.pin = "El PIN es requerido";
    } else if (pin.length < 4) {
      newErrors.pin = "El PIN debe tener al menos 4 dígitos";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Generar ID único para nuevo usuario si no tiene uno
      const generateUniqueId = (): string => {
        return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      };

      const userData: User = {
        id: user?.id || generateUniqueId(),
        name,
        pin,
        role,
        branchId: '1'
      };
      
      console.log('Submitting user data:', userData);
      onSave(userData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del usuario"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              type="password"
              placeholder="PIN de acceso"
              className={errors.pin ? "border-red-500" : ""}
            />
            {errors.pin && <p className="text-xs text-red-500">{errors.pin}</p>}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="role">Rol</Label>
            <Select value={role} onValueChange={(value) => setRole(value as "owner" | "admin" | "barber")}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {isOwner && <SelectItem value="owner">Propietario</SelectItem>}
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="barber">Barbero</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormDialog;

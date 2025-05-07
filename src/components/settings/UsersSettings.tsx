
import { useState, useEffect } from "react";
import { Auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Eye, EyeOff, Key, Lock, User, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function UsersSettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pin, setPin] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cashiers, setCashiers] = useState<Array<{username: string, id: string, pin?: string}>>([]);
  const [showCreateCashierDialog, setShowCreateCashierDialog] = useState(false);
  const [newCashierUsername, setNewCashierUsername] = useState("");
  const [showChangePin, setShowChangePin] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState<string | null>(null);
  const [newCashierPin, setNewCashierPin] = useState("");

  const { toast } = useToast();
  const auth = Auth.getInstance();

  useEffect(() => {
    if (auth.isAdmin()) {
      setCashiers(auth.getCashiers());
    }
  }, []);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Error",
          description: "No hay un usuario autenticado",
          variant: "destructive",
        });
        return;
      }

      // Verificar la contraseña actual
      try {
        await auth.login(user.username, currentPassword);
      } catch (e) {
        toast({
          title: "Error",
          description: "La contraseña actual es incorrecta",
          variant: "destructive",
        });
        return;
      }

      await auth.changePassword(user.username, newPassword);

      toast({
        title: "Éxito",
        description: "Contraseña actualizada correctamente",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cambiar la contraseña",
        variant: "destructive",
      });
    }
  };

  const handleChangePin = async () => {
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast({
        title: "Error",
        description: "El PIN debe ser de 4 dígitos",
        variant: "destructive",
      });
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Error",
          description: "No hay un usuario autenticado",
          variant: "destructive",
        });
        return;
      }

      await auth.changePin(user.username, pin);

      toast({
        title: "Éxito",
        description: "PIN actualizado correctamente",
      });

      setPin("");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cambiar el PIN",
        variant: "destructive",
      });
    }
  };

  const handleCreateCashier = async () => {
    if (!newCashierUsername) {
      toast({
        title: "Error",
        description: "Nombre de usuario es requerido",
        variant: "destructive",
      });
      return;
    }

    try {
      const newCashier = await auth.createCashier(newCashierUsername);
      
      toast({
        title: "Éxito",
        description: `Cajero creado correctamente. PIN asignado: ${newCashier.pin}`,
      });
      
      setCashiers(auth.getCashiers());
      setShowCreateCashierDialog(false);
      setNewCashierUsername("");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el cajero",
        variant: "destructive",
      });
    }
  };

  const handleChangeCashierPin = async () => {
    if (!selectedCashier || !newCashierPin) {
      toast({
        title: "Error",
        description: "No se ha seleccionado un cajero o el PIN es inválido",
        variant: "destructive",
      });
      return;
    }

    try {
      await auth.changePin(selectedCashier, newCashierPin);
      
      toast({
        title: "Éxito",
        description: "PIN del cajero actualizado correctamente",
      });
      
      setCashiers(auth.getCashiers());
      setShowChangePin(false);
      setSelectedCashier(null);
      setNewCashierPin("");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cambiar el PIN",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="bg-[#1A1A1A] border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Cambiar Contraseña
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Actualiza tu contraseña de acceso al sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-white">Contraseña Actual</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                className="bg-[#252525] border-[#333333] text-white"
                placeholder="Ingresa tu contraseña actual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-white">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                className="bg-[#252525] border-[#333333] text-white"
                placeholder="Ingresa tu nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-white">Confirmar Contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className="bg-[#252525] border-[#333333] text-white"
                placeholder="Confirma tu nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button 
            onClick={handleChangePassword}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Cambiar Contraseña
          </Button>
        </CardFooter>
      </Card>

      <Card className="bg-[#1A1A1A] border-zinc-800 mt-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Cambiar PIN Administrador
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Actualiza tu PIN de acceso rápido (4 dígitos)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin" className="text-white">Nuevo PIN</Label>
            <div className="flex justify-center">
              <InputOTP maxLength={4} value={pin} onChange={setPin}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="bg-[#252525] border-[#333333] text-white" />
                  <InputOTPSlot index={1} className="bg-[#252525] border-[#333333] text-white" />
                  <InputOTPSlot index={2} className="bg-[#252525] border-[#333333] text-white" />
                  <InputOTPSlot index={3} className="bg-[#252525] border-[#333333] text-white" />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button 
            onClick={handleChangePin}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Cambiar PIN
          </Button>
        </CardFooter>
      </Card>

      {auth.isAdmin() && (
        <Card className="bg-[#1A1A1A] border-zinc-800 mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-white flex items-center">
                <User className="h-5 w-5 mr-2" />
                Gestión de Cajeros
              </CardTitle>
              <Button 
                size="sm" 
                onClick={() => setShowCreateCashierDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <UserPlus className="h-4 w-4 mr-2" /> 
                Nuevo Cajero
              </Button>
            </div>
            <CardDescription className="text-zinc-400">
              Administra los usuarios cajeros y sus PINs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cashiers.length === 0 ? (
              <div className="text-center py-4 text-zinc-500">
                No hay cajeros registrados
              </div>
            ) : (
              <div className="space-y-2">
                {cashiers.map((cashier) => (
                  <div 
                    key={cashier.id} 
                    className="flex justify-between items-center p-3 bg-[#252525] rounded-md border border-[#333333]"
                  >
                    <div>
                      <p className="text-white font-medium">{cashier.username}</p>
                      <p className="text-sm text-zinc-400">
                        PIN: {cashier.pin ? '••••' : 'No definido'}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedCashier(cashier.username);
                        setNewCashierPin("");
                        setShowChangePin(true);
                      }}
                      className="bg-[#1A1A1A] hover:bg-[#252525] hover:border-orange-500 border-[#333333] text-white"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Cambiar PIN
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showCreateCashierDialog} onOpenChange={setShowCreateCashierDialog}>
        <DialogContent className="bg-[#1A1A1A] border-[#333333] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Crear Nuevo Cajero</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Ingresa el nombre del nuevo usuario cajero
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newCashierUsername" className="text-white">Nombre de Usuario</Label>
              <Input
                id="newCashierUsername"
                className="bg-[#252525] border-[#333333] text-white"
                placeholder="Ingresa nombre de usuario"
                value={newCashierUsername}
                onChange={(e) => setNewCashierUsername(e.target.value)}
              />
            </div>
            <div className="text-sm text-zinc-400">
              <p>Se generará un PIN automáticamente para este cajero.</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateCashierDialog(false)}
              className="bg-[#252525] text-white hover:bg-[#333333] border-[#333333]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCashier}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Crear Cajero
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showChangePin} onOpenChange={setShowChangePin}>
        <DialogContent className="bg-[#1A1A1A] border-[#333333] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Cambiar PIN del Cajero</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {selectedCashier && `Ingresa el nuevo PIN para ${selectedCashier}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white">Nuevo PIN</Label>
              <div className="flex justify-center">
                <InputOTP maxLength={4} value={newCashierPin} onChange={setNewCashierPin}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="bg-[#252525] border-[#333333] text-white" />
                    <InputOTPSlot index={1} className="bg-[#252525] border-[#333333] text-white" />
                    <InputOTPSlot index={2} className="bg-[#252525] border-[#333333] text-white" />
                    <InputOTPSlot index={3} className="bg-[#252525] border-[#333333] text-white" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowChangePin(false);
                setSelectedCashier(null);
              }}
              className="bg-[#252525] text-white hover:bg-[#333333] border-[#333333]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangeCashierPin}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Cambiar PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

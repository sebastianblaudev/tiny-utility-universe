
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Auth } from "@/lib/auth";
import { Eye, EyeOff } from "lucide-react";
import { ReceiptSettings } from "@/components/settings/ReceiptSettings";
import { BackButton } from "@/components/BackButton";

const Settings = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const auth = Auth.getInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Verificar que las contraseñas nuevas coincidan
      if (newPassword !== confirmPassword) {
        throw new Error("Las contraseñas nuevas no coinciden");
      }

      // Verificar la contraseña actual
      const isCurrentPasswordValid = await auth.login(auth.currentUser?.username || '', currentPassword);
      
      if (!isCurrentPasswordValid) {
        throw new Error("La contraseña actual es incorrecta");
      }

      // Cambiar la contraseña
      await auth.changePassword(auth.currentUser?.username || '', newPassword);
      
      toast({
        title: "Contraseña actualizada",
        description: "La contraseña se ha cambiado exitosamente",
      });

      // Limpiar campos
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cambiar la contraseña",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-[#1A1A1A] text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <BackButton />
          <h1 className="text-2xl font-bold">Configuración</h1>
        </div>
        
        <div className="bg-[#252525] rounded-lg shadow-md p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Password Change Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Cambiar Contraseña</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="currentPassword" className="text-sm font-medium">
                    Contraseña Actual
                  </label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="bg-[#333333] border-[#444444] text-white"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-medium">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="bg-[#333333] border-[#444444] text-white"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-[#333333] border-[#444444] text-white"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  disabled={isLoading}
                >
                  {isLoading ? "Cambiando contraseña..." : "Cambiar contraseña"}
                </Button>
              </form>
            </div>

            {/* Receipt Settings Section */}
            <div className="border-t md:border-t-0 md:border-l border-[#444444] pt-8 md:pt-0 md:pl-8">
              <ReceiptSettings />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

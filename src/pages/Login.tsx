import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Auth } from "@/lib/auth";
import { Eye, EyeOff, Key, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"admin" | "cajero">("admin");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const auth = Auth.getInstance();
      await auth.login(username, password);
      
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido al sistema",
      });
      navigate("/");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'LICENSE_EXPIRED') {
          navigate('/activar-licencia');
          return;
        }
        toast({
          variant: "destructive",
          title: "Error de autenticación",
          description: error.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCashierLogin = async () => {
    if (pin.length !== 4) {
      toast({
        variant: "destructive",
        title: "PIN inválido",
        description: "El PIN debe tener 4 dígitos",
      });
      return;
    }

    setIsLoading(true);

    try {
      const auth = Auth.getInstance();
      const user = await auth.loginWithPin(pin);
      
      if (user.role === "admin") {
        auth.logout();
        toast({
          variant: "destructive",
          title: "Acceso denegado",
          description: "Los administradores deben iniciar sesión con email y contraseña",
        });
        return;
      }
      
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${user.username}`,
      });
      navigate("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: error instanceof Error ? error.message : "PIN incorrecto",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A]">
      <div className="bg-[#252525] p-8 rounded-lg shadow-xl w-full max-w-md border border-[#333333]">
        <div className="flex justify-center mb-6">
          <img 
            src="https://i.ibb.co/DqVcLqz/PizzaPOS.png" 
            alt="PizzaPOS Logo" 
            className="max-w-[120px] h-auto object-contain"
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "admin" | "cajero")}>
          <TabsList className="grid grid-cols-2 mb-6 bg-[#1A1A1A]">
            <TabsTrigger value="admin" className="data-[state=active]:bg-orange-500">
              <Lock className="h-4 w-4 mr-2" />
              Administrador
            </TabsTrigger>
            <TabsTrigger value="cajero" className="data-[state=active]:bg-orange-500">
              <Key className="h-4 w-4 mr-2" />
              Cajero
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="admin">
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-300">
                  Usuario
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-[#333333] border-[#444444] text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-300">
                  Contraseña
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-[#333333] border-[#444444] text-white"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={isLoading}
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="cajero">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-center block text-gray-300">
                  Ingresa tu PIN de acceso
                </label>
                <div className="flex justify-center">
                  <InputOTP maxLength={4} value={pin} onChange={setPin}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="bg-[#333333] border-[#444444] text-white" />
                      <InputOTPSlot index={1} className="bg-[#333333] border-[#444444] text-white" />
                      <InputOTPSlot index={2} className="bg-[#333333] border-[#444444] text-white" />
                      <InputOTPSlot index={3} className="bg-[#333333] border-[#444444] text-white" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleCashierLogin}
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={isLoading || pin.length !== 4}
              >
                {isLoading ? "Verificando..." : "Ingresar como Cajero"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LoginPage;

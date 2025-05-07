
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Key, Lock, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthWithPin } from "@/hooks/useAuthWithPin";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithEmail, signUp, user, isBanned, loading } = useAuth();
  const { authWithPin } = useAuthWithPin();

  // Determine which tab should be active based on query parameters
  const getInitialActiveTab = () => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab === 'cajero') {
      return "cajero";
    }
    return "admin";
  };
  
  const [activeTab, setActiveTab] = useState<"admin" | "cajero" | "registro">(
    getInitialActiveTab() as "admin" | "cajero" | "registro"
  );

  // Redirect if already logged in
  useEffect(() => {
    console.log("Login page - auth state:", { user: !!user, isBanned });
    if (user && !isBanned) {
      navigate("/");
    }
  }, [user, navigate, isBanned]);

  // Display banned message
  useEffect(() => {
    if (isBanned) {
      toast({
        variant: "destructive",
        title: "Usuario suspendido",
        description: "Tu cuenta ha sido suspendida. Contacta a un administrador.",
      });
    }
  }, [isBanned, toast]);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    try {
      await loginWithEmail(email, password);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    try {
      await signUp(email, password);
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  const handleCashierLogin = async () => {
    if (pin.length !== 4 || loading) {
      toast({
        variant: "destructive",
        title: "PIN inválido",
        description: "El PIN debe tener 4 dígitos",
      });
      return;
    }

    try {
      const profile = await authWithPin(pin);
      
      if (profile) {
        toast({
          title: "Inicio de sesión exitoso",
          description: `Bienvenido, ${profile.email}`,
        });
        navigate("/");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: error instanceof Error ? error.message : "PIN incorrecto",
      });
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
        
        {isBanned ? (
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-white">Cuenta Suspendida</h1>
            <p className="text-gray-400">
              Tu cuenta ha sido suspendida. Por favor, contacta al administrador del sistema.
            </p>
            
            <Button 
              onClick={() => navigate("/login")} 
              className="w-full mt-6 bg-orange-500 hover:bg-orange-600"
            >
              Volver al inicio de sesión
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "admin" | "cajero" | "registro")}>
            <TabsList className="grid grid-cols-3 mb-6 bg-[#1A1A1A]">
              <TabsTrigger value="admin" className="data-[state=active]:bg-orange-500">
                <Lock className="h-4 w-4 mr-2" />
                Iniciar sesión
              </TabsTrigger>
              <TabsTrigger value="cajero" className="data-[state=active]:bg-orange-500">
                <Key className="h-4 w-4 mr-2" />
                Cajero
              </TabsTrigger>
              <TabsTrigger value="registro" className="data-[state=active]:bg-orange-500">
                <UserPlus className="h-4 w-4 mr-2" />
                Registrarse
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="admin">
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-300">
                    Correo electrónico
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
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
                      disabled={loading}
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
                  disabled={loading}
                >
                  {loading ? "Iniciando sesión..." : "Iniciar sesión"}
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
                    <InputOTP maxLength={4} value={pin} onChange={setPin} disabled={loading}>
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
                  disabled={pin.length !== 4 || loading}
                >
                  {loading ? "Verificando..." : "Ingresar como Cajero"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="registro">
              <form onSubmit={handleRegistration} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="register-email" className="text-sm font-medium text-gray-300">
                    Correo electrónico
                  </label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-[#333333] border-[#444444] text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="register-password" className="text-sm font-medium text-gray-300">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
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
                  disabled={loading}
                >
                  {loading ? "Registrando..." : "Crear cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default LoginPage;

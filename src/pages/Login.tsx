import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Auth } from "@/lib/auth";
import { Eye, EyeOff } from "lucide-react";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
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
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: error instanceof Error ? error.message : "Error al iniciar sesión",
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
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
      </div>
    </div>
  );
};

export default LoginPage;

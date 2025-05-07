
import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const AccountDisabled = () => {
  const { logout, isBanned } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#1A1A1A] px-4">
      <div className="w-full max-w-md rounded-lg bg-[#252525] p-8 shadow-lg border border-[#333333]">
        <div className="flex justify-center mb-6">
          <img 
            src="https://i.ibb.co/DqVcLqz/PizzaPOS.png" 
            alt="PizzaPOS Logo" 
            className="max-w-[120px] h-auto object-contain"
          />
        </div>
        
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold text-white">
            {isBanned ? "Cuenta Suspendida" : "Cuenta Desactivada"}
          </h1>
          <p className="text-gray-400">
            {isBanned 
              ? "Tu cuenta ha sido suspendida. Por favor, contacta al administrador del sistema para más información."
              : "Tu cuenta ha sido desactivada. Por favor, contacta al administrador del sistema para reactivar tu acceso."
            }
          </p>
          
          <Button 
            onClick={handleLogout}
            className="w-full mt-6 bg-orange-500 hover:bg-orange-600"
          >
            Volver al inicio de sesión
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountDisabled;

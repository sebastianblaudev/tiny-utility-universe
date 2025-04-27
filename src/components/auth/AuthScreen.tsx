
import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

interface AuthScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthScreen = ({ isOpen, onClose }: AuthScreenProps) => {
  const [showLogin, setShowLogin] = useState(true);
  
  const handleSuccess = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        {showLogin ? (
          <LoginForm 
            onSuccess={handleSuccess} 
            onRegisterClick={() => setShowLogin(false)} 
          />
        ) : (
          <RegisterForm 
            onSuccess={handleSuccess} 
            onLoginClick={() => setShowLogin(true)} 
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthScreen;


import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Menu, FileText, Settings } from "lucide-react";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <header className="bg-chile-blue text-white py-4 px-6 sticky top-0 z-10 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <span className="font-heading text-xl font-bold">CotiPro Chile</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6">
          <Link to="/" className="hover:text-neutral-medium transition-colors">
            Inicio
          </Link>
          <Link to="/quotations" className="hover:text-neutral-medium transition-colors">
            Cotizaciones
          </Link>
          <Link to="/products" className="hover:text-neutral-medium transition-colors">
            Productos
          </Link>
          <Link to="/settings" className="hover:text-neutral-medium transition-colors">
            Configuración
          </Link>
        </nav>
        
        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[250px] bg-chile-blue text-white border-none">
            <nav className="flex flex-col space-y-6 py-6">
              <Link 
                to="/"
                className="flex items-center space-x-2 hover:text-neutral-medium transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Menu className="h-5 w-5" />
                <span>Inicio</span>
              </Link>
              <Link 
                to="/quotations"
                className="flex items-center space-x-2 hover:text-neutral-medium transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <FileText className="h-5 w-5" />
                <span>Cotizaciones</span>
              </Link>
              <Link 
                to="/products"
                className="flex items-center space-x-2 hover:text-neutral-medium transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <FileText className="h-5 w-5" />
                <span>Productos</span>
              </Link>
              <Link 
                to="/settings"
                className="flex items-center space-x-2 hover:text-neutral-medium transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="h-5 w-5" />
                <span>Configuración</span>
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;

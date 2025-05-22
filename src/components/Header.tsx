
import React from "react";
import { Link } from "react-router-dom";
import { 
  BarChart3, 
  Settings, 
  FileText, 
  PackageSearch, 
  Home, 
  Shield,
  Save
} from "lucide-react";

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b sticky top-0 z-10 shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-2xl font-bold flex items-center">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-chile-blue to-chile-red font-heading">
              CotiPro
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium transition-colors hover:text-chile-blue flex items-center hover:scale-105 transition-transform">
              <Home className="h-4 w-4 mr-2" />
              Inicio
            </Link>
            <Link to="/products" className="text-sm font-medium transition-colors hover:text-chile-blue flex items-center hover:scale-105 transition-transform">
              <PackageSearch className="h-4 w-4 mr-2" />
              Productos
            </Link>
            <Link to="/quotations" className="text-sm font-medium transition-colors hover:text-chile-blue flex items-center hover:scale-105 transition-transform">
              <FileText className="h-4 w-4 mr-2" />
              Cotizaciones
            </Link>
            <Link to="/backup" className="text-sm font-medium transition-colors hover:text-chile-blue flex items-center hover:scale-105 transition-transform">
              <Save className="h-4 w-4 mr-2" />
              Respaldo
            </Link>
            <Link to="/license" className="text-sm font-medium transition-colors hover:text-chile-blue flex items-center hover:scale-105 transition-transform">
              <Shield className="h-4 w-4 mr-2" />
              Licencia
            </Link>
            <Link to="/settings" className="text-sm font-medium transition-colors hover:text-chile-blue flex items-center hover:scale-105 transition-transform">
              <Settings className="h-4 w-4 mr-2" />
              Ajustes
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm bg-gradient-to-r from-chile-blue to-chile-red text-white font-medium py-1.5 px-4 rounded-full shadow-sm">
            Bienvenido
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

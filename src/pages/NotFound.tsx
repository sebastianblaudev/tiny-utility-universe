
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-barber-600">404</h1>
        <h2 className="mt-4 text-3xl font-semibold text-gray-900">Página no encontrada</h2>
        <p className="mt-2 text-gray-600">
          Lo sentimos, la página que estás buscando no existe.
        </p>
        <div className="mt-6">
          <Link to="/dashboard">
            <Button className="bg-barber-600 hover:bg-barber-700">
              Volver al Inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

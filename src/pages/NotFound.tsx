
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <h1 className="text-6xl font-heading font-bold text-chile-blue mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">
        La página que buscas no existe
      </p>
      <Button asChild>
        <Link to="/">Volver al inicio</Link>
      </Button>
    </div>
  );
};

export default NotFound;

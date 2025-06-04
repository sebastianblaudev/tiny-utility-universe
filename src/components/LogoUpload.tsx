
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, ImageIcon } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface LogoUploadProps {
  currentLogo?: string;
  onLogoChange: (logo: string | null) => void;
}

const LogoUpload = ({ currentLogo, onLogoChange }: LogoUploadProps) => {
  const [preview, setPreview] = useState<string | null>(currentLogo || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor selecciona un archivo de imagen válido");
      return;
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen debe ser menor a 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      onLogoChange(base64);
      toast.success("Logo cargado correctamente");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setPreview(null);
    onLogoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success("Logo eliminado");
  };

  return (
    <div className="space-y-4">
      <Label>Logo de la Empresa</Label>
      
      {preview ? (
        <div className="flex items-start gap-4">
          <div className="relative">
            <img 
              src={preview} 
              alt="Logo preview" 
              className="w-32 h-32 object-contain border border-gray-300 rounded-lg bg-white"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
              onClick={handleRemoveLogo}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2">
              Logo actual de la empresa
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Cambiar Logo
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-600 mb-4">
            Sube el logo de tu empresa para incluirlo en las cotizaciones
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Subir Logo
          </Button>
        </div>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <p className="text-xs text-gray-500">
        Formatos soportados: JPG, PNG, SVG. Tamaño máximo: 2MB
      </p>
    </div>
  );
};

export default LogoUpload;

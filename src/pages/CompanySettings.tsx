
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Save } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { companyService, Company } from "@/lib/company-service";
import LogoUpload from "@/components/LogoUpload";

const CompanySettings = () => {
  const [company, setCompany] = useState<Partial<Company>>({
    name: "",
    rut: "",
    address: "",
    email: "",
    phone: "",
    logo: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    setIsLoading(true);
    try {
      const existingCompany = await companyService.getCompany();
      if (existingCompany) {
        setCompany(existingCompany);
      }
    } catch (error) {
      console.error("Error loading company data:", error);
      toast.error("Error al cargar los datos de la empresa");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!company.name || !company.rut) {
      toast.error("El nombre y RUT de la empresa son obligatorios");
      return;
    }

    setIsSaving(true);
    try {
      await companyService.saveCompany({
        name: company.name,
        rut: company.rut,
        address: company.address || "",
        email: company.email || "",
        phone: company.phone || "",
        logo: company.logo || undefined
      });
      toast.success("Datos de la empresa guardados correctamente");
    } catch (error) {
      console.error("Error saving company data:", error);
      toast.error("Error al guardar los datos de la empresa");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoChange = (logo: string | null) => {
    setCompany(prev => ({ ...prev, logo: logo || undefined }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-chile-blue"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8 text-chile-blue font-heading">
        Configuración de Empresa
      </h1>
      
      <Card className="shadow-lg">
        <CardHeader className="border-b bg-neutral-light">
          <CardTitle className="flex items-center gap-3">
            <Building2 className="text-chile-blue h-5 w-5" />
            Datos de la Empresa
          </CardTitle>
          <CardDescription>
            Configura los datos de tu empresa que aparecerán en las cotizaciones
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          <LogoUpload 
            currentLogo={company.logo} 
            onLogoChange={handleLogoChange}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Empresa *</Label>
              <Input
                id="name"
                value={company.name}
                onChange={(e) => setCompany(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre de tu empresa"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rut">RUT *</Label>
              <Input
                id="rut"
                value={company.rut}
                onChange={(e) => setCompany(prev => ({ ...prev, rut: e.target.value }))}
                placeholder="12.345.678-9"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={company.address}
              onChange={(e) => setCompany(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Dirección completa"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={company.email}
                onChange={(e) => setCompany(prev => ({ ...prev, email: e.target.value }))}
                placeholder="contacto@empresa.cl"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={company.phone}
                onChange={(e) => setCompany(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+56 9 1234 5678"
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-6 border-t">
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanySettings;

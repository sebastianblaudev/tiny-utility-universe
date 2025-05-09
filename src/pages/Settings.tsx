
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/BackButton"
import { ReceiptSettings } from "@/components/settings/ReceiptSettings"
import { LocaleSettings } from "@/components/settings/LocaleSettings";
import { UsersSettings } from "@/components/settings/UsersSettings";
import { TaxSettings } from "@/components/settings/TaxSettings";
import { Auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { createLocalLicense } from "@/lib/license";
import { useToast } from "@/components/ui/use-toast";

export default function Settings() {
  const navigate = useNavigate();
  const auth = Auth.getInstance();
  const { toast } = useToast();
  const isAdmin = auth.isAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      businessName: localStorage.getItem('businessName') || '',
      email: auth.currentUser?.username || '',
    }
  });

  const handleLicenseActivation = () => {
    navigate('/activar-licencia');
  };

  const handleGenerateLicense = (values: { businessName: string; email: string }) => {
    const result = createLocalLicense(values.businessName, values.email);
    
    if (result.success) {
      setGeneratedKey(result.licenseKey);
      toast({
        title: "Licencia generada",
        description: "Se ha generado una nueva licencia local correctamente",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="container mx-auto p-4 relative">
        <BackButton />
        <div className="max-w-4xl mx-auto mt-12">
          <h1 className="text-2xl font-bold mb-6 text-white">Configuración</h1>
          <div className="grid gap-6">
            <Card className="bg-[#1A1A1A] border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Licencia</CardTitle>
                <CardDescription className="text-white">
                  Gestiona tu licencia para acceder a todas las funcionalidades
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleLicenseActivation}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Activar Licencia
                </Button>
                
                {isAdmin && (
                  <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="ml-2">
                        Generar Licencia Local
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#1A1A1A] border-zinc-800 text-white">
                      <DialogHeader>
                        <DialogTitle>Generar Licencia Local</DialogTitle>
                        <DialogDescription>
                          Genera una licencia para uso local sin conexión a internet
                        </DialogDescription>
                      </DialogHeader>
                      
                      {!generatedKey ? (
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(handleGenerateLicense)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="businessName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nombre del Negocio</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Ingrese nombre del negocio"
                                      className="bg-[#333333] border-zinc-700 text-white"
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="email"
                                      placeholder="email@ejemplo.com"
                                      className="bg-[#333333] border-zinc-700 text-white"
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <div className="flex justify-end">
                              <Button type="submit">Generar Clave</Button>
                            </div>
                          </form>
                        </Form>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-center">Se ha generado la siguiente clave de licencia:</p>
                          <div className="p-3 bg-[#333333] rounded-md text-center font-mono">
                            {generatedKey}
                          </div>
                          <p className="text-sm text-zinc-400">Guarda esta clave, la necesitarás para activar tu licencia.</p>
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                navigator.clipboard.writeText(generatedKey);
                                toast({
                                  title: "Copiado",
                                  description: "Clave copiada al portapapeles",
                                });
                              }}
                            >
                              Copiar
                            </Button>
                            <Button onClick={() => {
                              setGeneratedKey(null);
                              setIsOpen(false);
                            }}>
                              Cerrar
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>

            <LocaleSettings />
            <TaxSettings />
            {isAdmin && <UsersSettings />}
            <Card className="bg-[#1A1A1A] border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Configuración del Recibo</CardTitle>
                <CardDescription className="text-white">
                  Ajusta la información que se muestra en los recibos.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <ReceiptSettings />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

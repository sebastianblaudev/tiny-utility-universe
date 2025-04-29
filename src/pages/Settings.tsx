
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/BackButton"
import { ReceiptSettings } from "@/components/settings/ReceiptSettings"
import { LocaleSettings } from "@/components/settings/LocaleSettings";
import { UsersSettings } from "@/components/settings/UsersSettings";
import { TaxSettings } from "@/components/settings/TaxSettings";
import { Auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const auth = Auth.getInstance();
  const isAdmin = auth.isAdmin();

  const handleLicenseActivation = () => {
    // Test MercadoPago link - replace with actual link in production
    window.open('https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456789', '_blank');
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
                  Activa tu licencia permanente para acceder a todas las funcionalidades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleLicenseActivation}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Activar Licencia Permanente
                </Button>
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

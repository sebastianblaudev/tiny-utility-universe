
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/BackButton"
import { ReceiptSettings } from "@/components/settings/ReceiptSettings"
import { LocaleSettings } from "@/components/settings/LocaleSettings";
import { UsersSettings } from "@/components/settings/UsersSettings";
import { Auth } from "@/lib/auth";

export default function Settings() {
  const auth = Auth.getInstance();
  const isAdmin = auth.isAdmin();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="container mx-auto p-4 relative">
        <BackButton />
        <div className="max-w-4xl mx-auto mt-12">
          <h1 className="text-2xl font-bold mb-6 text-white">Configuración</h1>
          <div className="grid gap-6">
            <LocaleSettings />
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

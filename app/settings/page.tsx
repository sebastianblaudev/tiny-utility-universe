"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import {
  Building,
  CloudIcon as CloudSync,
  Database,
  FileText,
  Globe,
  HardDrive,
  Lock,
  Printer,
  Receipt,
  Save,
  ShieldCheck,
  User,
  Users,
  Wifi,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSettings } from "@/hooks/use-indexed-db"
import { syncWithSupabase } from "@/lib/db"

export default function SettingsPage() {
  const { toast } = useToast()
  const { settings, loading, error, saveSettings } = useSettings()
  const [isLoading, setIsLoading] = useState(false)
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">("synced")

  // Estados locales para cada sección de configuración
  const [generalSettings, setGeneralSettings] = useState(
    settings?.general || {
      businessName: "Mi Negocio",
      legalName: "Mi Negocio S.A.",
      taxId: "3-101-123456",
      phone: "2222-3333",
      email: "contacto@minegocio.co.cr",
      address: "San José, Costa Rica",
      website: "www.minegocio.co.cr",
      logo: "/placeholder.svg?height=100&width=100",
      currency: "CRC",
      language: "es-CR",
      timeZone: "America/Costa_Rica",
    },
  )

  const [taxSettings, setTaxSettings] = useState(
    settings?.tax || {
      ivaEnabled: true,
      ivaRate: 13,
      ivaIncluded: true,
      exemptionEnabled: false,
      exemptionCode: "",
      otherTaxesEnabled: false,
      serviceTaxEnabled: false,
      serviceTaxRate: 10,
    },
  )

  const [printSettings, setPrintSettings] = useState(
    settings?.printing || {
      receiptPrinterEnabled: true,
      receiptPrinterName: "Epson TM-T20III",
      receiptWidth: 80,
      receiptHeader: "Mi Negocio\nSan José, Costa Rica\nTel: 2222-3333",
      receiptFooter: "¡Gracias por su compra!",
      showLogo: true,
      showBarcode: true,
      autoPrint: true,
      printCopies: 1,
      emailReceipt: false,
    },
  )

  const [backupSettings, setBackupSettings] = useState(
    settings?.backup || {
      autoBackup: true,
      backupFrequency: "daily",
      backupTime: "23:00",
      cloudBackup: true,
      localBackup: true,
      backupLocation: "/backups",
      lastBackup: "2023-12-15 23:00:00",
      encryptBackup: true,
    },
  )

  const [userSettings, setUserSettings] = useState(
    settings?.user || {
      multipleUsers: true,
      requireLogin: true,
      sessionTimeout: 30,
      passwordPolicy: "medium",
      twoFactorAuth: false,
    },
  )

  const [invoiceSettings, setInvoiceSettings] = useState(
    settings?.invoice || {
      electronicInvoiceEnabled: true,
      haciendaUsername: "usuario_hacienda",
      haciendaPassword: "••••••••",
      certificateExpiration: "2024-12-31",
      environment: "staging",
      autoSend: true,
      sendCopy: true,
    },
  )

  const [connectionSettings, setConnectionSettings] = useState(
    settings?.connection || {
      offlineMode: true,
      syncOnConnect: true,
      syncFrequency: "realtime",
      prioritySyncItems: ["sales", "inventory"],
      connectionTimeout: 30,
    },
  )

  // Actualizar estados locales cuando se cargan los ajustes
  useEffect(() => {
    if (settings) {
      setGeneralSettings(settings.general)
      setTaxSettings(settings.tax)
      setPrintSettings(settings.printing)
      setBackupSettings(settings.backup)
      setUserSettings(settings.user)
      setInvoiceSettings(settings.invoice)
      setConnectionSettings(settings.connection)
    }
  }, [settings])

  // Guardar configuración
  const saveAllSettings = async () => {
    setIsLoading(true)

    try {
      const allSettings = {
        general: generalSettings,
        tax: taxSettings,
        printing: printSettings,
        backup: backupSettings,
        user: userSettings,
        invoice: invoiceSettings,
        connection: connectionSettings,
      }

      const result = await saveSettings(allSettings)

      if (result.success) {
        // Simular sincronización con Supabase
        setSyncStatus("syncing")
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setSyncStatus("synced")

        toast({
          title: "Configuración guardada",
          description: "Los cambios han sido guardados correctamente.",
        })
      } else {
        setSyncStatus("error")
        toast({
          variant: "destructive",
          title: "Error al guardar",
          description: result.error || "No se pudieron guardar los cambios. Intente nuevamente.",
        })
      }
    } catch (error) {
      setSyncStatus("error")
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios. Intente nuevamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Forzar sincronización
  const forceSync = async () => {
    setSyncStatus("syncing")

    try {
      const result = await syncWithSupabase()

      if (result.success) {
        setSyncStatus("synced")
        toast({
          title: "Sincronización completada",
          description: "Todos los datos han sido sincronizados con la nube.",
        })
      } else {
        setSyncStatus("error")
        toast({
          variant: "destructive",
          title: "Error de sincronización",
          description: result.error || "No se pudieron sincronizar los datos. Verifique su conexión.",
        })
      }
    } catch (error) {
      setSyncStatus("error")
      toast({
        variant: "destructive",
        title: "Error de sincronización",
        description: "No se pudieron sincronizar los datos. Verifique su conexión.",
      })
    }
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-96">
          <p>Cargando configuración...</p>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Configuración" text="Administre la configuración de su sistema POS">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={forceSync} disabled={syncStatus === "syncing"}>
            {syncStatus === "syncing" ? (
              <>
                <CloudSync className="mr-2 h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : syncStatus === "error" ? (
              <>
                <CloudSync className="mr-2 h-4 w-4 text-destructive" />
                Reintentar
              </>
            ) : (
              <>
                <CloudSync className="mr-2 h-4 w-4" />
                Sincronizar
              </>
            )}
          </Button>
          <Button onClick={saveAllSettings} disabled={isLoading}>
            {isLoading ? (
              <>
                <Save className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </DashboardHeader>

      <Tabs defaultValue="general" className="space-y-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max pb-0.5">
            <TabsList>
              <TabsTrigger value="general">
                <Building className="mr-2 h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="taxes">
                <FileText className="mr-2 h-4 w-4" />
                Impuestos
              </TabsTrigger>
              <TabsTrigger value="printing">
                <Printer className="mr-2 h-4 w-4" />
                Impresión
              </TabsTrigger>
              <TabsTrigger value="backup">
                <Database className="mr-2 h-4 w-4" />
                Respaldo
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="mr-2 h-4 w-4" />
                Usuarios
              </TabsTrigger>
              <TabsTrigger value="invoice">
                <Receipt className="mr-2 h-4 w-4" />
                Facturación Electrónica
              </TabsTrigger>
              <TabsTrigger value="connection">
                <Wifi className="mr-2 h-4 w-4" />
                Conexión
              </TabsTrigger>
            </TabsList>
          </div>
        </ScrollArea>

        {/* Configuración General */}
        <TabsContent value="general">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-1 md:col-span-2 lg:col-span-2">
              <CardHeader>
                <CardTitle>Información del Negocio</CardTitle>
                <CardDescription>Información general de su negocio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="businessName">Nombre Comercial</Label>
                    <Input
                      id="businessName"
                      value={generalSettings.businessName}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, businessName: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="legalName">Razón Social</Label>
                    <Input
                      id="legalName"
                      value={generalSettings.legalName}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, legalName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="taxId">Cédula Jurídica / Física</Label>
                    <Input
                      id="taxId"
                      value={generalSettings.taxId}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, taxId: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={generalSettings.phone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={generalSettings.email}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Textarea
                    id="address"
                    value={generalSettings.address}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="website">Sitio Web</Label>
                    <Input
                      id="website"
                      value={generalSettings.website}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, website: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="currency">Moneda</Label>
                    <Select
                      value={generalSettings.currency}
                      onValueChange={(value) => setGeneralSettings({ ...generalSettings, currency: value })}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Seleccionar moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CRC">Colón Costarricense (₡)</SelectItem>
                        <SelectItem value="USD">Dólar Estadounidense ($)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Configuración Regional</CardTitle>
                <CardDescription>Ajustes de idioma y zona horaria</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={generalSettings.language}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, language: value })}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Seleccionar idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es-CR">Español (Costa Rica)</SelectItem>
                      <SelectItem value="en-US">English (United States)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="timeZone">Zona Horaria</Label>
                  <Select
                    value={generalSettings.timeZone}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, timeZone: value })}
                  >
                    <SelectTrigger id="timeZone">
                      <SelectValue placeholder="Seleccionar zona horaria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Costa_Rica">América/Costa Rica (GMT-6)</SelectItem>
                      <SelectItem value="America/Panama">América/Panamá (GMT-5)</SelectItem>
                      <SelectItem value="America/Mexico_City">América/Ciudad de México (GMT-6)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="logo">Logo</Label>
                  <div className="flex items-center gap-4">
                    <img
                      src={generalSettings.logo || "/placeholder.svg"}
                      alt="Logo"
                      className="h-16 w-16 rounded-md border object-contain p-1"
                    />
                    <Button variant="outline" size="sm">
                      Cambiar Logo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configuración de Impuestos */}
        <TabsContent value="taxes">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Impuestos</CardTitle>
              <CardDescription>Configure los impuestos aplicables a sus ventas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Impuesto al Valor Agregado (IVA)</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="ivaEnabled">Habilitar IVA</Label>
                    <p className="text-sm text-muted-foreground">Aplicar IVA a las ventas</p>
                  </div>
                  <Switch
                    id="ivaEnabled"
                    checked={taxSettings.ivaEnabled}
                    onCheckedChange={(checked) => setTaxSettings({ ...taxSettings, ivaEnabled: checked })}
                  />
                </div>
                {taxSettings.ivaEnabled && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="ivaRate">Tasa de IVA (%)</Label>
                      <Input
                        id="ivaRate"
                        type="number"
                        value={taxSettings.ivaRate}
                        onChange={(e) => setTaxSettings({ ...taxSettings, ivaRate: Number(e.target.value) })}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ivaIncluded"
                        checked={taxSettings.ivaIncluded}
                        onCheckedChange={(checked) => setTaxSettings({ ...taxSettings, ivaIncluded: !!checked })}
                      />
                      <label
                        htmlFor="ivaIncluded"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Precios incluyen IVA
                      </label>
                    </div>
                  </>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Exoneraciones</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="exemptionEnabled">Habilitar Exoneraciones</Label>
                    <p className="text-sm text-muted-foreground">Permitir ventas exoneradas de impuestos</p>
                  </div>
                  <Switch
                    id="exemptionEnabled"
                    checked={taxSettings.exemptionEnabled}
                    onCheckedChange={(checked) => setTaxSettings({ ...taxSettings, exemptionEnabled: checked })}
                  />
                </div>
                {taxSettings.exemptionEnabled && (
                  <div className="grid gap-2">
                    <Label htmlFor="exemptionCode">Código de Exoneración</Label>
                    <Input
                      id="exemptionCode"
                      value={taxSettings.exemptionCode}
                      onChange={(e) => setTaxSettings({ ...taxSettings, exemptionCode: e.target.value })}
                      placeholder="Ej: EXONERA-001"
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Impuesto de Servicio</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="serviceTaxEnabled">Habilitar Impuesto de Servicio</Label>
                    <p className="text-sm text-muted-foreground">Aplicar impuesto de servicio (restaurantes)</p>
                  </div>
                  <Switch
                    id="serviceTaxEnabled"
                    checked={taxSettings.serviceTaxEnabled}
                    onCheckedChange={(checked) => setTaxSettings({ ...taxSettings, serviceTaxEnabled: checked })}
                  />
                </div>
                {taxSettings.serviceTaxEnabled && (
                  <div className="grid gap-2">
                    <Label htmlFor="serviceTaxRate">Tasa de Impuesto de Servicio (%)</Label>
                    <Input
                      id="serviceTaxRate"
                      type="number"
                      value={taxSettings.serviceTaxRate}
                      onChange={(e) => setTaxSettings({ ...taxSettings, serviceTaxRate: Number(e.target.value) })}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración de Impresión */}
        <TabsContent value="printing">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Impresión</CardTitle>
              <CardDescription>Configure las opciones de impresión de recibos y facturas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Impresora de Recibos</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="receiptPrinterEnabled">Habilitar Impresora de Recibos</Label>
                    <p className="text-sm text-muted-foreground">Utilizar impresora térmica para recibos</p>
                  </div>
                  <Switch
                    id="receiptPrinterEnabled"
                    checked={printSettings.receiptPrinterEnabled}
                    onCheckedChange={(checked) =>
                      setPrintSettings({ ...printSettings, receiptPrinterEnabled: checked })
                    }
                  />
                </div>
                {printSettings.receiptPrinterEnabled && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="receiptPrinterName">Nombre de la Impresora</Label>
                      <Input
                        id="receiptPrinterName"
                        value={printSettings.receiptPrinterName}
                        onChange={(e) => setPrintSettings({ ...printSettings, receiptPrinterName: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="receiptWidth">Ancho del Papel (mm)</Label>
                      <Select
                        value={printSettings.receiptWidth.toString()}
                        onValueChange={(value) => setPrintSettings({ ...printSettings, receiptWidth: Number(value) })}
                      >
                        <SelectTrigger id="receiptWidth">
                          <SelectValue placeholder="Seleccionar ancho" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="58">58mm</SelectItem>
                          <SelectItem value="80">80mm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contenido del Recibo</h3>
                <div className="grid gap-2">
                  <Label htmlFor="receiptHeader">Encabezado del Recibo</Label>
                  <Textarea
                    id="receiptHeader"
                    value={printSettings.receiptHeader}
                    onChange={(e) => setPrintSettings({ ...printSettings, receiptHeader: e.target.value })}
                    placeholder="Texto que aparecerá en la parte superior del recibo"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="receiptFooter">Pie del Recibo</Label>
                  <Textarea
                    id="receiptFooter"
                    value={printSettings.receiptFooter}
                    onChange={(e) => setPrintSettings({ ...printSettings, receiptFooter: e.target.value })}
                    placeholder="Texto que aparecerá en la parte inferior del recibo"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showLogo"
                    checked={printSettings.showLogo}
                    onCheckedChange={(checked) => setPrintSettings({ ...printSettings, showLogo: !!checked })}
                  />
                  <label
                    htmlFor="showLogo"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Mostrar logo en el recibo
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showBarcode"
                    checked={printSettings.showBarcode}
                    onCheckedChange={(checked) => setPrintSettings({ ...printSettings, showBarcode: !!checked })}
                  />
                  <label
                    htmlFor="showBarcode"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Mostrar código de barras
                  </label>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Opciones de Impresión</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoPrint">Impresión Automática</Label>
                    <p className="text-sm text-muted-foreground">Imprimir automáticamente al completar una venta</p>
                  </div>
                  <Switch
                    id="autoPrint"
                    checked={printSettings.autoPrint}
                    onCheckedChange={(checked) => setPrintSettings({ ...printSettings, autoPrint: checked })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="printCopies">Número de Copias</Label>
                  <Input
                    id="printCopies"
                    type="number"
                    min="1"
                    max="3"
                    value={printSettings.printCopies}
                    onChange={(e) => setPrintSettings({ ...printSettings, printCopies: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailReceipt">Enviar Recibo por Correo</Label>
                    <p className="text-sm text-muted-foreground">Enviar copia del recibo por correo electrónico</p>
                  </div>
                  <Switch
                    id="emailReceipt"
                    checked={printSettings.emailReceipt}
                    onCheckedChange={(checked) => setPrintSettings({ ...printSettings, emailReceipt: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración de Respaldo */}
        <TabsContent value="backup">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Respaldo Local</CardTitle>
                <CardDescription>Configure las opciones de respaldo local</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="localBackup">Habilitar Respaldo Local</Label>
                    <p className="text-sm text-muted-foreground">Guardar copias de seguridad en este dispositivo</p>
                  </div>
                  <Switch
                    id="localBackup"
                    checked={backupSettings.localBackup}
                    onCheckedChange={(checked) => setBackupSettings({ ...backupSettings, localBackup: checked })}
                  />
                </div>
                {backupSettings.localBackup && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="backupLocation">Ubicación de Respaldos</Label>
                      <Input
                        id="backupLocation"
                        value={backupSettings.backupLocation}
                        onChange={(e) => setBackupSettings({ ...backupSettings, backupLocation: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="encryptBackup"
                        checked={backupSettings.encryptBackup}
                        onCheckedChange={(checked) =>
                          setBackupSettings({ ...backupSettings, encryptBackup: !!checked })
                        }
                      />
                      <label
                        htmlFor="encryptBackup"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Cifrar respaldos
                      </label>
                    </div>
                    <div className="flex justify-between">
                      <Button variant="outline" size="sm">
                        <HardDrive className="mr-2 h-4 w-4" />
                        Crear Respaldo Ahora
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileText className="mr-2 h-4 w-4" />
                        Ver Respaldos
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Respaldo en la Nube</CardTitle>
                <CardDescription>Configure las opciones de respaldo en la nube</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="cloudBackup">Habilitar Respaldo en la Nube</Label>
                    <p className="text-sm text-muted-foreground">Sincronizar datos con Supabase</p>
                  </div>
                  <Switch
                    id="cloudBackup"
                    checked={backupSettings.cloudBackup}
                    onCheckedChange={(checked) => setBackupSettings({ ...backupSettings, cloudBackup: checked })}
                  />
                </div>
                {backupSettings.cloudBackup && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="autoBackup">Respaldo Automático</Label>
                        <p className="text-sm text-muted-foreground">Realizar respaldos automáticamente</p>
                      </div>
                      <Switch
                        id="autoBackup"
                        checked={backupSettings.autoBackup}
                        onCheckedChange={(checked) => setBackupSettings({ ...backupSettings, autoBackup: checked })}
                      />
                    </div>
                    {backupSettings.autoBackup && (
                      <>
                        <div className="grid gap-2">
                          <Label htmlFor="backupFrequency">Frecuencia de Respaldo</Label>
                          <Select
                            value={backupSettings.backupFrequency}
                            onValueChange={(value) => setBackupSettings({ ...backupSettings, backupFrequency: value })}
                          >
                            <SelectTrigger id="backupFrequency">
                              <SelectValue placeholder="Seleccionar frecuencia" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hourly">Cada hora</SelectItem>
                              <SelectItem value="daily">Diario</SelectItem>
                              <SelectItem value="weekly">Semanal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="backupTime">Hora de Respaldo</Label>
                          <Input
                            id="backupTime"
                            type="time"
                            value={backupSettings.backupTime}
                            onChange={(e) => setBackupSettings({ ...backupSettings, backupTime: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                    <div className="rounded-md bg-muted p-4">
                      <div className="flex items-center gap-2">
                        <CloudSync className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Último respaldo: {backupSettings.lastBackup}</p>
                          <p className="text-xs text-muted-foreground">
                            Estado: {syncStatus === "synced" ? "Sincronizado" : "Pendiente"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configuración de Usuarios */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Usuarios</CardTitle>
              <CardDescription>Configure las opciones de usuarios y seguridad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Acceso de Usuarios</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="multipleUsers">Múltiples Usuarios</Label>
                    <p className="text-sm text-muted-foreground">Permitir múltiples cuentas de usuario</p>
                  </div>
                  <Switch
                    id="multipleUsers"
                    checked={userSettings.multipleUsers}
                    onCheckedChange={(checked) => setUserSettings({ ...userSettings, multipleUsers: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requireLogin">Requerir Inicio de Sesión</Label>
                    <p className="text-sm text-muted-foreground">Solicitar credenciales para acceder al sistema</p>
                  </div>
                  <Switch
                    id="requireLogin"
                    checked={userSettings.requireLogin}
                    onCheckedChange={(checked) => setUserSettings({ ...userSettings, requireLogin: checked })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Seguridad</h3>
                <div className="grid gap-2">
                  <Label htmlFor="sessionTimeout">Tiempo de Inactividad (minutos)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={userSettings.sessionTimeout}
                    onChange={(e) => setUserSettings({ ...userSettings, sessionTimeout: Number(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tiempo de inactividad antes de cerrar sesión automáticamente
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="passwordPolicy">Política de Contraseñas</Label>
                  <Select
                    value={userSettings.passwordPolicy}
                    onValueChange={(value) => setUserSettings({ ...userSettings, passwordPolicy: value })}
                  >
                    <SelectTrigger id="passwordPolicy">
                      <SelectValue placeholder="Seleccionar política" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Básica (mínimo 6 caracteres)</SelectItem>
                      <SelectItem value="medium">Media (letras y números, mínimo 8 caracteres)</SelectItem>
                      <SelectItem value="high">
                        Alta (mayúsculas, minúsculas, números y símbolos, mínimo 10 caracteres)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="twoFactorAuth">Autenticación de Dos Factores</Label>
                    <p className="text-sm text-muted-foreground">Requerir verificación adicional al iniciar sesión</p>
                  </div>
                  <Switch
                    id="twoFactorAuth"
                    checked={userSettings.twoFactorAuth}
                    onCheckedChange={(checked) => setUserSettings({ ...userSettings, twoFactorAuth: checked })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Gestión de Usuarios</h3>
                <div className="rounded-md border">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="h-8 w-8 rounded-full bg-muted p-1" />
                        <div>
                          <p className="font-medium">Administrador</p>
                          <p className="text-sm text-muted-foreground">admin@minegocio.co.cr</p>
                        </div>
                      </div>
                      <Badge>Administrador</Badge>
                    </div>
                  </div>
                  <Separator />
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="h-8 w-8 rounded-full bg-muted p-1" />
                        <div>
                          <p className="font-medium">Cajero</p>
                          <p className="text-sm text-muted-foreground">cajero@minegocio.co.cr</p>
                        </div>
                      </div>
                      <Badge variant="outline">Cajero</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button>
                    <User className="mr-2 h-4 w-4" />
                    Gestionar Usuarios
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración de Facturación Electrónica */}
        <TabsContent value="invoice">
          <Card>
            <CardHeader>
              <CardTitle>Facturación Electrónica</CardTitle>
              <CardDescription>Configure la integración con el sistema de facturación electrónica</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="electronicInvoiceEnabled">Habilitar Facturación Electrónica</Label>
                    <p className="text-sm text-muted-foreground">Integrar con el sistema de Hacienda</p>
                  </div>
                  <Switch
                    id="electronicInvoiceEnabled"
                    checked={invoiceSettings.electronicInvoiceEnabled}
                    onCheckedChange={(checked) =>
                      setInvoiceSettings({ ...invoiceSettings, electronicInvoiceEnabled: checked })
                    }
                  />
                </div>
                {invoiceSettings.electronicInvoiceEnabled && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="environment">Ambiente</Label>
                      <RadioGroup
                        value={invoiceSettings.environment}
                        onValueChange={(value) => setInvoiceSettings({ ...invoiceSettings, environment: value })}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="staging" id="staging" />
                          <Label htmlFor="staging">Pruebas</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="production" id="production" />
                          <Label htmlFor="production">Producción</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="haciendaUsername">Usuario de Hacienda</Label>
                        <Input
                          id="haciendaUsername"
                          value={invoiceSettings.haciendaUsername}
                          onChange={(e) => setInvoiceSettings({ ...invoiceSettings, haciendaUsername: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="haciendaPassword">Contraseña de Hacienda</Label>
                        <Input
                          id="haciendaPassword"
                          type="password"
                          value={invoiceSettings.haciendaPassword}
                          onChange={(e) => setInvoiceSettings({ ...invoiceSettings, haciendaPassword: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="certificateExpiration">Vencimiento del Certificado</Label>
                      <Input
                        id="certificateExpiration"
                        type="date"
                        value={invoiceSettings.certificateExpiration}
                        onChange={(e) =>
                          setInvoiceSettings({ ...invoiceSettings, certificateExpiration: e.target.value })
                        }
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="autoSend"
                        checked={invoiceSettings.autoSend}
                        onCheckedChange={(checked) => setInvoiceSettings({ ...invoiceSettings, autoSend: !!checked })}
                      />
                      <label
                        htmlFor="autoSend"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Enviar facturas automáticamente
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sendCopy"
                        checked={invoiceSettings.sendCopy}
                        onCheckedChange={(checked) => setInvoiceSettings({ ...invoiceSettings, sendCopy: !!checked })}
                      />
                      <label
                        htmlFor="sendCopy"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Enviar copia al cliente por correo
                      </label>
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline">
                        <Lock className="mr-2 h-4 w-4" />
                        Probar Credenciales
                      </Button>
                      <Button variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        Subir Certificado
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración de Conexión */}
        <TabsContent value="connection">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Conexión</CardTitle>
              <CardDescription>Configure las opciones de conexión y sincronización</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Modo Offline</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="offlineMode">Habilitar Modo Offline</Label>
                    <p className="text-sm text-muted-foreground">Permitir operaciones sin conexión a internet</p>
                  </div>
                  <Switch
                    id="offlineMode"
                    checked={connectionSettings.offlineMode}
                    onCheckedChange={(checked) =>
                      setConnectionSettings({ ...connectionSettings, offlineMode: checked })
                    }
                  />
                </div>
                {connectionSettings.offlineMode && (
                  <div className="rounded-md bg-muted p-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Modo Offline Habilitado</p>
                        <p className="text-xs text-muted-foreground">
                          Los datos se almacenarán localmente y se sincronizarán cuando haya conexión
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Sincronización</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="syncOnConnect">Sincronizar al Conectar</Label>
                    <p className="text-sm text-muted-foreground">
                      Sincronizar automáticamente cuando se restablezca la conexión
                    </p>
                  </div>
                  <Switch
                    id="syncOnConnect"
                    checked={connectionSettings.syncOnConnect}
                    onCheckedChange={(checked) =>
                      setConnectionSettings({ ...connectionSettings, syncOnConnect: checked })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="syncFrequency">Frecuencia de Sincronización</Label>
                  <Select
                    value={connectionSettings.syncFrequency}
                    onValueChange={(value) => setConnectionSettings({ ...connectionSettings, syncFrequency: value })}
                  >
                    <SelectTrigger id="syncFrequency">
                      <SelectValue placeholder="Seleccionar frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Tiempo real</SelectItem>
                      <SelectItem value="hourly">Cada hora</SelectItem>
                      <SelectItem value="daily">Diario</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="prioritySyncItems">Elementos Prioritarios</Label>
                  <div className="flex flex-wrap gap-2">
                    {["sales", "inventory", "customers", "products", "settings"].map((item) => (
                      <Badge
                        key={item}
                        variant={connectionSettings.prioritySyncItems.includes(item) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const newItems = connectionSettings.prioritySyncItems.includes(item)
                            ? connectionSettings.prioritySyncItems.filter((i) => i !== item)
                            : [...connectionSettings.prioritySyncItems, item]
                          setConnectionSettings({ ...connectionSettings, prioritySyncItems: newItems })
                        }}
                      >
                        {item === "sales"
                          ? "Ventas"
                          : item === "inventory"
                            ? "Inventario"
                            : item === "customers"
                              ? "Clientes"
                              : item === "products"
                                ? "Productos"
                                : "Configuración"}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configuración Avanzada</h3>
                <div className="grid gap-2">
                  <Label htmlFor="connectionTimeout">Tiempo de Espera de Conexión (segundos)</Label>
                  <Input
                    id="connectionTimeout"
                    type="number"
                    value={connectionSettings.connectionTimeout}
                    onChange={(e) =>
                      setConnectionSettings({ ...connectionSettings, connectionTimeout: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="flex justify-between">
                  <Button variant="outline">
                    <Database className="mr-2 h-4 w-4" />
                    Limpiar Caché Local
                  </Button>
                  <Button variant="outline">
                    <Globe className="mr-2 h-4 w-4" />
                    Probar Conexión
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}

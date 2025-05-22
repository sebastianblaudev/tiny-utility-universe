
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getCompanyInfo, saveCompanyInfo, type Company } from "@/lib/db-service";

// Form schema
const formSchema = z.object({
  name: z.string().min(1, "El nombre de la empresa es requerido"),
  rut: z
    .string()
    .min(1, "El RUT de la empresa es requerido")
    .regex(/^[0-9]{1,8}-[0-9kK]$/, "Formato de RUT inválido. Use: 12345678-9"),
  address: z.string().min(1, "La dirección es requerida"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  validityDays: z.coerce.number().int().min(1, "Debe ser al menos 1 día"),
  logo: z.string().optional(),
});

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      rut: "",
      address: "",
      phone: "",
      email: "",
      validityDays: 30,
      logo: "",
    },
  });

  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        const company = await getCompanyInfo();
        if (company) {
          form.reset({
            name: company.name,
            rut: company.rut,
            address: company.address,
            phone: company.phone || "",
            email: company.email || "",
            validityDays: company.validityDays,
            logo: company.logo || "",
          });

          if (company.logo) {
            setLogoPreview(company.logo);
          }
        }
      } catch (error) {
        console.error("Error loading company data:", error);
        toast.error("Error al cargar los datos de la empresa");
      } finally {
        setLoading(false);
      }
    };

    loadCompanyData();
  }, [form]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo es demasiado grande. Máximo 5MB.");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona una imagen válida.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      form.setValue("logo", base64);
      setLogoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const companyData: Company = {
        name: values.name,
        rut: values.rut,
        address: values.address,
        phone: values.phone || "",
        email: values.email || "",
        validityDays: values.validityDays,
        logo: values.logo,
      };

      await saveCompanyInfo(companyData);
      toast.success("Configuración guardada exitosamente");
    } catch (error) {
      console.error("Error saving company settings:", error);
      toast.error("Error al guardar la configuración");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-heading font-bold text-chile-blue mb-8">
        Configuración de la empresa
      </h1>

      <Card className="max-w-2xl mx-auto cotipro-shadow">
        <CardHeader>
          <CardTitle>Datos de la empresa</CardTitle>
          <CardDescription>
            Esta información aparecerá en tus cotizaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <p>Cargando información...</p>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="logo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo de la empresa</FormLabel>
                        <FormControl>
                          <div className="flex flex-col items-center space-y-3">
                            {logoPreview && (
                              <div className="w-40 h-40 border rounded flex items-center justify-center p-2 mb-2">
                                <img
                                  src={logoPreview}
                                  alt="Logo Preview"
                                  className="max-w-full max-h-full object-contain"
                                />
                              </div>
                            )}
                            <div>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoChange}
                                className="max-w-sm"
                              />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la empresa *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ingrese el nombre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rut"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RUT *</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678-9" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Dirección completa"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="+56 9 1234 5678"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
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
                              placeholder="empresa@ejemplo.cl"
                              type="email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="validityDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Validez de cotizaciones (días)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="365"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <CardFooter className="px-0 pt-6">
                  <Button type="submit" className="w-full">
                    Guardar configuración
                  </Button>
                </CardFooter>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

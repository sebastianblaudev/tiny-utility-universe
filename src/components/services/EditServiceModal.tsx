import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useBarber } from "@/contexts/BarberContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Service, BarcodeMapping } from "@/types";
import { Info, Plus, Barcode } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres",
  }),
  price: z.coerce.number().positive({
    message: "El precio debe ser mayor que 0",
  }),
  duration: z.coerce.number().positive({
    message: "La duración debe ser mayor que 0",
  }),
  categoryId: z.string({
    required_error: "Por favor seleccione una categoría",
  }),
  barberId: z.string().optional(),
  barcode: z.string().optional(),
});

type EditServiceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onSave: () => void;
};

const EditServiceModal = ({
  open,
  onOpenChange,
  service,
  onSave,
}: EditServiceModalProps) => {
  const { categories, barbers, updateService, generateBarcode, generateBarcodesForAllBarbers } = useBarber();
  const [barberIdInput, setBarberIdInput] = useState<string>("");
  const [barberBarcodes, setBarberBarcodes] = useState<BarcodeMapping[]>([]);
  const [activeTab, setActiveTab] = useState("general");
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price: 0,
      duration: 30,
      categoryId: "",
      barberId: "",
      barcode: "",
    },
  });

  // Actualizar el formulario cuando se carga un servicio
  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        price: service.price,
        duration: service.duration,
        categoryId: service.categoryId,
        barberId: service.barberId || "",
        barcode: service.barcode || "",
      });
      setBarberIdInput(service.barberId || "");
      setBarberBarcodes(service.barberBarcodes || []);
    }
  }, [service, form]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (!service) return;
    
    // Preparar datos del servicio actualizado
    const updatedService: Service = {
      ...service,
      name: data.name,
      price: data.price,
      duration: data.duration,
      categoryId: data.categoryId,
      barberId: data.barberId || undefined,
      barcode: data.barcode || undefined,
      barberBarcodes: barberBarcodes,
    };
    
    updateService(updatedService);
    onSave();
    onOpenChange(false);
  };

  // Modificamos la generación del código de barras para incluir el ID del barbero
  const generateNewBarcode = () => {
    if (!service) return;
    const prefix = barberIdInput ? `B${barberIdInput}` : "SRV";
    const newBarcode = generateBarcode(prefix);
    form.setValue("barcode", newBarcode);
  };

  // Genera códigos de barras para todos los barberos
  const handleGenerateAllBarcodes = () => {
    if (!service) return;
    generateBarcodesForAllBarbers();
    // Update local state to reflect the changes
    if (service.barberBarcodes) {
      const updatedBarcodes = barbers.map(barber => ({
        barberId: barber.id,
        barcode: generateBarcode(`SRV-${barber.id}`)
      }));
      setBarberBarcodes(updatedBarcodes);
    }
  };

  // Genera o regenera un código de barras para un barbero específico
  const generateBarcodeForBarber = (barberId: string) => {
    if (!service) return;
    
    const newBarcode = generateBarcode(`B${barberId}`);
    
    // Actualizar el estado local
    const updatedBarcodes = [...barberBarcodes];
    const existingIndex = updatedBarcodes.findIndex(b => b.barberId === barberId);
    
    if (existingIndex >= 0) {
      updatedBarcodes[existingIndex].barcode = newBarcode;
    } else {
      updatedBarcodes.push({ barberId, barcode: newBarcode });
    }
    
    setBarberBarcodes(updatedBarcodes);
  };

  const validBarbers = barbers.filter(barber => barber && barber.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Servicio</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">Información General</TabsTrigger>
            <TabsTrigger value="barcodes">Códigos de Barras</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del servicio" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Precio ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Duración (min)</FormLabel>
                        <FormControl>
                          <Input type="number" step="5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="barberId"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Barbero por defecto</FormLabel>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Info className="h-4 w-4 text-slate-500" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-[200px] text-xs">
                                Este barbero será asignado por defecto al realizar este servicio, pero cada barbero puede tener su propio código de barras.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select
                        onValueChange={(value) => {
                          const newValue = value === "none-selected" ? "" : value;
                          setBarberIdInput(newValue);
                          field.onChange(newValue);
                        }}
                        value={field.value || "none-selected"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar barbero (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none-selected">Sin asignar</SelectItem>
                          {validBarbers.map((barber) => (
                            <SelectItem key={barber.id} value={barber.id}>
                              {barber.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de barras general</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input 
                            placeholder="Código de barras" 
                            {...field} 
                          />
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={generateNewBarcode}
                        >
                          Generar
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Este es el código de barras general para este servicio.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" className="bg-barber-600 hover:bg-barber-700">
                    Guardar cambios
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="barcodes">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>Códigos de Barras por Barbero</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAllBarcodes}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Generar para todos</span>
                  </Button>
                </CardTitle>
                <CardDescription>
                  Cada barbero puede tener su propio código de barras para este servicio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {validBarbers.length === 0 ? (
                    <p className="text-center text-gray-500">
                      No hay barberos registrados
                    </p>
                  ) : (
                    validBarbers.map((barber) => {
                      const barberCode = barberBarcodes.find(
                        (b) => b.barberId === barber.id
                      );
                      
                      return (
                        <div
                          key={barber.id}
                          className="flex items-center justify-between border-b pb-2"
                        >
                          <div>
                            <p className="font-medium">{barber.name}</p>
                            <p className="text-sm text-gray-500 flex items-center mt-1">
                              <Barcode className="h-3 w-3 mr-1" />
                              {barberCode?.barcode || "No generado"}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateBarcodeForBarber(barber.id)}
                          >
                            {barberCode ? "Regenerar" : "Generar"}
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={form.handleSubmit(onSubmit)} 
                className="bg-barber-600 hover:bg-barber-700"
              >
                Guardar cambios
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EditServiceModal;


import { useState } from "react";
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
import { Scissors, Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguageCurrency } from "@/hooks/useLanguageCurrency";

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
});

type AddServiceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const AddServiceModal = ({
  open,
  onOpenChange
}: AddServiceModalProps) => {
  const { categories, addService, generateBarcode, barbers } = useBarber();
  const { toast } = useToast();
  const { getText, config } = useLanguageCurrency();
  const [barberIdInput, setBarberIdInput] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price: 0,
      duration: 30,
      categoryId: "",
      barberId: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    
    try {
      console.log('📝 Enviando datos del servicio:', data);
      
      // Generate a barcode if needed
      const prefix = data.barberId ? `B${data.barberId}` : "SERV";
      const barcode = generateBarcode(prefix);
      
      // Create the service
      await addService({
        name: data.name,
        price: data.price,
        duration: data.duration,
        categoryId: data.categoryId,
        barberId: data.barberId || undefined,
        barcode,
        barberBarcodes: data.barberId ? [{
          barberId: data.barberId,
          barcode
        }] : []
      });
      
      console.log('✅ Servicio creado exitosamente');
      
      toast({
        title: getText("Servicio creado", "Service created"),
        description: getText(`El servicio "${data.name}" ha sido guardado correctamente`, `Service "${data.name}" has been saved successfully`),
      });
      
      // Reset form and close modal
      form.reset();
      setBarberIdInput("");
      onOpenChange(false);
      
    } catch (error) {
      console.error('❌ Error guardando servicio:', error);
      toast({
        title: getText("Error", "Error"),
        description: getText("Error al guardar el servicio", "Error saving service"),
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            {getText("Añadir Nuevo Servicio", "Add New Service")}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{getText("Nombre", "Name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={getText("Nombre del servicio", "Service name")} {...field} />
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
                    <FormLabel>{getText("Precio ($)", "Price ($)")}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step={config.decimals === 2 ? "0.01" : "1"}
                        min={config.decimals === 2 ? "0.01" : "1"}
                        {...field} 
                      />
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
                    <FormLabel>{getText("Duración (min)", "Duration (min)")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="5" min="5" {...field} />
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
                  <FormLabel>{getText("Categoría", "Category")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={getText("Seleccionar categoría", "Select category")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.length > 0 ? (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-categories" disabled>
                          {getText("No hay categorías disponibles", "No categories available")}
                        </SelectItem>
                      )}
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
                    <FormLabel>{getText("Barbero", "Barber")}</FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Info className="h-4 w-4 text-slate-500" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-[200px] text-xs">
                            {getText(
                              "Al asignar un barbero, este servicio se identificará como realizado por este barbero específico cuando se escanee su código de barras.",
                              "When assigning a barber, this service will be identified as performed by this specific barber when its barcode is scanned."
                            )}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    onValueChange={(value) => {
                      setBarberIdInput(value);
                      field.onChange(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={getText("Seleccionar barbero (opcional)", "Select barber (optional)")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {barbers.length > 0 ? (
                        <>
                          <SelectItem value="none-selected" disabled>
                            {getText("Sin asignar (general)", "Unassigned (general)")}
                          </SelectItem>
                          {barbers
                            .filter(b => b && b.id && b.name)
                            .map((barber) => (
                              <SelectItem key={barber.id} value={barber.id}>
                                {barber.name}
                              </SelectItem>
                            ))}
                        </>
                      ) : (
                        <SelectItem value="no-barbers" disabled>
                          {getText("No hay barberos disponibles", "No barbers available")}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="submit" 
                className="bg-barber-600 hover:bg-barber-700"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {getText("Guardando...", "Saving...")}
                  </>
                ) : (
                  getText("Guardar Servicio", "Save Service")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddServiceModal;


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
import { ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguageCurrency } from "@/hooks/useLanguageCurrency";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres",
  }),
  price: z.coerce.number().positive({
    message: "El precio debe ser mayor que 0",
  }),
  stock: z.coerce.number().nonnegative({
    message: "El stock no puede ser negativo",
  }),
  categoryId: z.string({
    required_error: "Por favor seleccione una categoría",
  }),
});

type AddProductModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const AddProductModal = ({
  open,
  onOpenChange
}: AddProductModalProps) => {
  const { categories, addProduct } = useBarber();
  const { toast } = useToast();
  const { getText, config } = useLanguageCurrency();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price: 0,
      stock: 0,
      categoryId: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    addProduct({
      name: data.name,
      price: data.price,
      stock: data.stock,
      categoryId: data.categoryId,
    });
    
    toast({
      title: getText("Producto creado", "Product created"),
      description: getText(`El producto "${data.name}" ha sido creado exitosamente`, `Product "${data.name}" has been created successfully`),
    });
    
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            {getText("Añadir Nuevo Producto", "Add New Product")}
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
                    <Input placeholder={getText("Nombre del producto", "Product name")} {...field} />
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
                name="stock"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>{getText("Stock", "Stock")}</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" {...field} />
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

            <DialogFooter>
              <Button type="submit" className="bg-barber-600 hover:bg-barber-700">
                {getText("Guardar Producto", "Save Product")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;

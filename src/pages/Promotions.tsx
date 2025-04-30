
import { useState, useEffect } from "react";
import { usePromotions } from "@/hooks/usePromotions";
import { BackButton } from "@/components/BackButton";
import { useProductsData } from "@/hooks/useProductsData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Trash, Edit, Tag, Percent, ShoppingCart, Gift, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Promotion } from "@/lib/db";
import { toast } from "@/hooks/use-toast";

// Validation schema for the promotion form
const promotionSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
  type: z.enum(["percentage", "fixed", "bogo", "bundle"]),
  value: z.coerce.number().min(0, "El valor debe ser positivo"),
  startDate: z.date({
    required_error: "La fecha de inicio es obligatoria",
  }),
  endDate: z.date({
    required_error: "La fecha de finalización es obligatoria",
  }).refine(date => date > new Date(), {
    message: "La fecha de finalización debe ser en el futuro",
  }),
  active: z.boolean().default(true),
  minimumPurchase: z.coerce.number().min(0).optional(),
  applicableCategories: z.array(z.string()).default([]),
  applicableProducts: z.array(z.string()).default([]),
  exclusiveProducts: z.boolean().default(false),
  code: z.string().optional(),
  usageLimit: z.coerce.number().min(0).optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
});

type PromotionFormValues = z.infer<typeof promotionSchema>;

export default function Promotions() {
  const { 
    promotions, 
    activePromotions, 
    isLoading, 
    createPromotion,
    updatePromotion,
    deletePromotion
  } = usePromotions();
  const { categories, products } = useProductsData();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPromotion, setCurrentPromotion] = useState<Promotion | null>(null);
  
  // Form for creating/editing promotions
  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "percentage",
      value: 0,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      active: true,
      minimumPurchase: 0,
      applicableCategories: [],
      applicableProducts: [],
      exclusiveProducts: false,
      daysOfWeek: [],
    },
  });

  // Days of the week options for form
  const daysOfWeek = [
    { label: "Domingo", value: 0 },
    { label: "Lunes", value: 1 },
    { label: "Martes", value: 2 },
    { label: "Miércoles", value: 3 },
    { label: "Jueves", value: 4 },
    { label: "Viernes", value: 5 },
    { label: "Sábado", value: 6 },
  ];

  // Reset form when dialog closes
  useEffect(() => {
    if (!isCreateDialogOpen && !isEditDialogOpen) {
      form.reset();
    }
  }, [isCreateDialogOpen, isEditDialogOpen, form]);

  // Update form values when editing a promotion
  useEffect(() => {
    if (currentPromotion && isEditDialogOpen) {
      form.reset({
        name: currentPromotion.name,
        description: currentPromotion.description,
        type: currentPromotion.type,
        value: currentPromotion.value,
        startDate: new Date(currentPromotion.startDate),
        endDate: new Date(currentPromotion.endDate),
        active: currentPromotion.active,
        minimumPurchase: currentPromotion.minimumPurchase || 0,
        applicableCategories: currentPromotion.applicableCategories || [],
        applicableProducts: currentPromotion.applicableProducts || [],
        exclusiveProducts: currentPromotion.exclusiveProducts || false,
        code: currentPromotion.code || "",
        usageLimit: currentPromotion.usageLimit || undefined,
        daysOfWeek: currentPromotion.daysOfWeek || [],
      });
    }
  }, [currentPromotion, isEditDialogOpen, form]);

  // Handler for form submission
  const onSubmit = async (data: PromotionFormValues) => {
    try {
      if (isCreateDialogOpen) {
        await createPromotion(data as Omit<Promotion, 'id' | 'usageCount' | 'createdAt'>);
        setIsCreateDialogOpen(false);
      } else if (isEditDialogOpen && currentPromotion) {
        await updatePromotion(currentPromotion.id, data);
        setIsEditDialogOpen(false);
        setCurrentPromotion(null);
      }
    } catch (error) {
      console.error("Error saving promotion:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la promoción",
        variant: "destructive",
      });
    }
  };

  // Handle editing a promotion
  const handleEditPromotion = (promotion: Promotion) => {
    setCurrentPromotion(promotion);
    setIsEditDialogOpen(true);
  };

  // Handle deleting a promotion
  const handleDeletePromotion = async () => {
    if (!currentPromotion) return;
    
    try {
      await deletePromotion(currentPromotion.id);
      setIsDeleteDialogOpen(false);
      setCurrentPromotion(null);
    } catch (error) {
      console.error("Error deleting promotion:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la promoción",
        variant: "destructive",
      });
    }
  };

  // Display status badge for a promotion
  const getPromotionStatusBadge = (promotion: Promotion) => {
    const now = new Date();
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);
    
    if (!promotion.active) {
      return <Badge variant="outline" className="bg-gray-200 text-gray-800">Inactiva</Badge>;
    }
    
    if (now < start) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800">Programada</Badge>;
    }
    
    if (now > end) {
      return <Badge variant="outline" className="bg-red-100 text-red-800">Expirada</Badge>;
    }
    
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return <Badge variant="outline" className="bg-orange-100 text-orange-800">Límite alcanzado</Badge>;
    }
    
    return <Badge variant="outline" className="bg-green-100 text-green-800">Activa</Badge>;
  };

  // Get icon for promotion type
  const getPromotionTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="h-5 w-5 text-orange-500" />;
      case 'fixed':
        return <Tag className="h-5 w-5 text-blue-500" />;
      case 'bogo':
        return <Gift className="h-5 w-5 text-pink-500" />;
      case 'bundle':
        return <ShoppingCart className="h-5 w-5 text-green-500" />;
      default:
        return <Sparkles className="h-5 w-5 text-purple-500" />;
    }
  };

  // Get human-readable promotion type
  const getPromotionTypeName = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'Porcentaje';
      case 'fixed':
        return 'Monto fijo';
      case 'bogo':
        return 'Lleva y paga';
      case 'bundle':
        return 'Combo';
      default:
        return type;
    }
  };

  // Format promotion value for display
  const formatPromotionValue = (promotion: Promotion) => {
    if (promotion.type === 'percentage') {
      return `${promotion.value}%`;
    } else if (promotion.type === 'bogo') {
      return `${promotion.value}% en el 2do producto`;
    } else {
      return `$${promotion.value.toFixed(2)}`;
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton />
          <h1 className="text-3xl font-bold">Promociones</h1>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)} 
          className="bg-gradient-to-r from-orange-400 to-orange-600"
        >
          <Sparkles className="mr-2 h-4 w-4" /> Nueva Promoción
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-orange-500" />
        </div>
      ) : (
        <>
          {/* Active Promotions Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Promociones Activas</h2>
            {activePromotions.length === 0 ? (
              <Card className="bg-[#1A1A1A] border-[#333333]">
                <CardContent className="pt-6">
                  <p className="text-center text-gray-400">No hay promociones activas.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activePromotions.map((promotion) => (
                  <PromotionCard
                    key={promotion.id}
                    promotion={promotion}
                    onEdit={() => handleEditPromotion(promotion)}
                    onDelete={() => {
                      setCurrentPromotion(promotion);
                      setIsDeleteDialogOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          {/* All Promotions Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Todas las Promociones</h2>
            {promotions.length === 0 ? (
              <Card className="bg-[#1A1A1A] border-[#333333]">
                <CardContent className="pt-6">
                  <p className="text-center text-gray-400">No hay promociones creadas.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {promotions.map((promotion) => (
                  <PromotionCard
                    key={promotion.id}
                    promotion={promotion}
                    onEdit={() => handleEditPromotion(promotion)}
                    onDelete={() => {
                      setCurrentPromotion(promotion);
                      setIsDeleteDialogOpen(true);
                    }}
                    statusBadge={getPromotionStatusBadge(promotion)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Create/Edit Promotion Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setCurrentPromotion(null);
        }
      }}>
        <DialogContent className="bg-[#111111] border-[#333333] text-white sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isCreateDialogOpen ? "Crear Promoción" : "Editar Promoción"}</DialogTitle>
            <DialogDescription>
              {isCreateDialogOpen 
                ? "Completa los datos para crear una nueva promoción." 
                : "Modifica los datos de la promoción existente."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-4 pr-4">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la promoción</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej: Descuento del lunes"
                              className="bg-[#1A1A1A] border-[#333333]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe la promoción..."
                              className="bg-[#1A1A1A] border-[#333333] min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Promotion Type and Value */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Promoción</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-[#1A1A1A] border-[#333333]">
                                <SelectValue placeholder="Selecciona un tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[#1A1A1A] border-[#333333]">
                              <SelectItem value="percentage">Porcentaje</SelectItem>
                              <SelectItem value="fixed">Monto Fijo</SelectItem>
                              <SelectItem value="bogo">Lleva y paga (2x1, etc.)</SelectItem>
                              <SelectItem value="bundle">Combo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {field.value === "percentage" && "Descuento porcentual sobre el total o productos seleccionados."}
                            {field.value === "fixed" && "Descuento de monto fijo sobre el total o productos seleccionados."}
                            {field.value === "bogo" && "Descuento en el segundo producto (100% = 2x1, 50% = 2do a mitad de precio)."}
                            {field.value === "bundle" && "Descuento al comprar una combinación específica de productos."}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {form.watch("type") === "percentage" 
                              ? "Porcentaje de descuento"
                              : form.watch("type") === "bogo"
                                ? "Porcentaje de descuento en el 2do producto"
                                : "Monto de descuento"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-[#1A1A1A] border-[#333333]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {form.watch("type") === "percentage" && "Ej: 15 para 15% de descuento"}
                            {form.watch("type") === "bogo" && "Ej: 100 para 2x1, 50 para el 2do a mitad de precio"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha de inicio</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal bg-[#1A1A1A] border-[#333333]",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: es })
                                  ) : (
                                    <span>Selecciona una fecha</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-[#1A1A1A] border-[#333333]">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date("1900-01-01")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha de finalización</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal bg-[#1A1A1A] border-[#333333]",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: es })
                                  ) : (
                                    <span>Selecciona una fecha</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-[#1A1A1A] border-[#333333]">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Active Status */}
                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border border-[#333333] p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Promoción activa</FormLabel>
                          <FormDescription>
                            Habilita o deshabilita esta promoción
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Advanced Settings */}
                  <div className="space-y-4 border-t border-[#333333] pt-4">
                    <h3 className="text-lg font-medium">Configuración avanzada</h3>

                    {/* Minimum Purchase */}
                    <FormField
                      control={form.control}
                      name="minimumPurchase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compra mínima ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-[#1A1A1A] border-[#333333]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Monto mínimo de compra para aplicar esta promoción (0 = sin mínimo)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Promo Code */}
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código promocional</FormLabel>
                          <FormControl>
                            <Input
                              className="bg-[#1A1A1A] border-[#333333]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Código necesario para activar esta promoción (opcional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Usage Limit */}
                    <FormField
                      control={form.control}
                      name="usageLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Límite de uso</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-[#1A1A1A] border-[#333333]"
                              {...field}
                              value={field.value === undefined ? '' : field.value}
                            />
                          </FormControl>
                          <FormDescription>
                            Número máximo de veces que se puede usar esta promoción (vacío = ilimitado)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Days of Week */}
                    <FormField
                      control={form.control}
                      name="daysOfWeek"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel className="text-base">Días de aplicación</FormLabel>
                            <FormDescription>
                              Días de la semana en los que aplica esta promoción (ninguno = todos los días)
                            </FormDescription>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {daysOfWeek.map((day) => (
                              <FormField
                                key={day.value}
                                control={form.control}
                                name="daysOfWeek"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={day.value}
                                      className="flex flex-row items-center space-x-2 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(day.value)}
                                          onCheckedChange={(checked) => {
                                            const currentValue = [...(field.value || [])];
                                            if (checked) {
                                              field.onChange([...currentValue, day.value]);
                                            } else {
                                              field.onChange(
                                                currentValue.filter((value) => value !== day.value)
                                              );
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {day.label}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Applicable Categories */}
                    <FormField
                      control={form.control}
                      name="applicableCategories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categorías aplicables</FormLabel>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {categories.map((category) => (
                              <Badge
                                key={category.id}
                                variant="outline"
                                className={cn(
                                  "cursor-pointer border p-1 px-3",
                                  field.value?.includes(category.id) 
                                    ? "bg-orange-900/30 border-orange-500"
                                    : "bg-[#1A1A1A] border-[#333333]"
                                )}
                                onClick={() => {
                                  const currentValue = [...(field.value || [])];
                                  if (currentValue.includes(category.id)) {
                                    field.onChange(currentValue.filter((id) => id !== category.id));
                                  } else {
                                    field.onChange([...currentValue, category.id]);
                                  }
                                }}
                              >
                                {category.name}
                              </Badge>
                            ))}
                          </div>
                          <FormDescription>
                            Categorías a las que se aplica esta promoción (ninguna seleccionada = todas)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Applicable Products */}
                    <FormField
                      control={form.control}
                      name="applicableProducts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Productos aplicables</FormLabel>
                          <div className="max-h-[200px] overflow-y-auto border border-[#333333] rounded-md p-2">
                            <div className="flex flex-wrap gap-2">
                              {products.map((product) => (
                                <Badge
                                  key={product.id}
                                  variant="outline"
                                  className={cn(
                                    "cursor-pointer border p-1 px-3",
                                    field.value?.includes(product.id) 
                                      ? "bg-orange-900/30 border-orange-500"
                                      : "bg-[#1A1A1A] border-[#333333]"
                                  )}
                                  onClick={() => {
                                    const currentValue = [...(field.value || [])];
                                    if (currentValue.includes(product.id)) {
                                      field.onChange(currentValue.filter((id) => id !== product.id));
                                    } else {
                                      field.onChange([...currentValue, product.id]);
                                    }
                                  }}
                                >
                                  {product.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <FormDescription>
                            Productos específicos a los que se aplica esta promoción
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Exclusive Products */}
                    {form.watch("type") === "bundle" && (
                      <FormField
                        control={form.control}
                        name="exclusiveProducts"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border border-[#333333] p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Productos exclusivos</FormLabel>
                              <FormDescription>
                                Si está activado, el combo requiere exactamente los productos seleccionados
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setIsEditDialogOpen(false);
                    setCurrentPromotion(null);
                  }}
                  className="bg-[#1A1A1A] border-[#333333]"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-orange-400 to-orange-600">
                  {isCreateDialogOpen ? "Crear Promoción" : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#111111] border-[#333333] text-white">
          <DialogHeader>
            <DialogTitle>Eliminar Promoción</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar esta promoción? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-[#1A1A1A] border-[#333333]"
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDeletePromotion}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Promotion Card Component
function PromotionCard({ 
  promotion, 
  onEdit, 
  onDelete,
  statusBadge
}: { 
  promotion: Promotion; 
  onEdit: () => void; 
  onDelete: () => void;
  statusBadge?: React.ReactNode;
}) {
  // Format dates for display
  const formattedStartDate = format(new Date(promotion.startDate), "dd/MM/yyyy", { locale: es });
  const formattedEndDate = format(new Date(promotion.endDate), "dd/MM/yyyy", { locale: es });
  
  // Get promotion type icon
  const getPromotionTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="h-5 w-5 text-orange-500" />;
      case 'fixed':
        return <Tag className="h-5 w-5 text-blue-500" />;
      case 'bogo':
        return <Gift className="h-5 w-5 text-pink-500" />;
      case 'bundle':
        return <ShoppingCart className="h-5 w-5 text-green-500" />;
      default:
        return <Sparkles className="h-5 w-5 text-purple-500" />;
    }
  };

  // Get human-readable promotion type
  const getPromotionTypeName = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'Porcentaje';
      case 'fixed':
        return 'Monto fijo';
      case 'bogo':
        return 'Lleva y paga';
      case 'bundle':
        return 'Combo';
      default:
        return type;
    }
  };

  // Format promotion value for display
  const formatPromotionValue = (promotion: Promotion) => {
    if (promotion.type === 'percentage') {
      return `${promotion.value}%`;
    } else if (promotion.type === 'bogo') {
      return promotion.value === 100 
        ? "2x1"
        : `${promotion.value}% en el 2do`;
    } else {
      return `$${promotion.value.toFixed(2)}`;
    }
  };

  return (
    <Card className="overflow-hidden bg-[#1A1A1A] border-[#333333] transition-all hover:border-orange-500">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{promotion.name}</CardTitle>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onEdit}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDelete}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {statusBadge && (
          <div className="mt-1">
            {statusBadge}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        {promotion.description && (
          <CardDescription className="text-gray-300 mb-3">{promotion.description}</CardDescription>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            {getPromotionTypeIcon(promotion.type)}
            <span>
              {getPromotionTypeName(promotion.type)}: <strong>{formatPromotionValue(promotion)}</strong>
            </span>
          </div>
          
          <div className="text-sm text-gray-400">
            <p>Vigencia: {formattedStartDate} - {formattedEndDate}</p>
            
            {promotion.minimumPurchase && promotion.minimumPurchase > 0 && (
              <p className="mt-1">Compra mínima: ${promotion.minimumPurchase.toFixed(2)}</p>
            )}
            
            {promotion.code && (
              <p className="mt-1">Código: <Badge variant="outline" className="bg-gray-800">{promotion.code}</Badge></p>
            )}
            
            {promotion.usageLimit && (
              <p className="mt-1">Usos: {promotion.usageCount} / {promotion.usageLimit}</p>
            )}
            
            {promotion.daysOfWeek && promotion.daysOfWeek.length > 0 && (
              <p className="mt-1">
                Días: {promotion.daysOfWeek.map(day => 
                  ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][day]
                ).join(', ')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

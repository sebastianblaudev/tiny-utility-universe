
import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PromotionType, Promotion } from "@/types";
import {
  Trash2,
  PencilLine,
  Calendar,
  Percent,
  Tag,
  PlusCircle,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  DollarSign,
  CalendarRange,
  ShieldCheck,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm, Controller } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface ManagePromotionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotions: Promotion[];
  onAddPromotion: (promotion: Promotion) => void;
  onUpdatePromotion: (promotion: Promotion) => void;
  onDeletePromotion: (promotionId: string) => void;
}

// Helper functions for date and currency formatting
const formatDateForInput = (date: Date) => {
  return date.toISOString().split('T')[0];
};

const formatDateForDisplay = (date: Date) => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'short' }).format(date);
};

// Format currency for display
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(value);
};

// Create a zod schema for form validation
const promotionSchema = z.object({
  name: z.string().min(1, { message: "El nombre es requerido" }),
  description: z.string().optional(),
  type: z.enum([PromotionType.PERCENTAGE_OFF, PromotionType.FIXED_AMOUNT_OFF]),
  value: z.string().refine((value) => !isNaN(Number(value)) && Number(value) > 0, {
    message: "El valor debe ser un número mayor a 0",
  }),
  startDate: z.string().min(1, { message: "La fecha de inicio es requerida" }),
  endDate: z.string().min(1, { message: "La fecha de fin es requerida" }),
  active: z.boolean(),
  requiresOwnerPin: z.boolean(),
  minimumPurchase: z.string().optional(),
});

type PromotionFormValues = z.infer<typeof promotionSchema>;

const ManagePromotionsDialog = ({
  open,
  onOpenChange,
  promotions,
  onAddPromotion,
  onUpdatePromotion,
  onDeletePromotion,
}: ManagePromotionsDialogProps) => {
  const [tab, setTab] = useState<string>("list");
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [pin, setPin] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isPinVerified, setIsPinVerified] = useState<boolean>(false);
  
  const { currentUser, getAllUsers } = useAuth();
  const { toast } = useToast();
  
  // Initialize form with default values
  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      name: "",
      description: "",
      type: PromotionType.PERCENTAGE_OFF,
      value: "",
      startDate: formatDateForInput(new Date()),
      endDate: formatDateForInput(new Date(new Date().setDate(new Date().getDate() + 30))),
      active: true,
      requiresOwnerPin: false,
      minimumPurchase: "",
    }
  });
  
  // Reset form
  const resetForm = () => {
    form.reset({
      name: "",
      description: "",
      type: PromotionType.PERCENTAGE_OFF,
      value: "",
      startDate: formatDateForInput(new Date()),
      endDate: formatDateForInput(new Date(new Date().setDate(new Date().getDate() + 30))),
      active: true,
      requiresOwnerPin: false,
      minimumPurchase: "",
    });
    setEditingPromotion(null);
  };
  
  // Handle PIN verification
  const handleVerifyPin = () => {
    setIsVerifying(true);
    try {
      const users = getAllUsers();
      const ownerUser = users.find((user) => user.role === "owner" && user.pin === pin);
      
      if (ownerUser) {
        setIsPinVerified(true);
        toast({
          title: "PIN verificado",
          description: "Has sido autenticado como propietario",
        });
      } else {
        toast({
          title: "PIN incorrecto",
          description: "El PIN no corresponde a una cuenta de propietario",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al verificar el PIN",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Handle editing a promotion
  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    
    form.reset({
      name: promotion.name,
      description: promotion.description || "",
      type: promotion.type as PromotionType.PERCENTAGE_OFF | PromotionType.FIXED_AMOUNT_OFF,
      value: promotion.value.toString(),
      startDate: formatDateForInput(new Date(promotion.startDate)),
      endDate: formatDateForInput(new Date(promotion.endDate)),
      active: promotion.active,
      requiresOwnerPin: promotion.requiresOwnerPin || false,
      minimumPurchase: promotion.minimumPurchase?.toString() || "",
    });
    
    setTab("add");
  };
  
  // Handle saving a promotion
  const onSubmit = (data: PromotionFormValues) => {
    // Validating dates
    const startDateObj = new Date(data.startDate);
    const endDateObj = new Date(data.endDate);
    
    if (endDateObj < startDateObj) {
      toast({
        title: "Fechas inválidas",
        description: "La fecha de fin debe ser posterior a la fecha de inicio",
        variant: "destructive",
      });
      return;
    }
    
    const numericValue = parseFloat(data.value);
    if (data.type === PromotionType.PERCENTAGE_OFF && numericValue > 100) {
      toast({
        title: "Porcentaje inválido",
        description: "El porcentaje no puede ser mayor al 100%",
        variant: "destructive",
      });
      return;
    }
    
    const minPurchase = data.minimumPurchase ? parseFloat(data.minimumPurchase) : undefined;
    
    const newPromotion: Promotion = {
      id: editingPromotion?.id || `promo-${Date.now()}`,
      name: data.name,
      description: data.description || undefined,
      type: data.type,
      value: numericValue,
      startDate: startDateObj,
      endDate: endDateObj,
      active: data.active,
      requiresOwnerPin: data.requiresOwnerPin,
      minimumPurchase: minPurchase,
    };
    
    if (editingPromotion) {
      onUpdatePromotion(newPromotion);
      toast({
        title: "Promoción actualizada",
        description: `La promoción "${data.name}" ha sido actualizada correctamente`,
      });
    } else {
      onAddPromotion(newPromotion);
      toast({
        title: "Promoción creada",
        description: `La promoción "${data.name}" ha sido creada correctamente`,
      });
    }
    
    resetForm();
    setTab("list");
  };
  
  // Handle promotion deletion
  const handleDeletePromotion = (promotionId: string, promotionName: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la promoción "${promotionName}"?`)) {
      onDeletePromotion(promotionId);
      toast({
        title: "Promoción eliminada",
        description: `La promoción "${promotionName}" ha sido eliminada correctamente`,
      });
    }
  };
  
  // Check if the current user is the owner
  const isOwner = currentUser?.role === "owner";
  
  // Get promotion status badge
  const getStatusBadge = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);
    
    if (!promotion.active) {
      return <div className="flex items-center text-neutral-500 bg-neutral-100 text-xs px-2 py-1 rounded-full">
        <XCircle className="h-3 w-3 mr-1" />
        Inactiva
      </div>;
    }
    
    if (now < startDate) {
      return <div className="flex items-center text-orange-700 bg-orange-100 text-xs px-2 py-1 rounded-full">
        <Clock className="h-3 w-3 mr-1" />
        Pendiente
      </div>;
    }
    
    if (now > endDate) {
      return <div className="flex items-center text-red-700 bg-red-100 text-xs px-2 py-1 rounded-full">
        <XCircle className="h-3 w-3 mr-1" />
        Expirada
      </div>;
    }
    
    return <div className="flex items-center text-green-700 bg-green-100 text-xs px-2 py-1 rounded-full">
      <CheckCircle className="h-3 w-3 mr-1" />
      Activa
    </div>;
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        resetForm();
        setPin("");
        setIsPinVerified(false);
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[650px] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl">Gestionar promociones</DialogTitle>
          <DialogDescription>
            Crea y administra las promociones para tu negocio.
          </DialogDescription>
        </DialogHeader>
        
        {!isOwner && !isPinVerified ? (
          <div className="p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <Info className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" />
                <p className="text-sm text-yellow-700">
                  Solo el propietario puede gestionar las promociones. Por favor, introduce el PIN del propietario para continuar.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                type="password"
                placeholder="PIN del propietario"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={4}
                className="flex-1"
              />
              <Button 
                onClick={handleVerifyPin} 
                disabled={!pin || isVerifying}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isVerifying ? "Verificando..." : "Verificar"}
              </Button>
            </div>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <div className="border-b">
              <TabsList className="h-12 w-full rounded-none bg-transparent gap-4 px-6">
                <TabsTrigger value="list" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none data-[state=active]:bg-transparent">
                  Promociones
                </TabsTrigger>
                <TabsTrigger value="add" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none data-[state=active]:bg-transparent">
                  {editingPromotion ? "Editar" : "Crear"} promoción
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="list" className="p-6 pt-4">
              <div className="flex justify-end mb-4">
                <Button onClick={() => {
                  resetForm();
                  setTab("add");
                }} className="bg-purple-600 hover:bg-purple-700">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nueva promoción
                </Button>
              </div>
              
              {promotions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                  <Tag className="h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-gray-500 mb-2">No hay promociones creadas</p>
                  <Button variant="outline" onClick={() => setTab("add")}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Crear primera promoción
                  </Button>
                </div>
              ) : (
                <ScrollArea className="max-h-[400px] pr-4">
                  <div className="space-y-3">
                    {promotions.map((promo) => (
                      <Card key={promo.id} className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                          <div className="bg-white p-4">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap gap-2 items-center mb-2">
                                  <h3 className="font-medium text-gray-900 mr-1 truncate">{promo.name}</h3>
                                  {getStatusBadge(promo)}
                                  {promo.requiresOwnerPin && (
                                    <div className="flex items-center text-purple-700 bg-purple-100 text-xs px-2 py-1 rounded-full">
                                      <ShieldCheck className="h-3 w-3 mr-1" />
                                      PIN requerido
                                    </div>
                                  )}
                                </div>
                                
                                {promo.description && (
                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                    {promo.description}
                                  </p>
                                )}
                                
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                                  <div className="flex items-center text-xs text-gray-600">
                                    <Percent className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                                    <span>{promo.type === PromotionType.PERCENTAGE_OFF 
                                      ? `${promo.value}% de descuento` 
                                      : `${formatCurrency(promo.value)} de descuento`}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center text-xs text-gray-600">
                                    <CalendarRange className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                                    <span>
                                      {formatDateForDisplay(promo.startDate)} - {formatDateForDisplay(promo.endDate)}
                                    </span>
                                  </div>
                                  
                                  {promo.minimumPurchase && (
                                    <div className="flex items-center text-xs text-gray-600">
                                      <DollarSign className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                                      <span>Mín. {formatCurrency(promo.minimumPurchase)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex gap-2 mt-2 sm:mt-0">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-8 px-3 text-gray-700"
                                  onClick={() => handleEditPromotion(promo)}
                                >
                                  <PencilLine className="h-3.5 w-3.5 mr-1" />
                                  Editar
                                </Button>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => handleDeletePromotion(promo.id, promo.name)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  Eliminar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
            
            <TabsContent value="add" className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Ejemplo: Descuento de verano" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo <span className="text-red-500">*</span></FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona el tipo de promoción" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={PromotionType.PERCENTAGE_OFF}>
                                Porcentaje de descuento (%)
                              </SelectItem>
                              <SelectItem value={PromotionType.FIXED_AMOUNT_OFF}>
                                Monto fijo de descuento ($)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder={form.watch("type") === PromotionType.PERCENTAGE_OFF ? "Porcentaje (0-100)" : "Monto ($)"}
                              {...field} 
                            />
                          </FormControl>
                          {form.watch("type") === PromotionType.PERCENTAGE_OFF && (
                            <FormDescription>
                              Introduce un valor entre 1 y 100
                            </FormDescription>
                          )}
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
                            <Input placeholder="Descripción detallada de la promoción" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha inicio <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha fin <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="minimumPurchase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mínimo de compra</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Opcional - Monto mínimo para aplicar"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 rounded-lg border">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base mb-0">Estado de la promoción</FormLabel>
                            <FormDescription>
                              {field.value ? "La promoción está activa" : "La promoción está inactiva"}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="requiresOwnerPin"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 rounded-lg border">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base mb-0">PIN del propietario</FormLabel>
                            <FormDescription>
                              {field.value ? "Requiere PIN para aplicar" : "No requiere verificación"}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter className="pt-2">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        resetForm();
                        setTab("list");
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {editingPromotion ? "Actualizar" : "Crear"} promoción
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ManagePromotionsDialog;

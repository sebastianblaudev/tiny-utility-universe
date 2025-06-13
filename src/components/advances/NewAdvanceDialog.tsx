import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Barber, CashAdvance } from "@/types";
import { useBarber } from "@/contexts/BarberContext";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  barberId: z.string().min(1, { message: "Selecciona un barbero" }),
  amount: z.coerce.number().positive({ message: "El monto debe ser mayor a cero" }),
  description: z.string().min(3, { message: "La descripción es obligatoria" }),
  paymentMethod: z.enum(["cash", "transfer"], { 
    required_error: "Selecciona un método de pago" 
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface NewAdvanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewAdvanceDialog = ({ isOpen, onClose }: NewAdvanceDialogProps) => {
  const { barbers, addCashAdvance } = useBarber();
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      barberId: "",
      amount: 0,
      description: "",
      paymentMethod: "cash",
    },
  });

  const onSubmit = async (data: FormValues) => {
    const newAdvance: Omit<CashAdvance, "id"> = {
      barberId: data.barberId,
      amount: data.amount,
      date: new Date(),
      description: data.description,
      paymentMethod: data.paymentMethod,
    };

    try {
      await addCashAdvance(newAdvance);
      toast({
        title: "Adelanto creado",
        description: "El adelanto ha sido registrado correctamente",
      });
      form.reset();
      onClose();
      
      // Forzar recarga de la página para mostrar el adelanto inmediatamente
      window.location.reload();
    } catch (error) {
      console.error("Error creating advance:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar el adelanto",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nuevo Adelanto</DialogTitle>
          <DialogDescription>
            Registra un nuevo adelanto para un barbero.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="barberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barbero</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un barbero" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {barbers.map((barber: Barber) => (
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.valueAsNumber);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Método de pago</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="cash" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Efectivo
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="transfer" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Transferencia
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
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
                  <FormLabel>Razón/Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detalle del adelanto..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-barber-600 hover:bg-barber-700">
                Registrar Adelanto
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewAdvanceDialog;

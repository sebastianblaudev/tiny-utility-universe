import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Weight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Product {
  id: string;
  name: string;
  price: number;
  is_by_weight?: boolean;
  unit?: string;
}

interface CartItem extends Product {
  quantity: number;
  subtotal: number;
}

const WeightSaleTest = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showWeightDialog, setShowWeightDialog] = useState(false);
  const [currentWeightProduct, setCurrentWeightProduct] = useState<Product | null>(null);
  const [productWeight, setProductWeight] = useState<string>('');

  // Productos de prueba
  const testProducts: Product[] = [
    { id: '1', name: 'Manzanas', price: 2500, is_by_weight: true, unit: 'kg' },
    { id: '2', name: 'Plátanos', price: 1800, is_by_weight: true, unit: 'kg' },
    { id: '3', name: 'Carne molida', price: 8900, is_by_weight: true, unit: 'kg' },
    { id: '4', name: 'Coca Cola', price: 1500, is_by_weight: false, unit: 'unidad' },
  ];

  const addProductToCart = (product: Product) => {
    if (product.is_by_weight) {
      setCurrentWeightProduct(product);
      setProductWeight('');
      setShowWeightDialog(true);
      return;
    }

    // Producto normal
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === product.id);
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems];
        const newQuantity = updatedItems[existingItemIndex].quantity + 1;
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: newQuantity,
          subtotal: product.price * newQuantity
        };
        return updatedItems;
      } else {
        return [...prevItems, {
          ...product,
          quantity: 1,
          subtotal: product.price
        }];
      }
    });
  };

  const addWeightBasedProduct = () => {
    if (!currentWeightProduct || !productWeight) return;
    
    const weight = parseFloat(productWeight);
    if (isNaN(weight) || weight <= 0) {
      toast.error("Ingrese un peso válido");
      return;
    }

    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === currentWeightProduct.id);
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems];
        const newQuantity = updatedItems[existingItemIndex].quantity + weight;
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: newQuantity,
          subtotal: parseFloat((currentWeightProduct.price * newQuantity).toFixed(0))
        };
        return updatedItems;
      } else {
        return [...prevItems, {
          ...currentWeightProduct,
          quantity: weight,
          subtotal: parseFloat((currentWeightProduct.price * weight).toFixed(0))
        }];
      }
    });
    
    setShowWeightDialog(false);
    setCurrentWeightProduct(null);
    setProductWeight('');
    toast.success(`Agregado: ${weight} kg de ${currentWeightProduct.name}`);
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test de Venta por Peso</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Productos */}
        <Card>
          <CardHeader>
            <CardTitle>Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {testProducts.map(product => (
                <Button
                  key={product.id}
                  variant="outline"
                  className="flex items-center justify-between p-4 h-auto"
                  onClick={() => addProductToCart(product)}
                >
                  <div className="flex items-center gap-2">
                    {product.is_by_weight && <Weight className="h-4 w-4" />}
                    <div className="text-left">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatPrice(product.price)} {product.is_by_weight ? 'por kg' : 'c/u'}
                      </div>
                    </div>
                  </div>
                  <Plus className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Carrito */}
        <Card>
          <CardHeader>
            <CardTitle>Carrito</CardTitle>
          </CardHeader>
          <CardContent>
            {cartItems.length === 0 ? (
              <p className="text-muted-foreground">No hay productos en el carrito</p>
            ) : (
              <div className="space-y-3">
                {cartItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-muted rounded">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.is_by_weight ? `${item.quantity} kg` : `${item.quantity} unidades`}
                      </div>
                    </div>
                    <div className="font-medium">{formatPrice(item.subtotal)}</div>
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para ingresar peso */}
      <Dialog open={showWeightDialog} onOpenChange={setShowWeightDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ingresar peso</DialogTitle>
            <DialogDescription>
              Ingrese el peso en kilogramos para "{currentWeightProduct?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Peso en kg"
              value={productWeight}
              onChange={(e) => setProductWeight(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <span className="text-sm text-muted-foreground">kg</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWeightDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={addWeightBasedProduct}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WeightSaleTest;
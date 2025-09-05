import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  name: string;
  price: number;
  stock?: number;
}

const QuickInventoryTemp = () => {
  const [products] = useState<Product[]>([
    { id: '1', name: 'Producto 1', price: 1000, stock: 10 },
    { id: '2', name: 'Producto 2', price: 2000, stock: 5 }
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventario Rápido</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {products.map(product => (
            <div key={product.id} className="flex justify-between items-center p-2 border rounded">
              <span>{product.name}</span>
              <span>Stock: {product.stock}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickInventoryTemp;
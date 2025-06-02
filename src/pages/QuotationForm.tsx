import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getProducts, saveQuotation, getCompanyInfo, type Product, type QuotationItem, type Quotation } from "@/lib/db-service";
import { PlusCircle, MinusCircle, ArrowLeft } from "lucide-react";
import { formatCLP } from "@/lib/utils";

const QuotationForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [validityDays, setValidityDays] = useState(30);
  
  // Quotation data
  const [clientName, setClientName] = useState("");
  const [clientRut, setClientRut] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<QuotationItem[]>([
    { name: "", unitPrice: 0, quantity: 1, discount: 0 }
  ]);
  
  // Calculate subtotal, discount, tax and total
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity * (item.discount / 100), 0);
  const net = subtotal - discount;
  const tax = net * 0.19; // 19% IVA in Chile
  const total = net + tax;

  useEffect(() => {
    // Load products and company info
    const loadData = async () => {
      try {
        const productList = await getProducts();
        setProducts(productList);
        
        // Get company info for validity days
        const company = await getCompanyInfo();
        if (company) {
          setValidityDays(company.validityDays);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    
    loadData();
  }, []);

  // Add a new item to the quotation
  const addItem = () => {
    setItems([...items, { name: "", unitPrice: 0, quantity: 1, discount: 0 }]);
  };
  
  // Remove an item from the quotation
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };
  
  // Update an item in the quotation
  const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };
  
  // Set product data when a product is selected
  const selectProduct = (index: number, productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const updatedItems = [...items];
      updatedItems[index] = { 
        ...updatedItems[index], 
        name: product.name, 
        unitPrice: product.unitPrice,
        description: product.description
      };
      setItems(updatedItems);
    }
  };

  // Save the quotation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName.trim()) {
      toast.error("El nombre del cliente es obligatorio");
      return;
    }
    
    if (items.some(item => !item.name.trim() || item.quantity <= 0)) {
      toast.error("Todos los items deben tener nombre y cantidad mayor a 0");
      return;
    }
    
    setLoading(true);
    
    try {
      // Generate a unique quotation ID
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      
      // Get today's count
      const countKey = `quotationCount_${year}${month}${day}`;
      const currentCount = parseInt(localStorage.getItem(countKey) || "0");
      const newCount = currentCount + 1;
      localStorage.setItem(countKey, newCount.toString());
      
      const quotationId = `COT-${year}${month}${day}-${String(newCount).padStart(3, "0")}`;
      
      // Calculate validity date
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validityDays);
      
      // Create quotation object
      const quotation: Quotation = {
        id: quotationId,
        date: today.toISOString(),
        clientName,
        clientRut,
        clientEmail,
        clientPhone,
        items,
        notes,
        subtotal,
        discount,
        tax,
        total,
        status: 'created',
        validUntil: validUntil.toISOString()
      };
      
      await saveQuotation(quotation);
      toast.success("Cotización creada exitosamente");
      navigate(`/quotations/${quotationId}`);
    } catch (error) {
      console.error("Error saving quotation:", error);
      toast.error("Error al crear la cotización");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/quotations")}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-heading font-bold text-chile-blue">
          Nueva Cotización
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Datos del Cliente</CardTitle>
                <CardDescription>Información del cliente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientName">Nombre/Empresa *</Label>
                    <Input
                      id="clientName"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Nombre del cliente o empresa"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientRut">RUT</Label>
                    <Input
                      id="clientRut"
                      value={clientRut}
                      onChange={(e) => setClientRut(e.target.value)}
                      placeholder="RUT del cliente"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientEmail">Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="Email del cliente"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientPhone">Teléfono</Label>
                    <Input
                      id="clientPhone"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Teléfono del cliente"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Productos y Servicios</CardTitle>
                <CardDescription>Agregue los productos o servicios a cotizar</CardDescription>
              </CardHeader>
              <CardContent>
                {items.map((item, index) => (
                  <div key={index} className="mb-4 p-4 border border-border rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-2">
                      <div className="md:col-span-3">
                        <Label htmlFor={`item-name-${index}`}>Producto/Servicio *</Label>
                        {products.length > 0 ? (
                          <Select
                            value=""
                            onValueChange={(value) => selectProduct(index, parseInt(value))}
                          >
                            <SelectTrigger id={`item-name-${index}`}>
                              <SelectValue placeholder={item.name || "Seleccionar producto"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="custom">Personalizado</SelectItem>
                              {products.map((product) => (
                                <SelectItem 
                                  key={product.id} 
                                  value={product.id?.toString() || "0"}
                                >
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id={`item-name-${index}`}
                            value={item.name}
                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                            placeholder="Nombre del producto o servicio"
                            required
                          />
                        )}
                      </div>
                      <div>
                        <Label htmlFor={`item-price-${index}`}>Precio</Label>
                        <Input
                          id={`item-price-${index}`}
                          type="number"
                          value={item.unitPrice || ""}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          placeholder="Precio unitario"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor={`item-quantity-${index}`}>Cantidad</Label>
                        <Input
                          id={`item-quantity-${index}`}
                          type="number"
                          min="1"
                          value={item.quantity || ""}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          placeholder="Cantidad"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor={`item-discount-${index}`}>Descuento %</Label>
                        <Input
                          id={`item-discount-${index}`}
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount || ""}
                          onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                          placeholder="Descuento"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <div>
                        <Label htmlFor={`item-description-${index}`}>Descripción</Label>
                        <Input
                          id={`item-description-${index}`}
                          value={item.description || ""}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="Descripción adicional"
                        />
                      </div>
                      <div className="flex items-center">
                        <p className="font-medium mr-4">
                          {formatCLP(item.unitPrice * item.quantity * (1 - item.discount / 100))}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                        >
                          <MinusCircle className="h-5 w-5 text-red-500" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={addItem}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Agregar producto/servicio
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
                <CardDescription>Información adicional para la cotización</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Notas, términos y condiciones, información adicional..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px]"
                />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatCLP(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Descuento:</span>
                    <span>{formatCLP(discount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Neto:</span>
                    <span>{formatCLP(net)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA (19%):</span>
                    <span>{formatCLP(tax)}</span>
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span className="text-lg">{formatCLP(total)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-6">
                  <Button
                    type="submit"
                    className="w-full bg-chile-blue hover:bg-chile-blue/90"
                    disabled={loading}
                  >
                    {loading ? "Guardando..." : "Crear Cotización"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default QuotationForm;

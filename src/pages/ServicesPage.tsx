import { useState } from "react";
import { useBarber } from "@/contexts/BarberContext";
import { Service, Product } from "@/types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, MoreVertical, Edit, Trash, QrCode, Eye, Download } from "lucide-react";
import AddServiceModal from "@/components/services/AddServiceModal";
import AddProductModal from "@/components/services/AddProductModal";
import AddCategoryModal from "@/components/services/AddCategoryModal";
import EditServiceModal from "@/components/services/EditServiceModal";
import DownloadSingleBarcodeModal from "@/components/services/DownloadSingleBarcodeModal";
import DownloadBarcodeModal from "@/components/services/DownloadBarcodeModal";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Barcode as BarcodeComponent } from "@/components/services/Barcode";

const ServicesPage = () => {
  const { services, products, categories, barbers, deleteService, deleteProduct, generateBarcodesForAllBarbers } = useBarber();
  const { toast } = useToast();
  
  const [searchServices, setSearchServices] = useState("");
  const [searchProducts, setSearchProducts] = useState("");
  
  const [addServiceModalOpen, setAddServiceModalOpen] = useState(false);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [addCategoryModalOpen, setAddCategoryModalOpen] = useState(false);
  const [editServiceModalOpen, setEditServiceModalOpen] = useState(false);
  const [downloadBarcodeModalOpen, setDownloadBarcodeModalOpen] = useState(false);
  const [downloadSingleBarcodeModalOpen, setDownloadSingleBarcodeModalOpen] = useState(false);
  const [downloadAllBarcodesModalOpen, setDownloadAllBarcodesModalOpen] = useState(false);
  const [viewBarcodeModalOpen, setViewBarcodeModalOpen] = useState(false);
  
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Service | Product | null>(null);
  const [itemTypeToDelete, setItemTypeToDelete] = useState<"service" | "product">("service");
  
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
  const [serviceToView, setServiceToView] = useState<Service | null>(null);
  const [serviceToDownload, setServiceToDownload] = useState<Service | null>(null);
  
  const getCategoryName = (id: string) => {
    const category = categories.find(cat => cat.id === id);
    return category ? category.name : "No categoría";
  };
  
  const getBarberName = (id?: string) => {
    if (!id) return "No asignado";
    const barber = barbers.find(b => b.id === id);
    return barber ? barber.name : "Desconocido";
  };
  
  const filteredServices = searchServices.trim() === ""
    ? services
    : services.filter(service => 
        service.name.toLowerCase().includes(searchServices.toLowerCase())
      );
      
  const filteredProducts = searchProducts.trim() === ""
    ? products
    : products.filter(product => 
        product.name.toLowerCase().includes(searchProducts.toLowerCase())
      );
  
  const handleDeleteClick = (item: Service | Product, type: "service" | "product") => {
    setItemToDelete(item);
    setItemTypeToDelete(type);
    setDeleteAlertOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    
    const name = itemToDelete.name;
    
    if (itemTypeToDelete === "service") {
      deleteService(itemToDelete.id);
      toast({
        title: "Servicio eliminado",
        description: `El servicio "${name}" ha sido eliminado`
      });
    } else {
      deleteProduct(itemToDelete.id);
      toast({
        title: "Producto eliminado",
        description: `El producto "${name}" ha sido eliminado`
      });
    }
    
    setDeleteAlertOpen(false);
    setItemToDelete(null);
  };
  
  const handleEditClick = (service: Service) => {
    setServiceToEdit(service);
    setEditServiceModalOpen(true);
  };
  
  const handleViewBarcodeClick = (service: Service) => {
    console.log("Ver códigos de barras para servicio:", service);
    console.log("Código general:", service.barcode);
    console.log("Códigos de barberos:", service.barberBarcodes);
    setServiceToView(service);
    setViewBarcodeModalOpen(true);
  };
  
  const handleDownloadBarcodeClick = (service: Service) => {
    console.log("Descargar códigos para servicio:", service);
    setServiceToDownload(service);
    setDownloadSingleBarcodeModalOpen(true);
  };

  const handleDownloadAllBarcodesClick = () => {
    console.log("Descargar todos los códigos de barras");
    setDownloadAllBarcodesModalOpen(true);
  };
  
  const handleCloseEditModal = () => {
    setEditServiceModalOpen(false);
    setServiceToEdit(null);
  };
  
  const handleGenerateAllBarcodes = () => {
    if (services.length === 0 || barbers.length === 0) {
      toast({
        title: "No se pueden generar códigos",
        description: "No hay servicios o barberos disponibles",
        variant: "destructive"
      });
      return;
    }
    
    generateBarcodesForAllBarbers();
    
    toast({
      title: "Códigos de barras generados",
      description: `Se han generado códigos de barras para todos los barberos en todos los servicios`,
    });
  };
  
  const countBarberBarcodes = (service: Service): number => {
    return service.barberBarcodes?.length || 0;
  };
  
  const ServicesTabContent = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar servicios..."
            className="pl-8"
            value={searchServices}
            onChange={(e) => setSearchServices(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-1"
            onClick={() => setAddCategoryModalOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Categoría</span>
          </Button>
          <Button 
            variant="outline"
            className="flex items-center gap-1"
            onClick={handleGenerateAllBarcodes}
          >
            <QrCode className="h-4 w-4" />
            <span>Generar todos los códigos</span>
          </Button>
          <Button 
            variant="outline"
            className="flex items-center gap-1"
            onClick={handleDownloadAllBarcodesClick}
          >
            <Download className="h-4 w-4" />
            <span>Descargar todos</span>
          </Button>
          <Button 
            className="flex items-center gap-1 bg-barber-600 hover:bg-barber-700"
            onClick={() => setAddServiceModalOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Servicio</span>
          </Button>
        </div>
      </div>
      
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Duración</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Barbero</TableHead>
              <TableHead>Códigos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  No hay servicios para mostrar
                </TableCell>
              </TableRow>
            ) : (
              filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>${service.price.toFixed(2)}</TableCell>
                  <TableCell>{service.duration} min</TableCell>
                  <TableCell>{getCategoryName(service.categoryId)}</TableCell>
                  <TableCell>
                    {service.barberId ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {getBarberName(service.barberId)}
                      </span>
                    ) : (
                      "No asignado"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge 
                        variant="secondary" 
                        className={service.barcode ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        General: {service.barcode ? "✓" : "✗"}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={countBarberBarcodes(service) > 0 ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}
                      >
                        Barberos: {countBarberBarcodes(service)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadBarcodeClick(service)}
                        className="h-8 w-8"
                        title="Descargar códigos"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(service)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Editar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewBarcodeClick(service)}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Ver códigos</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteClick(service, "service")}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            <span>Eliminar</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
  
  const ProductsTabContent = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            className="pl-8"
            value={searchProducts}
            onChange={(e) => setSearchProducts(e.target.value)}
          />
        </div>
        <Button 
          className="flex items-center gap-1 bg-barber-600 hover:bg-barber-700"
          onClick={() => setAddProductModalOpen(true)}
        >
          <PlusCircle className="h-4 w-4" />
          <span>Producto</span>
        </Button>
      </div>
      
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  No hay productos para mostrar
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        product.stock > 5
                          ? "bg-green-100 text-green-800"
                          : product.stock > 0
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(product, "product")}
                    >
                      <Trash className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Servicios y Productos</h1>
        <p className="text-muted-foreground">
          Administra tus servicios, productos e inventario
        </p>
      </div>
      
      <Tabs defaultValue="services">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="services">Servicios</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
        </TabsList>
        <TabsContent value="services" className="mt-6">
          <ServicesTabContent />
        </TabsContent>
        <TabsContent value="products" className="mt-6">
          <ProductsTabContent />
        </TabsContent>
      </Tabs>
      
      {/* Modals */}
      <AddServiceModal 
        open={addServiceModalOpen} 
        onOpenChange={setAddServiceModalOpen} 
      />
      
      <AddProductModal 
        open={addProductModalOpen} 
        onOpenChange={setAddProductModalOpen} 
      />
      
      <AddCategoryModal 
        open={addCategoryModalOpen} 
        onOpenChange={setAddCategoryModalOpen} 
      />
      
      <EditServiceModal 
        open={editServiceModalOpen}
        onOpenChange={handleCloseEditModal}
        service={serviceToEdit}
        onSave={() => {
          toast({
            title: "Servicio actualizado",
            description: "El servicio ha sido actualizado correctamente"
          });
        }}
      />
      
      <DownloadSingleBarcodeModal
        isOpen={downloadSingleBarcodeModalOpen}
        onClose={() => {
          setDownloadSingleBarcodeModalOpen(false);
          setServiceToDownload(null);
        }}
        service={serviceToDownload}
      />

      <DownloadBarcodeModal
        isOpen={downloadAllBarcodesModalOpen}
        onClose={() => setDownloadAllBarcodesModalOpen(false)}
        services={services}
      />

      {/* Modal para ver códigos de barras */}
      <Dialog open={viewBarcodeModalOpen} onOpenChange={setViewBarcodeModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Códigos de Barras - {serviceToView?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Código general del servicio */}
            {serviceToView?.barcode ? (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-green-600">Código General del Servicio</h3>
                <div className="flex flex-col items-center space-y-2">
                  <BarcodeComponent 
                    value={serviceToView.barcode} 
                    options={{ 
                      format: 'CODE128',
                      width: 2,
                      height: 60,
                      displayValue: true,
                      fontSize: 12,
                      margin: 5
                    }} 
                  />
                  <p className="text-sm text-gray-600">Código: {serviceToView.barcode}</p>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-4 text-center text-gray-500">
                <p>No hay código general generado para este servicio</p>
              </div>
            )}

            {/* Códigos de barberos */}
            {serviceToView?.barberBarcodes && serviceToView.barberBarcodes.length > 0 ? (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-blue-600">Códigos por Barbero</h3>
                <div className="space-y-4">
                  {serviceToView.barberBarcodes.map((barberCode, index) => (
                    <div key={index} className="border-l-4 border-blue-200 pl-4">
                      <p className="font-medium mb-2">{getBarberName(barberCode.barberId)}</p>
                      <div className="flex flex-col items-center space-y-2">
                        <BarcodeComponent 
                          value={barberCode.barcode} 
                          options={{ 
                            format: 'CODE128',
                            width: 2,
                            height: 60,
                            displayValue: true,
                            fontSize: 12,
                            margin: 5
                          }} 
                        />
                        <p className="text-sm text-gray-600">Código: {barberCode.barcode}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-4 text-center text-gray-500">
                <p>No hay códigos de barberos generados para este servicio</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. 
              {itemTypeToDelete === "service" 
                ? "Esto eliminará permanentemente el servicio."
                : "Esto eliminará permanentemente el producto del inventario."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServicesPage;

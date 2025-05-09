
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { Save, RefreshCw } from "lucide-react";
import { Auth } from '@/lib/auth';
import { supabase } from "@/integrations/supabase/client";
import { invokeBucketSetupFunction } from "@/utils/setupBackupBucket";
import { openDB } from 'idb';
import { DB_NAME } from '@/lib/query-client';
import type { BusinessData } from '@/types/business';

export default function OnlineBackup() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [backupPath, setBackupPath] = useState<string | null>(null);
  
  // Function to create online backup
  const createOnlineBackup = async () => {
    setIsCreating(true);
    
    try {
      // Check authentication
      const auth = Auth.getInstance();
      if (!auth.isAuthenticated() || !auth.currentUser?.id) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para crear un respaldo online",
          variant: "destructive"
        });
        return;
      }
      
      const userId = auth.currentUser.id;
      
      // Ensure the backup bucket exists
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        console.error("Error checking buckets:", bucketError);
        toast({
          title: "Error",
          description: "Error al verificar el bucket de respaldos",
          variant: "destructive"
        });
        return;
      }
      
      const bucketExists = buckets.some(bucket => bucket.name === 'user_backups');
      
      if (!bucketExists) {
        console.log("Bucket doesn't exist, trying to create via edge function");
        const created = await invokeBucketSetupFunction();
        
        if (!created) {
          toast({
            title: "Error",
            description: "No se pudo crear el bucket de respaldos",
            variant: "destructive"
          });
          return;
        }
      }
      
      // Create backup data
      const db = await openDB(DB_NAME, 9); // Use DB_VERSION from error message
      
      const products = await db.getAll('products');
      const customers = await db.getAll('customers');
      const orders = await db.getAll('orders');
      const tables = await db.getAll('tables');
      
      // Try to get business data
      const businessData = await db.get('business', 1) as BusinessData | undefined;
      
      // Create backup data object
      const backupData = {
        products,
        customers,
        orders,
        tables,
        timestamp: new Date().toISOString(),
        tenantId: userId,
        business: businessData || {
          id: userId || 'default',
          name: 'PizzaPOS',
          email: auth.currentUser?.username || 'anonymous@pizzapos.app',
          isActive: true
        }
      };
      
      // Convert data to blob
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      
      // Upload to Supabase Storage
      const filePath = `${userId}/bkp.json`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user_backups')
        .upload(filePath, blob, { upsert: true });
        
      if (uploadError) {
        console.error("Error uploading backup:", uploadError);
        toast({
          title: "Error",
          description: "No se pudo subir el respaldo a la nube",
          variant: "destructive"
        });
        return;
      }
      
      // Get public URL for the file
      const { data: urlData } = await supabase.storage
        .from('user_backups')
        .createSignedUrl(filePath, 60 * 60); // 1 hour expiration
      
      if (urlData) {
        setBackupPath(urlData.signedUrl);
      }
      
      toast({
        title: "Respaldo creado",
        description: "El respaldo en línea se ha creado correctamente"
      });
      
    } catch (error) {
      console.error("Error creating online backup:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al crear el respaldo online",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white w-full m-0 p-0">
      <div className="p-4 relative">
        <BackButton />
        <div className="max-w-4xl mx-auto mt-12">
          <h1 className="text-2xl font-bold mb-6 text-white text-center">Respaldo Online</h1>
          
          <Card className="bg-[#1A1A1A] border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Crear Respaldo Online</CardTitle>
              <CardDescription className="text-gray-400">
                Crea un respaldo en línea que se guarda en la nube con tu ID único de negocio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={createOnlineBackup}
                className="w-full bg-[#4A64E2] hover:bg-[#3B51B8] flex items-center justify-center"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="mr-2 animate-spin" />
                    Creando Respaldo...
                  </>
                ) : (
                  <>
                    <Save className="mr-2" />
                    Crear Respaldo Online
                  </>
                )}
              </Button>
              
              {backupPath && (
                <div className="mt-4 p-4 bg-zinc-800 rounded-md">
                  <p className="text-sm font-medium mb-2">Respaldo creado correctamente:</p>
                  <p className="text-xs text-blue-400 break-all">{backupPath}</p>
                </div>
              )}
              
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Información del Respaldo</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-300">
                  <li>Se crea una carpeta con tu ID de usuario</li>
                  <li>Se guarda un archivo bkp.json dentro de la carpeta</li>
                  <li>El archivo contiene tus productos, clientes, órdenes y mesas</li>
                  <li>Los respaldos anteriores con el mismo nombre son sobrescritos</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

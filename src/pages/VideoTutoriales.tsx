
import React from 'react';
import Layout from '@/components/Layout';
import { PageTitle } from '@/components/ui/page-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VideoTutorial {
  id: string;
  title: string;
  url: string;
  description: string;
}

const VideoTutoriales = () => {
  const tutorials: VideoTutorial[] = [
    {
      id: "activating-license",
      title: "Activando Mi Licencia | Venta POS",
      url: "https://www.youtube.com/embed/HLtM_HvxKuk",
      description: "Aprende cómo activar tu licencia de Venta POS para comenzar a utilizar todas las funcionalidades."
    },
    {
      id: "creating-customers",
      title: "Creando Clientes y Asignándolos a una Venta",
      url: "https://www.youtube.com/embed/HREHlHNiB0c",
      description: "Descubre cómo crear perfiles de clientes y asignarlos a tus ventas para un mejor seguimiento."
    },
    {
      id: "cash-and-multiple-payment",
      title: "Realizando Venta en Efectivo y con Múltiple Medio de Pago",
      url: "https://www.youtube.com/embed/-Uvd85r4AhE",
      description: "Aprende cómo procesar ventas con efectivo y utilizando diferentes métodos de pago simultáneamente."
    },
    {
      id: "categories",
      title: "Creando Categorías y Asignándolas a Productos",
      url: "https://www.youtube.com/embed/TUoaCLRPu5o",
      description: "Organiza tu inventario creando categorías y asignándolas a tus productos."
    },
    // Removed the video about printing labels and barcodes
    {
      id: "creating-products",
      title: "Creando Productos",
      url: "https://www.youtube.com/embed/WZ1sCk71y4s",
      description: "Aprende a crear y gestionar productos en el sistema Venta POS."
    }
  ];

  return (
    <Layout>
      <div className="container py-6">
        <PageTitle 
          title="Video Tutoriales" 
          description="Aprende a utilizar Venta POS con estos videos explicativos" 
        />

        <Tabs defaultValue="grid" className="w-full">
          <div className="flex justify-end mb-4">
            <TabsList>
              <TabsTrigger value="grid"><Grid className="mr-2 h-4 w-4" /> Cuadrícula</TabsTrigger>
              <TabsTrigger value="list">Lista</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <TabsContent value="grid" className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
                {tutorials.map(tutorial => (
                  <Card key={tutorial.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <AspectRatio ratio={16 / 9}>
                        <iframe
                          src={tutorial.url}
                          title={tutorial.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="rounded-md h-full w-full object-cover"
                        />
                      </AspectRatio>
                      <CardDescription>{tutorial.description}</CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="list" className="w-full">
              <div className="flex flex-col space-y-6 pb-4">
                {tutorials.map(tutorial => (
                  <Card key={tutorial.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-full md:w-[320px] p-4">
                        <AspectRatio ratio={16 / 9}>
                          <iframe
                            src={tutorial.url}
                            title={tutorial.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="rounded-md h-full w-full object-cover"
                          />
                        </AspectRatio>
                      </div>
                      <div className="flex-1 flex flex-col p-4">
                        <CardTitle className="text-xl mb-2">{tutorial.title}</CardTitle>
                        <CardDescription className="text-base">{tutorial.description}</CardDescription>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </Layout>
  );
};

export default VideoTutoriales;

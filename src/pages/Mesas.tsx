import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Settings } from "lucide-react";
import { useMesas, type Mesa } from "@/hooks/useMesas";
import { usePedidosMesa } from "@/hooks/usePedidosMesa";
import { MesaCard } from "@/components/mesas/MesaCard";
import { MesaForm } from "@/components/mesas/MesaForm";
import { PedidoMesaView } from "@/components/mesas/PedidoMesaView";
import { PageTitle } from "@/components/ui/page-title";

export default function Mesas() {
  const { mesas, loading, createMesa, updateMesa, deleteMesa } = useMesas();
  const { pedidos } = usePedidosMesa();
  
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMesas = mesas.filter(mesa =>
    mesa.numero.toString().includes(searchQuery) ||
    mesa.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mesa.ubicacion?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMesaConPedido = (mesaId: string) => {
    return pedidos.some(pedido => pedido.mesa_id === mesaId);
  };

  const handleSaveMesa = async (mesaData: Omit<Mesa, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
    if (editingMesa) {
      await updateMesa(editingMesa.id, mesaData);
    } else {
      await createMesa(mesaData);
    }
    setEditingMesa(null);
  };

  const handleEditMesa = (mesa: Mesa) => {
    setEditingMesa(mesa);
    setShowForm(true);
  };

  const handleSelectMesa = (mesa: Mesa) => {
    setSelectedMesa(mesa);
  };

  if (selectedMesa) {
    return (
      <PedidoMesaView 
        mesa={selectedMesa} 
        onBack={() => setSelectedMesa(null)} 
      />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Cargando mesas...</div>
      </div>
    );
  }

  const mesasDisponibles = mesas.filter(m => m.estado === 'disponible').length;
  const mesasOcupadas = mesas.filter(m => m.estado === 'ocupada').length;
  const mesasReservadas = mesas.filter(m => m.estado === 'reservada').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <PageTitle 
          title="Gestión de Mesas" 
          subtitle="Administra las mesas del restaurante y toma pedidos"
        />

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Mesas</p>
                  <p className="text-2xl font-bold">{mesas.length}</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Disponibles</p>
                  <p className="text-2xl font-bold text-green-600">{mesasDisponibles}</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ocupadas</p>
                  <p className="text-2xl font-bold text-red-600">{mesasOcupadas}</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reservadas</p>
                  <p className="text-2xl font-bold text-yellow-600">{mesasReservadas}</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar mesas por número, nombre o ubicación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Mesa
          </Button>
        </div>

        {/* Grid de mesas */}
        {filteredMesas.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No se encontraron mesas' : 'No hay mesas configuradas'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Mesa
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMesas.map((mesa) => (
              <MesaCard
                key={mesa.id}
                mesa={mesa}
                tienePedidoActivo={getMesaConPedido(mesa.id)}
                onSelect={handleSelectMesa}
                onEdit={handleEditMesa}
              />
            ))}
          </div>
        )}

        {/* Modal de formulario */}
        <MesaForm
          mesa={editingMesa}
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingMesa(null);
          }}
          onSave={handleSaveMesa}
        />
      </div>
    </div>
  );
}
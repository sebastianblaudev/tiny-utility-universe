
import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { CustomerType } from '@/lib/supabase-helpers';
import { toast } from 'react-hot-toast';

interface CustomerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: CustomerType) => void;
}

const CustomerSearchModal: React.FC<CustomerSearchModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching customers:', error);
        toast.error('Error al cargar los clientes');
      }

      if (data) {
        setCustomers(data as CustomerType[]);
      }
    } catch (error) {
      console.error('Unexpected error fetching customers:', error);
      toast.error('Error inesperado al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.phone && customer.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-auto">
        <h2 className="text-2xl font-bold mb-4">Seleccionar Cliente</h2>
        
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          className="w-full p-2 border rounded mb-4"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        {loading ? (
          <p>Cargando clientes...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">Nombre</th>
                  <th className="py-2 px-4 border-b text-left">Email</th>
                  <th className="py-2 px-4 border-b text-left">Teléfono</th>
                  <th className="py-2 px-4 border-b text-left">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="py-2 px-4 border-b">{customer.name}</td>
                      <td className="py-2 px-4 border-b">{customer.email || '-'}</td>
                      <td className="py-2 px-4 border-b">{customer.phone || '-'}</td>
                      <td className="py-2 px-4 border-b">
                        <button
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded"
                          onClick={() => onSelect(customer)}
                        >
                          Seleccionar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center">
                      No se encontraron clientes con esa búsqueda
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="flex justify-end mt-4">
          <button
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerSearchModal;

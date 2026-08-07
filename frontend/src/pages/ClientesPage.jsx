import { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import api from '../services/api';
import TablaClientes from '../components/clientes/TablaClientes';
import ModalCliente from '../components/clientes/ModalCliente';

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/clientes');
      setClientes(response.data);
      setFilteredClientes(response.data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    const results = clientes.filter(cliente => 
      cliente.cedula.includes(searchTerm) || 
      `${cliente.nombres} ${cliente.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClientes(results);
  }, [searchTerm, clientes]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Clientes</h1>
          <p className="text-gray-500 mt-1">Administra la cartera de clientes de CrediRuta.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="mt-4 md:mt-0 bg-corporativo hover:bg-corporativo-dark text-white px-5 py-2.5 rounded-lg shadow-md font-medium flex items-center transition-all"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Cliente
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex items-center">
        <Search className="w-5 h-5 text-gray-400 mr-3" />
        <input 
          type="text" 
          placeholder="Buscar por cédula o nombre..." 
          className="w-full focus:outline-none text-gray-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <TablaClientes clientes={filteredClientes} loading={loading} />

      <ModalCliente 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onClientAdded={fetchClientes} 
      />
    </div>
  );
}

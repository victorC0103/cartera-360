import { useState } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../services/api';

export default function ModalCliente({ isOpen, onClose, onClientAdded }) {
  const [formData, setFormData] = useState({
    cedula: '',
    nombres: '',
    apellidos: '',
    id_sector_fk: 1, // Por defecto, asumimos que existe el sector 1 (debe venir del catálogo idealmente)
    direccion_detallada: '',
    telefono_principal: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/clientes', formData);
      onClientAdded(); // Recarga la tabla
      onClose(); // Cierra el modal
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el cliente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Registrar Nuevo Cliente</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cédula *</label>
              <input 
                required 
                name="cedula"
                value={formData.cedula}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-corporativo focus:border-transparent" 
                placeholder="Ej. 1712345678" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Principal</label>
              <input 
                name="telefono_principal"
                value={formData.telefono_principal}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-corporativo focus:border-transparent" 
                placeholder="Ej. 0991234567" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
              <input 
                required 
                name="nombres"
                value={formData.nombres}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-corporativo focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
              <input 
                required 
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-corporativo focus:border-transparent" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Detallada</label>
              <input 
                name="direccion_detallada"
                value={formData.direccion_detallada}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-corporativo focus:border-transparent" 
                placeholder="Calle principal, secundaria, referencias..." 
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-corporativo text-white rounded-md hover:bg-corporativo-dark transition-colors flex items-center disabled:opacity-70"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Guardando...' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

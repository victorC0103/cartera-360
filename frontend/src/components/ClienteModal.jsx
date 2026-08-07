import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import api from '../services/api';

const INITIAL_FORM = {
  cedula: '',
  nombres: '',
  apellidos: '',
  telefono_principal: '',
  id_canton: '',
  id_sector_fk: '',
  direccion_detallada: '',
  referencia: '',
};

export default function ClienteModal({ isOpen, onClose, onSaved, clienteToEdit }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [cantones, setCantones] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [sectoresFiltrados, setSectoresFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!clienteToEdit;

  // Cargar catálogos desde la BD
  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [cantonesRes, sectoresRes] = await Promise.all([
          api.get('/catalogos/cantones'),
          api.get('/catalogos/sectores'),
        ]);
        setCantones(cantonesRes.data);
        setSectores(sectoresRes.data);
      } catch (err) {
        console.error('Error cargando catálogos:', err);
      }
    };
    fetchCatalogos();
  }, []);

  // Poblar formulario cuando se edita un cliente existente
  useEffect(() => {
    if (clienteToEdit) {
      // Buscar el cantón del sector que tiene el cliente
      const sectorObj = sectores.find(s => s.id_sector === clienteToEdit.id_sector_fk);
      setForm({
        cedula: clienteToEdit.cedula || '',
        nombres: clienteToEdit.nombres || '',
        apellidos: clienteToEdit.apellidos || '',
        telefono_principal: clienteToEdit.telefono_principal || '',
        id_canton: sectorObj ? String(sectorObj.id_canton_fk) : '',
        id_sector_fk: clienteToEdit.id_sector_fk ? String(clienteToEdit.id_sector_fk) : '',
        direccion_detallada: clienteToEdit.direccion_detallada || '',
        referencia: clienteToEdit.referencia || '',
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setError('');
  }, [clienteToEdit, isOpen, sectores]);

  // Filtrar sectores cuando cambia el cantón seleccionado
  useEffect(() => {
    if (form.id_canton) {
      const filtered = sectores.filter(s => s.id_canton_fk === Number(form.id_canton));
      setSectoresFiltrados(filtered);
      // Si el sector actual no pertenece al cantón, resetearlo
      const sectorExists = filtered.some(s => s.id_sector === Number(form.id_sector_fk));
      if (!sectorExists && !clienteToEdit) {
        setForm(prev => ({ ...prev, id_sector_fk: '' }));
      }
    } else {
      setSectoresFiltrados([]);
      setForm(prev => ({ ...prev, id_sector_fk: '' }));
    }
  }, [form.id_canton, sectores]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      cedula: form.cedula,
      nombres: form.nombres,
      apellidos: form.apellidos,
      telefono_principal: form.telefono_principal,
      id_sector_fk: Number(form.id_sector_fk),
      direccion_detallada: form.direccion_detallada,
      estado_cliente: clienteToEdit?.estado_cliente || 'ACTIVO',
    };

    try {
      if (isEditing) {
        await api.put(`/clientes/${clienteToEdit.id_cliente}`, payload);
      } else {
        await api.post('/clientes', payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Ocurrió un error al guardar el cliente.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = 'w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all';
  const labelClasses = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 transition-all">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">

        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Sección: Datos Personales */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Datos Personales</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Cédula <span className="text-rose-500">*</span></label>
                <input
                  required
                  name="cedula"
                  value={form.cedula}
                  onChange={handleChange}
                  maxLength={13}
                  className={inputClasses}
                  placeholder="Ej. 0912345678"
                />
              </div>
              <div>
                <label className={labelClasses}>Teléfono Principal</label>
                <input
                  name="telefono_principal"
                  value={form.telefono_principal}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="Ej. 0991234567"
                />
              </div>
              <div>
                <label className={labelClasses}>Nombres <span className="text-rose-500">*</span></label>
                <input
                  required
                  name="nombres"
                  value={form.nombres}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="Nombres completos"
                />
              </div>
              <div>
                <label className={labelClasses}>Apellidos <span className="text-rose-500">*</span></label>
                <input
                  required
                  name="apellidos"
                  value={form.apellidos}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="Apellidos completos"
                />
              </div>
            </div>
          </div>

          {/* Sección: Ubicación Geográfica */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ubicación Geográfica</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Cantón <span className="text-rose-500">*</span></label>
                <select
                  required
                  name="id_canton"
                  value={form.id_canton}
                  onChange={handleChange}
                  className={inputClasses}
                >
                  <option value="">Seleccione un cantón...</option>
                  {cantones.map(c => (
                    <option key={c.id_canton} value={c.id_canton}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Sector / Recinto <span className="text-rose-500">*</span></label>
                <select
                  required
                  name="id_sector_fk"
                  value={form.id_sector_fk}
                  onChange={handleChange}
                  disabled={!form.id_canton}
                  className={`${inputClasses} ${!form.id_canton ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                >
                  <option value="">
                    {form.id_canton ? 'Seleccione un sector...' : 'Seleccione cantón primero'}
                  </option>
                  {sectoresFiltrados.map(s => (
                    <option key={s.id_sector} value={s.id_sector}>{s.nombre} ({s.tipo_zona})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sección: Detalle de Dirección */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Detalle de Dirección</p>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={labelClasses}>Dirección Detallada</label>
                <input
                  name="direccion_detallada"
                  value={form.direccion_detallada}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="Calle principal y secundaria, número de casa..."
                />
              </div>
              <div>
                <label className={labelClasses}>Referencia de Ubicación</label>
                <textarea
                  name="referencia"
                  value={form.referencia}
                  onChange={handleChange}
                  rows={2}
                  className={`${inputClasses} resize-none`}
                  placeholder="Cerca de..., frente a..., a lado de..."
                />
              </div>
            </div>
          </div>

          {/* Footer con botones */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar Cliente')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

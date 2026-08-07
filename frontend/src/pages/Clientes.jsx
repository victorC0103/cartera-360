import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, ShieldCheck, ShieldOff, Loader2, Users } from 'lucide-react';
import api from '../services/api';
import ClienteModal from '../components/ClienteModal';
import Pagination from '../components/Pagination';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteToEdit, setClienteToEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/clientes');
      setClientes(data);
      setFiltered(data);
    } catch (err) {
      console.error('Error cargando clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClientes(); }, []);

  // Filtrado en tiempo real por cédula o nombre
  useEffect(() => {
    const q = search.toLowerCase().trim();
    if (!q) { setFiltered(clientes); return; }
    setFiltered(
      clientes.filter(c =>
        c.cedula?.includes(q) ||
        `${c.nombres} ${c.apellidos}`.toLowerCase().includes(q)
      )
    );
    setCurrentPage(1); // reset on search
  }, [search, clientes]);

  // Slice de la página actual
  const pagedClientes = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleEdit = (cliente) => {
    setClienteToEdit(cliente);
    setModalOpen(true);
  };

  const handleNew = () => {
    setClienteToEdit(null);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este cliente?')) return;
    try {
      await api.delete(`/clientes/${id}`);
      fetchClientes();
    } catch (err) {
      console.error('Error eliminando cliente:', err);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Gestión de Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">Administra la cartera de clientes de CrediRuta.</p>
        </div>
        <button
          onClick={handleNew}
          className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* ── Barra de búsqueda ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cédula o nombre del cliente..."
          className="flex-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
        />
        {search && (
          <span className="text-xs text-gray-400 shrink-0">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Tabla de Clientes ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              {search ? 'No se encontraron clientes con ese criterio.' : 'Aún no hay clientes registrados.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cédula</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagedClientes.map((c) => (
                  <tr key={c.id_cliente} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 font-mono">{c.cedula}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{c.nombres} {c.apellidos}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{c.nombre_sector || '—'}</div>
                      <div className="text-xs text-gray-400">{c.nombre_canton || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {c.telefono_principal || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {c.estado_cliente === 'ACTIVO' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                          <ShieldCheck className="w-3 h-3" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                          <ShieldOff className="w-3 h-3" />
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(c)}
                          title="Editar"
                          className="p-2 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id_cliente)}
                          title="Eliminar"
                          className="p-2 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* ── Paginación ── */}
        {!loading && filtered.length > 0 && (
          <Pagination
            totalItems={filtered.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
          />
        )}
      </div>

      {/* ── Modal ── */}
      <ClienteModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setClienteToEdit(null); }}
        onSaved={fetchClientes}
        clienteToEdit={clienteToEdit}
      />
    </div>
  );
}

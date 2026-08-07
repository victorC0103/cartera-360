import { useState } from 'react';
import { LayoutDashboard, Users, Package, FileText, CreditCard, Settings, LogOut, Menu, X, Upload } from 'lucide-react';
import Clientes from './pages/Clientes';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario';
import VentasCredito from './pages/VentasCredito';
import NuevaVenta from './pages/NuevaVenta';
import Cartillas from './pages/Cartillas';
import ImportadorMasivo from './components/ImportadorMasivo';

import Login from './pages/Login';
import { AuthContext } from './context/AuthContext';
import { useContext } from 'react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'inventario', label: 'Inventario', icon: Package },
  { id: 'creditos', label: 'Ventas a Crédito', icon: CreditCard },
  { id: 'cartillas', label: 'Cartillas', icon: FileText },
  { id: 'importador', label: 'Importador Masivo', icon: Upload },
];

function App() {
  const { isAuthenticated, logout, user } = useContext(AuthContext);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Si no está autenticado, renderizar solo Login
  if (!isAuthenticated) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'clientes': return <Clientes />;
      case 'inventario': return <Inventario />;
      case 'creditos': return <VentasCredito onViewChange={setCurrentView} />;
      case 'nueva-venta': return <NuevaVenta onViewChange={setCurrentView} />;
      case 'cartillas': return <Cartillas />;
      case 'importador': return <ImportadorMasivo />;
      case 'dashboard':
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-gray-900 tracking-tight text-lg">CrediRuta</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menú de Navegación */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setCurrentView(item.id); setSidebarOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer del sidebar */}
        <div className="border-t border-gray-100 p-3 space-y-1">
          {user && (
            <div className="px-3 py-2 mb-2 bg-indigo-50 rounded-lg">
              <p className="text-sm font-semibold text-indigo-900">{user.username}</p>
              <p className="text-xs text-indigo-700">{user.rol}</p>
            </div>
          )}
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all">
            <Settings className="w-[18px] h-[18px] text-gray-400" />
            Configuración
          </button>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-[18px] h-[18px] text-gray-400" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar minimalista (solo móvil) */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-700">
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-4 font-semibold text-gray-900">CrediRuta ERP</span>
        </header>

        {/* Área de contenido */}
        <main className="flex-1 overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;

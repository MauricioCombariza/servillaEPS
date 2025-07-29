// frontend-admin/src/components/layout/Layout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';

// Importamos los componentes del layout y nuestro hook de autenticación
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../hooks/useAuth';

// Definimos la lista de enlaces aquí, en un solo lugar.
const allNavLinks = [
  { name: 'Dashboard', path: '/', roles: ['admin', 'operador'] },
  { name: 'Pedidos en Validación', path: '/pedidos', roles: ['admin', 'operador'] },
  { name: 'Recepción de Lotes', path: '/logistica/recepcion', roles: ['admin', 'operador'] },
  { name: 'Olas de Picking', path: '/logistica/picking', roles: ['admin', 'operador'] },
  { name: 'Guía de Alistamiento', path: '/logistica/alistamiento', roles: ['admin', 'operador'] },
  { name: 'Empaque de Pedidos', path: '/logistica/empaque', roles: ['admin', 'operador'] },
  { name: 'Asignación de Rutas', path: '/logistica/asignacion', roles: ['admin', 'operador'] },
  { name: 'Rutas Activas', path: '/logistica/rutas_activas', roles: ['admin', 'operador'] },
  { name: 'Conciliación', path: '/cierre/conciliacion', roles: ['admin'] }, // <-- Solo para admin
];

const Layout: React.FC = () => {
  const { userRole } = useAuth();
  const accessibleNavLinks = allNavLinks.filter(link => 
    userRole && link.roles.includes(userRole)
  );
  return (
    <div className="flex h-screen bg-lightser">
      {/* Pasamos la lista de enlaces como prop al Sidebar */}
      {/* <Sidebar links={navLinks} /> */}
      <Sidebar links={accessibleNavLinks} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-lightser">
          <div className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
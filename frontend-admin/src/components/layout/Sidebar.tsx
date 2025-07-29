// frontend-admin/src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';

// Definimos el tipo para cada enlace de navegación
interface NavLinkItem {
  name: string;
  path: string;
  // Podríamos añadir un 'icon' aquí a futuro
}

// El componente ahora espera una prop 'links'
interface SidebarProps {
  links: NavLinkItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ links }) => {
  const activeLinkClass = 'bg-ser text-white';
  const inactiveLinkClass = 'text-gray-200 hover:bg-darkser hover:text-white';

  return (
    <div className="flex flex-col w-64 bg-darkser">
      <div className="flex items-center justify-center h-16 text-white">
        <span className="text-2xl font-bold">Farma-App</span>
      </div>
      <div className="flex flex-col flex-grow">
        <nav className="flex-1 px-2 pb-4 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              end // 'end' prop asegura que solo la ruta exacta esté activa, útil para '/'
              className={({ isActive }) => 
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
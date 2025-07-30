// frontend-admin/src/components/layout/MobileFooter.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';

// A futuro, estos serían iconos reales
const navLinks = [
  { name: 'Mi Ruta', path: '/app-mensajero', icon: 'RutaIcon' },
  { name: 'Escanear', path: '/app-mensajero/escanear', icon: 'EscanerIcon' },
  { name: 'Perfil', path: '/app-mensajero/perfil', icon: 'PerfilIcon' },
];

const MobileFooter: React.FC = () => {
  return (
    <footer className="sticky bottom-0 z-10 grid grid-cols-3 text-white shadow-lg bg-darkser">
      {navLinks.map(link => (
        <NavLink
          key={link.name}
          to={link.path}
          end={link.path === '/app-mensajero'} // 'end' para la ruta raíz
          className={({ isActive }) => 
            `flex flex-col items-center justify-center py-2 text-xs text-center transition-colors duration-150 
            ${isActive ? 'text-white bg-ser' : 'text-whiteser hover:bg-ser hover:text-white'}`
          }
        >
          {/* Aquí irían los iconos SVG */}
          <span className="w-6 h-6 mb-1">
            {/* Placeholder para el icono */}
            {link.icon === 'RutaIcon' && '🗺️'}
            {link.icon === 'EscanerIcon' && '📷'}
            {link.icon === 'PerfilIcon' && '👤'}
          </span>
          {link.name}
        </NavLink>
      ))}
    </footer>
  );
};

export default MobileFooter;
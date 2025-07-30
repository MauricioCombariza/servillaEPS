// frontend-admin/src/components/layout/MobileHeader.tsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const MobileHeader: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 text-white shadow-md bg-darkser">
      <div className="text-xl font-bold">
        Farma App
      </div>
      <div className="flex items-center">
        <span className="text-sm mr-2">{user?.sub}</span>
        <button 
          onClick={logout}
          // Usamos un ícono de "logout" en el futuro, por ahora texto.
          className="p-2 rounded-full hover:bg-ser"
        >
          {/* Aquí iría un SVG de icono de logout */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default MobileHeader;
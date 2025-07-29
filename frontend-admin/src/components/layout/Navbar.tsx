// frontend-admin/src/components/layout/Navbar.tsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-md">
      <div className="flex items-center justify-end h-16 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center">
          <div className="relative ml-3">
            <div>
              <button
                type="button"
                className="flex items-center max-w-xs text-sm bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ser"
                id="user-menu-button"
                aria-expanded="false"
                aria-haspopup="true"
              >
                <span className="mr-3 text-gray-700">{user?.sub}</span>
                {/* A futuro, aquí podría ir un avatar */}
                <div className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-darkser">
                  {user?.sub?.charAt(0).toUpperCase()}
                </div>
              </button>
            </div>
            {/* Aquí iría la lógica para un menú desplegable (dropdown) con el botón de logout */}
            {/* Por ahora, ponemos el botón de logout directamente */}
          </div>
          <button 
            onClick={logout} 
            className="px-3 py-1 ml-4 text-sm font-medium text-white rounded-md bg-ser hover:bg-darkser"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
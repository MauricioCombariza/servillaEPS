// frontend-admin/src/pages/LoginPage.tsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';

const LoginPage: React.FC = () => {
  // Usamos nuestro hook de autenticación para obtener la función de login y el estado
  const { login, isLoggingIn, loginError } = useAuth();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Creamos un objeto FormData a partir de los datos del formulario.
    // Esto es lo que nuestra API espera recibir.
    const formData = new FormData(event.currentTarget);
    
    // Llamamos a la mutación de login
    login(formData);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Iniciar Sesión
        </h2>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Campo de Email (username para la API) */}
          <div>
            <label htmlFor="username" className="sr-only">Email</label>
            <input
              id="username"
              name="username" // El nombre debe ser 'username' para OAuth2PasswordRequestForm
              type="email"
              autoComplete="email"
              required
              className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email"
            />
          </div>
          
          {/* Campo de Contraseña */}
          <div>
            <label htmlFor="password" className="sr-only">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Contraseña"
            />
          </div>

          {/* Botón de envío */}
          <div>
            <button
              type="submit"
              disabled={isLoggingIn} // Deshabilitamos el botón mientras se procesa el login
              className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md group hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
            >
              {isLoggingIn ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>

          {/* Manejo de errores */}
          {loginError && (
            <div className="p-3 mt-4 text-sm text-red-700 bg-red-100 rounded-md">
              <p>Error: Email o contraseña incorrectos. Por favor, intente de nuevo.</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
// frontend-admin/src/routes/index.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Importamos los componentes necesarios
import ProtectedRoute from './ProtectedRoute';
import Layout from '../components/layout/Layout';
import PickingPage from '../pages/Logistica/PickingPage';
import AsignacionPage from '../pages/Logistica/AsignacionPage';
import RutasActivasPage from '../pages/Logistica/RutasActivasPage';
import NuevoPedidoPage from '../pages/NuevoPedidoPage';

// Importamos todas nuestras páginas
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import PedidosListPage from '../pages/Pedidos/PedidosListPage';
import RecepcionPage from '../pages/Logistica/RecepcionPage';
import AlistamientoPage from '../pages/Logistica/AlistamientoPage';
import EmpaquePage from '../pages/Logistica/EmpaquePage';
import ConciliacionPage from '../pages/Cierre/ConciliacionPage';

// Creamos el enrutador con la estructura jerárquica
const router = createBrowserRouter([
  // Ruta pública para el Login
  {
    path: '/nuevo-pedido', // Ruta pública
    element: <NuevoPedidoPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  // Contenedor de rutas protegidas
  {
    path: '/',
    element: <ProtectedRoute />, // 1. Primero verifica si el usuario está autenticado
    children: [
      {
        element: <Layout />, // 2. Si está autenticado, renderiza el Layout principal
        // Todas las rutas aquí adentro se renderizarán dentro del <Outlet /> del Layout
        children: [
          {
            index: true, // La ruta por defecto cuando se va a '/'
            element: <DashboardPage />,
          },
          {
            path: 'pedidos', // La ruta es relativa al padre, se accede con '/pedidos'
            element: <PedidosListPage />,
          },
          {
            path: 'logistica/recepcion', // La nueva ruta, se accede con '/logistica/recepcion'
            element: <RecepcionPage />,
          },
          {
          path: 'logistica/picking', // <-- Nueva ruta
          element: <PickingPage />,
        },
        {
          path: 'logistica/alistamiento', // <-- Nueva ruta
          element: <AlistamientoPage />,
        },
        {
          path: 'logistica/empaque', // <-- Nueva ruta
          element: <EmpaquePage />,
        },
        {
          path: 'logistica/asignacion', // <-- Nueva ruta
          element: <AsignacionPage />,
        },
        {
          path: 'logistica/rutas_activas', // <-- Nueva ruta
          element: <RutasActivasPage />,
        },
        {
          path: 'cierre/conciliacion', // <-- Nueva ruta
          element: <ConciliacionPage />,
        },
          
        ],
      },
    ],
  },
  // Podríamos añadir una ruta para páginas no encontradas (404)
  // { path: '*', element: <NotFoundPage /> }
]);

// Componente que exportamos para usar en main.tsx
export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
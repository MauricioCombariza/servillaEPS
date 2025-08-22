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
import MobileLayout from '../components/layout/MobileLayout';
import PaginaRutaMensajero from '../pages/Mensajero/PaginaRutaMensajero';
import PaginaEscaner from '../pages/Mensajero/PaginaEscaner';
import PaginaDetalleParada from '../pages/Mensajero/PaginaDetalleParada';
import DetalleRutaPage from '../pages/Logistica/DetalleRutaPage';

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
  {
          path: 'app-mensajero',
          element: <MobileLayout />, // Usará el nuevo layout
          children: [
            { index: true, element: <PaginaRutaMensajero /> },
            { path: 'escanear', element: <PaginaEscaner /> },
            {
            path: 'parada/:paqueteId', // <-- Nueva ruta con parámetro dinámico
            element: <PaginaDetalleParada />,
          },
          ]
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
        {
          path: 'logistica/rutas_activas/:rutaId', // Ruta con parámetro
          element: <DetalleRutaPage />,
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
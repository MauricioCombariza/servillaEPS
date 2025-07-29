// .../src/hooks/useAuth.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom'; // Para la web
// import { useNavigation } from '@react-navigation/native'; // Para móvil, si la redirección es más compleja
import { jwtDecode } from 'jwt-decode';
import { AxiosError } from 'axios';

// Importa las funciones y el almacenamiento correcto para cada plataforma
import { login as loginApi, logout as logoutApi } from '../api/auth';
// import AsyncStorage from '@react-native-async-storage/async-storage'; // Para móvil
// const storage = AsyncStorage; // Para móvil
const storage = localStorage; // Para web

// Definimos el tipo del payload del JWT
interface JwtPayload {
  sub: string;
  rol: 'admin' | 'operador' | null;
  exp: number;
}

// =================================================================
// ==     INTERFAZ PARA EL VALOR DE RETORNO DEL HOOK (LA CLAVE)   ==
// =================================================================
interface AuthHookResult {
  // Estado
  user: JwtPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Helpers de Roles
  userRole: 'admin' | 'operador' | null;
  isAdmin: boolean;
  isOperator: boolean;

  // Acciones (Mutación)
  login: (formData: FormData) => void;
  isLoggingIn: boolean;
  loginError: AxiosError<{ detail: string }> | null;
  
  // Acción de Logout
  logout: () => void;
}

// =================================================================

const getUserPayloadFromToken = async (): Promise<JwtPayload | null> => {
  const token = await storage.getItem('accessToken');
  if (!token) return null;

  try {
    const decodedToken: JwtPayload = jwtDecode(token);
    if (Date.now() >= decodedToken.exp * 1000) {
      await storage.removeItem('accessToken');
      return null;
    }
    return decodedToken;
  } catch (error) {
    await storage.removeItem('accessToken');
    return null;
  }
};

// AHORA TIPAMOS LA FUNCIÓN DEL HOOK
export const useAuth = (): AuthHookResult => {
  const queryClient = useQueryClient();
  const navigate = useNavigate(); // O el hook de navegación de React Native

  const { data: userPayload, isLoading } = useQuery({
    queryKey: ['authUser'],
    queryFn: getUserPayloadFromToken,
  });

  const loginMutation = useMutation<unknown, AxiosError<{ detail: string }>, FormData>({
    mutationFn: loginApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
      navigate('/');
    },
  });

  const logout = () => {
    logoutApi(); // Esta función ya usa el storage correcto
    queryClient.invalidateQueries({ queryKey: ['authUser'] });
    navigate('/login');
  };

  const userRole = userPayload?.rol ?? null;

  // El objeto que devolvemos ahora cumple con la interfaz AuthHookResult
  return {
    user: userPayload || null,
    isAuthenticated: !!userPayload,
    isLoading,
    
    userRole,
    isAdmin: userRole === 'admin',
    isOperator: userRole === 'operador',
    
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    
    logout,
  };
};
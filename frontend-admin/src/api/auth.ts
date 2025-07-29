import apiClient from './apiClient';

interface TokenResponse {
  access_token: string;
  token_type: string;
}

// La función para hacer login.
export const login = async (formData: FormData): Promise<TokenResponse> => {
  try {
    // Hacemos la petición POST, pero esta vez pasamos un objeto de configuración
    // para especificar la cabecera correcta.
    const response = await apiClient.post<TokenResponse>('/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (response.data.access_token) {
      localStorage.setItem('accessToken', response.data.access_token);
    }
    
    return response.data;
  } catch (error) {
    console.error("Error en el login:", error);
    throw error;
  }
};

// La función para hacer logout.
export const logout = () => {
  localStorage.removeItem('accessToken');
};
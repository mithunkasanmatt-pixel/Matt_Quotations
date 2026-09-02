const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  user?: any;
  token?: string;
}

export async function apiFetch<T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;

  // Get token from localStorage if in client environment
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('auth_token');
  }

  // Build headers
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const mergedOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'omit', // Standard bearer auth used instead of cookies for cross-origin local dev
  };

  try {
    const response = await fetch(url, mergedOptions);
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/pdf')) {
      const blob = await response.blob();
      return {
        success: true,
        data: blob as any
      };
    }

    let data: any = {};
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (err) {
        console.error('Failed to parse JSON response:', err);
        data = { message: 'Invalid JSON response from server' };
      }
    } else {
      const text = await response.text();
      data = { message: text || `HTTP error! Status: ${response.status}` };
    }

    if (!response.ok) {
      return {
        success: false,
        message: data.message || `HTTP error! Status: ${response.status}`
      };
    }

    return {
      success: true,
      message: data.message,
      data: data.data,
      user: data.user,
      token: data.token
    };
  } catch (error: any) {
    console.error("API Fetch Error:", error);
    return {
      success: false,
      message: error.message || 'Unable to connect to the server. Please check if the backend is running.'
    };
  }
}

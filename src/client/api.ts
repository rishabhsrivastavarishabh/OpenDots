export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

export function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint: string, method: string = 'GET', body?: any) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`/api${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type');
  let data: any;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json().catch(() => ({}));
  } else {
    const text = await response.text().catch(() => '');
    data = { error: text || `Server returned status ${response.status}` };
  }

  if (response.status === 401) {
    localStorage.removeItem('token');
    
    // Prevent continuous infinite reload loops if already on login view/root
    if (window.location.pathname !== '/' && !window.location.search.includes('unauthorized')) {
      window.location.href = '/?unauthorized=true';
    }
    return data;
  }

  if (!response.ok) {
    throw new ApiError(data.error || `Request failed (${response.status})`, response.status);
  }

  return data;
}

export async function api(endpoint: string, method: string = 'GET', body?: any) {
  return request(endpoint, method, body);
}

api.get = (endpoint: string) => request(endpoint, 'GET');
api.post = (endpoint: string, body?: any) => request(endpoint, 'POST', body);
api.put = (endpoint: string, body?: any) => request(endpoint, 'PUT', body);
api.delete = (endpoint: string) => request(endpoint, 'DELETE');

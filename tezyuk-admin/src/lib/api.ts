import type {
  LoginResponse,
  Order,
  OrderStatus,
  PaginatedResponse,
  Region,
  Stats,
  User,
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:9001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}

export const authApi = {
  login: (username: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
};

export const statsApi = {
  get: () => request<Stats>('/admin/stats'),
};

export const ordersApi = {
  list: (params: {
    status?: OrderStatus;
    region?: string;
    page?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params.status) q.set('status', params.status);
    if (params.region) q.set('region', params.region);
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    return request<PaginatedResponse<Order>>(`/admin/orders?${q.toString()}`);
  },
  getById: (id: string) => request<Order>(`/admin/orders/${id}`),
  updateStatus: (id: string, status: OrderStatus) =>
    request<Order>(`/admin/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  cancel: (id: string) =>
    request<Order>(`/admin/orders/${id}`, { method: 'DELETE' }),
};

export const usersApi = {
  list: (page: number, limit: number) =>
    request<PaginatedResponse<User>>(
      `/admin/users?page=${page}&limit=${limit}`,
    ),
  toggleBlock: (id: string) =>
    request<User>(`/admin/users/${id}/block`, { method: 'PATCH' }),
};

export const regionsApi = {
  list: () => request<Region[]>('/admin/regions'),
  create: (data: {
    key: string;
    nameUz: string;
    topicId: number;
    isActive: boolean;
  }) =>
    request<Region>('/admin/regions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (
    id: number,
    data: { nameUz?: string; topicId?: number; isActive?: boolean },
  ) =>
    request<Region>(`/admin/regions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

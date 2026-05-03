export type OrderStatus = 'pending' | 'active' | 'cancelled' | 'completed' | 'expired';
export type AdminRole = 'superadmin' | 'moderator';
export type Language = 'uz' | 'ru';

export interface User {
  id: string;
  telegramId: string;
  phone: string;
  fullName: string;
  language: Language;
  isBlocked: boolean;
  dailyOrderLimit: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: number;
  dailyOrderLimit: number;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  fromRegion: string;
  fromDistrict: string;
  toRegion: string;
  toDistrict: string;
  cargoName: string;
  weight: string;
  truckType: string;
  price: string;
  status: OrderStatus;
  telegramMessageId: number | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Region {
  id: number;
  key: string;
  nameUz: string;
  topicId: number;
  isActive: boolean;
}

export interface Stats {
  totalOrders: number;
  pendingOrders: number;
  activeOrders: number;
  completedOrders: number;
  expiredOrders: number;
  totalUsers: number;
  ordersToday: number;
  ordersByRegion: { region: string; count: number }[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export interface AdminInfo {
  sub: string;
  username: string;
  role: AdminRole;
}

export interface LoginResponse {
  accessToken: string;
  admin: AdminInfo;
}

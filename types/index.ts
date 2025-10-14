export type UserRole = 'customer' | 'provider' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  photoURL?: string;
  role: UserRole;
  location?: UserLocation;
}

export interface UserLocation {
  city: string;
  lat: number;
  lng: number;
  address?: string;
}

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  price: number;
  duration: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
}

export type ServiceCategory =
  | 'cleaning'
  | 'repairs'
  | 'beauty'
  | 'appliance'
  | 'painting'
  | 'pest-control';

export interface Professional {
  id: string;
  name: string;
  photoUrl: string;
  bio: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  services: string[];
  distance?: number;
}

export interface Booking {
  id: string;
  userId: string;
  professionalId: string;
  serviceId: string;
  status: BookingStatus;
  date: string;
  time: string;
  address: string;
  totalPrice: number;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled';

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  isRead: boolean;
}

export interface Theme {
  isDark: boolean;
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    error: string;
    warning: string;
  };
}


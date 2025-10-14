export type UserRole = 'customer' | 'provider' | 'admin';

export interface User {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  phone: string;
  photoURL?: string;
  role: UserRole;
  location?: UserLocation;
  
  // Provider-specific fields (only for role='provider')
  bio?: string;
  experience?: number; // years of experience
  rating?: number;
  reviewCount?: number;
  completedJobs?: number;
  isAvailable?: boolean;
}

export interface UserLocation {
  city: string;
  lat: number;
  lng: number;
  address?: string;
}

// ========== SERVICE TYPES ==========

export type ServiceCategory =
  | 'cleaning'
  | 'repairs'
  | 'beauty'
  | 'appliance'
  | 'painting'
  | 'pest-control'
  | 'plumbing'
  | 'electrical'
  | 'carpentry';

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  basePrice: number;
  duration: number; // in minutes
  imageUrl?: string;
  isActive: boolean;
  whatsIncluded: string[]; // What's included in the service
  createdAt: any;
  updatedAt: any;
  // Note: Services don't have ratings - only providers (professionals) have ratings
  // Following Urban Company's model
}

export interface CreateServiceInput {
  name: string;
  category: ServiceCategory;
  description: string;
  basePrice: number;
  duration: number;
  imageUrl?: string;
  whatsIncluded?: string[];
  isActive?: boolean;
}

export interface UpdateServiceInput {
  name?: string;
  category?: ServiceCategory;
  description?: string;
  basePrice?: number;
  duration?: number;
  imageUrl?: string;
  whatsIncluded?: string[];
  isActive?: boolean;
}

// Provider-specific service data
export interface ProviderService {
  id: string;
  providerId: string;
  serviceId: string;
  customPrice?: number; // Override base price
  isAvailable: boolean;
  experience: number; // years of experience
  description?: string; // provider's specific description
  images?: string[]; // provider's service images
  createdAt: any;
  updatedAt: any;
}

// Provider service offering (what provider offers)
export interface ProviderServiceOffering {
  id: string;
  providerId: string;
  serviceId: string;
  customPrice: number;
  isAvailable: boolean;
  experience: number;
  description: string;
  images: string[];
  rating?: number;
  reviewCount?: number;
  completedJobs?: number;
  createdAt: any;
  updatedAt: any;
}

export interface CategoryInfo {
  id: ServiceCategory;
  name: string;
  icon: string;
  color: string;
  description: string;
}

// Reviews are for PROVIDERS (professionals), not services
// Following Urban Company's model where customers review professionals after booking completion
export interface ProviderReview {
  id: string;
  bookingId: string; // Reference to the completed booking
  providerId: string; // The professional being reviewed
  customerId: string;
  customerName: string;
  customerPhoto?: string;
  serviceId: string; // Which service was provided (for context)
  rating: number; // 1-5 stars
  comment: string;
  images?: string[]; // review photos
  createdAt: any;
  updatedAt: any;
}

// Keep ServiceReview as alias for backward compatibility
export type ServiceReview = ProviderReview;

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


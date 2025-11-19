// Export maps types
export * from './maps';
export * from './savedAddress';

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
  
  // Additional fields for all users
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  deviceTokens?: string[]; // Array of FCM tokens for push notifications
  createdAt?: any;
  updatedAt?: any;
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
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerPhoto?: string;
  providerId: string;
  providerName: string;
  providerPhone: string;
  providerPhoto?: string;
  serviceId: string;
  serviceName: string;
  serviceCategory: ServiceCategory;
  status: BookingStatus;
  scheduledDate: string; // ISO date string
  scheduledTime: string; // e.g., "10:00 AM"
  scheduledSlot: TimeSlot; // For better time management
  address: BookingAddress;
  price: number;
  notes?: string; // Customer's special instructions
  images?: string[]; // Before/after service images
  cancellationReason?: string;
  completedAt?: any;
  createdAt: any;
  updatedAt: any;
}

export interface BookingAddress {
  street: string;
  apartment?: string; // apartment/flat number
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  lat?: number;
  lng?: number;
}

export type BookingStatus =
  | 'pending' // Waiting for provider acceptance
  | 'accepted' // Provider accepted
  | 'confirmed' // Confirmed and scheduled
  | 'on-the-way' // Provider is on the way
  | 'in-progress' // Service in progress
  | 'completed' // Service completed
  | 'cancelled' // Cancelled by customer or provider
  | 'rejected'; // Rejected by provider

export type TimeSlot = 
  | '08:00 AM - 09:00 AM'
  | '09:00 AM - 10:00 AM'
  | '10:00 AM - 11:00 AM'
  | '11:00 AM - 12:00 PM'
  | '12:00 PM - 01:00 PM'
  | '01:00 PM - 02:00 PM'
  | '02:00 PM - 03:00 PM'
  | '03:00 PM - 04:00 PM'
  | '04:00 PM - 05:00 PM'
  | '05:00 PM - 06:00 PM'
  | '06:00 PM - 07:00 PM'
  | '07:00 PM - 08:00 PM';

export interface CreateBookingInput {
  customerId: string;
  providerId: string;
  serviceId: string;
  scheduledDate: string;
  scheduledTime: string;
  scheduledSlot: TimeSlot;
  address: BookingAddress;
  notes?: string;
}

export interface UpdateBookingInput {
  status?: BookingStatus;
  scheduledDate?: string;
  scheduledTime?: string;
  scheduledSlot?: TimeSlot;
  address?: BookingAddress;
  notes?: string;
  cancellationReason?: string;
  images?: string[];
}

export interface UpdateUserInput {
  name?: string;
  displayName?: string;
  phone?: string;
  photoURL?: string;
  bio?: string;
  experience?: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isAvailable?: boolean;
}

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

// ========== AVAILABILITY TYPES ==========

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DaySchedule {
  isAvailable: boolean;
  slots: TimeSlot[];
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface ProviderAvailability {
  id: string; // providerId
  providerId: string;
  weeklySchedule: WeeklySchedule;
  customDaysOff: string[]; // ISO date strings for specific days off
  bookingBuffer: number; // Minutes buffer between bookings (default: 30)
  advanceBookingDays: number; // How many days ahead customers can book (default: 30)
  isAcceptingBookings: boolean; // Global toggle for accepting bookings
  createdAt: any;
  updatedAt: any;
}

export interface AvailabilityCheckResult {
  isAvailable: boolean;
  availableSlots: TimeSlot[];
  reason?: string; // Why unavailable (e.g., "Provider is off on this day", "Slot already booked")
}

export interface UpdateAvailabilityInput {
  weeklySchedule?: WeeklySchedule;
  customDaysOff?: string[];
  bookingBuffer?: number;
  advanceBookingDays?: number;
  isAcceptingBookings?: boolean;
}


/**
 * Map-related types for the ServiceSquad app
 */

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Address {
  street: string;
  apartment?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface PlaceAutocomplete {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  polyline: string;
}

export interface ProviderLocation {
  providerId: string;
  location: Location;
  timestamp: number;
  heading?: number; // direction in degrees
  speed?: number; // in m/s
  accuracy?: number; // in meters
}

export interface TrackingSession {
  bookingId: string;
  customerId: string;
  providerId: string;
  status: 'en_route' | 'nearby' | 'arrived' | 'in_service' | 'completed';
  startedAt: number;
  estimatedArrival?: number;
  actualArrival?: number;
  route?: RouteInfo;
}

export interface GeofenceEvent {
  type: 'enter' | 'exit';
  location: Location;
  timestamp: number;
  radius: number;
}

export interface MapMarker {
  id: string;
  location: Location;
  title?: string;
  description?: string;
  type: 'customer' | 'provider' | 'service' | 'booking';
  icon?: string;
}


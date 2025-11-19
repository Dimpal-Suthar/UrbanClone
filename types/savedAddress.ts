export interface SavedAddress {
  id: string;
  userId: string;
  label: string; // e.g., "Home", "Office", "Other"
  street: string;
  apartment?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
  createdAt: any;
  updatedAt: any;
}


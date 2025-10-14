import { useAuth } from './useAuth';

export type UserRole = 'customer' | 'provider' | 'admin';

export const useRole = () => {
  const { userProfile } = useAuth();
  
  const role = userProfile?.role || 'customer';
  
  return {
    role,
    isCustomer: role === 'customer',
    isProvider: role === 'provider',
    isAdmin: role === 'admin',
    canAccessProviderApp: role === 'provider' || role === 'admin',
    canAccessAdminPanel: role === 'admin',
  };
};


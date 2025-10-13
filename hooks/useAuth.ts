import { useStores } from '@/stores';
import { observer } from 'mobx-react-lite';

/**
 * Custom hook for authentication
 * Uses MobX store for state management
 */
export const useAuth = () => {
  const { authStore } = useStores();

  return {
    // State
    user: authStore.user,
    userProfile: authStore.userProfile,
    loading: authStore.loading,
    error: authStore.error,
    isAuthenticated: authStore.isAuthenticated,
    hasSeenOnboarding: authStore.hasSeenOnboarding,
    phoneNumber: authStore.phoneNumber,
    
    // Email Auth Actions
    signUpWithEmail: authStore.signUpWithEmail.bind(authStore),
    signInWithEmail: authStore.signInWithEmail.bind(authStore),
    resetPassword: authStore.resetPassword.bind(authStore),
    
    // Phone Auth Actions
    sendOTP: authStore.sendOTP.bind(authStore),
    verifyOTP: authStore.verifyOTP.bind(authStore),
    
    // Common Actions
    updateProfile: authStore.updateProfile.bind(authStore),
    signOut: authStore.signOut.bind(authStore),
    markOnboardingSeen: authStore.markOnboardingSeen.bind(authStore),
    isProfileComplete: authStore.isProfileComplete.bind(authStore),
    clearError: authStore.clearError.bind(authStore),
  };
};

/**
 * HOC to make component observe MobX changes
 */
export const withAuth = observer;


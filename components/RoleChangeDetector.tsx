import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

/**
 * Component that detects role changes and redirects the user to the appropriate app
 * Only triggers on meaningful role upgrades (customer → provider, customer → admin)
 */
export function RoleChangeDetector() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const previousRoleRef = useRef<string | undefined>(undefined);
  const hasShownAlertRef = useRef(false);

  useEffect(() => {
    if (!userProfile?.role) {
      // Reset when no user
      previousRoleRef.current = undefined;
      hasShownAlertRef.current = false;
      return;
    }

    const currentRole = userProfile.role;
    const previousRole = previousRoleRef.current;

    console.log('👤 Role detector:', { previousRole, currentRole, hasShownAlert: hasShownAlertRef.current });

    // On first load, just store the role and don't trigger any redirect
    if (!previousRole) {
      console.log('🎯 Initial role detected (first load):', currentRole);
      previousRoleRef.current = currentRole;
      return;
    }

    // Skip if role hasn't changed or we already showed an alert for this change
    if (previousRole === currentRole) {
      return;
    }

    console.log('🔄 Role changed from', previousRole, 'to', currentRole);

    // Only handle meaningful role upgrades (customer → provider)
    // Don't show alerts for admin login or other scenarios
    
    if (previousRole === 'customer' && currentRole === 'provider' && !hasShownAlertRef.current) {
      // Provider approved!
      hasShownAlertRef.current = true;
      console.log('🎉 Showing provider approval alert');
      
      Alert.alert(
        'Provider Approved! 🎉',
        'Congratulations! Your provider application has been approved. You can now access provider features and start accepting bookings.',
        [
          {
            text: 'Access Provider Dashboard',
            onPress: () => {
              console.log('🚀 Redirecting to provider dashboard');
              router.replace('/(provider)/(tabs)/dashboard' as any);
            },
          },
        ],
        { cancelable: false }
      );
    }
    
    // Update the role reference
    previousRoleRef.current = currentRole;
  }, [userProfile?.role]);

  return null;
}


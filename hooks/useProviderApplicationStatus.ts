import { db } from '@/config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './useAuth';

/**
 * Hook to monitor provider application status changes
 * Shows alerts when application is rejected or approved
 */
export function useProviderApplicationStatus() {
  const { user, userProfile } = useAuth();
  const previousStatusRef = useRef<string | undefined>(undefined);
  const hasShownRejectionRef = useRef(false);

  useEffect(() => {
    // Reset when user changes
    previousStatusRef.current = undefined;
    hasShownRejectionRef.current = false;

    if (!user?.uid) {
      console.log('👤 No user, skipping provider status monitor');
      return;
    }

    // Only monitor if user is a customer (providers who applied but not yet approved)
    if (userProfile?.role !== 'customer') {
      console.log('👤 User role is not customer, skipping provider status monitor. Role:', userProfile?.role);
      return;
    }

    console.log('👂 Setting up provider application status listener for:', user.uid);

    const unsubscribe = onSnapshot(
      doc(db, 'providers', user.uid),
      (snapshot) => {
        if (!snapshot.exists()) {
          console.log('📄 No provider document found');
          return;
        }

        const providerData = snapshot.data();
        const currentStatus = providerData?.approvalStatus;
        const previousStatus = previousStatusRef.current;

        console.log('📊 Provider status update:', {
          currentStatus,
          previousStatus,
          hasShownRejection: hasShownRejectionRef.current,
        });

        // Store current status
        previousStatusRef.current = currentStatus;

        // Check if status is rejected and we haven't shown the alert yet
        if (currentStatus === 'rejected' && !hasShownRejectionRef.current) {
          // Only show if this is a new rejection (status changed from something else to rejected)
          // OR if user is just seeing this for the first time (previousStatus is undefined but they have a rejection)
          const isNewRejection = previousStatus && previousStatus !== 'rejected';
          const isExistingRejection = !previousStatus; // First time seeing this document
          
          if (isNewRejection || isExistingRejection) {
            hasShownRejectionRef.current = true;
            console.log('❌ Provider application rejected - showing alert');
            
            // Small delay to ensure UI is ready
            setTimeout(() => {
              Alert.alert(
                'Application Update',
                'Unfortunately, your provider application was not approved at this time.\n\nYou can:\n• Review and improve your application details\n• Reapply with updated information\n• Contact support for guidance\n\nYou can continue using the app as a customer.',
                [
                  {
                    text: 'OK',
                    style: 'default',
                  },
                  {
                    text: 'Edit Application',
                    onPress: () => {
                      console.log('User wants to edit application');
                    },
                  },
                ]
              );
            }, 500);
          }
        }
      },
      (error) => {
        console.error('❌ Error monitoring provider application:', error);
      }
    );

    return () => {
      console.log('🧹 Cleaning up provider status listener');
      unsubscribe();
    };
  }, [user?.uid, userProfile?.role]);
}


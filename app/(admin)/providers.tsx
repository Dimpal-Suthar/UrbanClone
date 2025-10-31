import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { db } from '@/config/firebase';
import { useTheme } from '@/contexts/ThemeContext';
import { showFailedMessage, showSuccessMessage } from '@/utils/toast';
import { notifyServiceApproved, notifyServiceRejected } from '@/utils/pushNotifications';
import { Ionicons } from '@expo/vector-icons';
import { collection, doc, getDoc, query, serverTimestamp, updateDoc, where, onSnapshot } from 'firebase/firestore';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

interface ProviderApplication {
  userId: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  services: string[];
  experience?: number | null;
  bio?: string;
  createdAt?: any;
}

const AdminProvidersScreen = observer(() => {
  const { colors } = useTheme();
  const [processingAction, setProcessingAction] = useState<{ userId: string; action: 'approve' | 'reject' } | null>(null);

  // Fetch pending provider applications
  const [applications, setApplications] = useState<ProviderApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const providersQuery = query(
      collection(db, 'providers'),
      where('approvalStatus', '==', 'pending')
    );

    const unsubscribe = onSnapshot(providersQuery, async (snapshot) => {
      setIsLoading(true);

      const apps = await Promise.all(
        snapshot.docs.map(async (providerDoc) => {
          const providerData = providerDoc.data();
          const userSnap = await getDoc(doc(db, 'users', providerDoc.id));
          const userData = userSnap.exists() ? userSnap.data() : {};

          return {
            userId: providerDoc.id,
            displayName: userData?.displayName,
            email: userData?.email,
            phoneNumber: userData?.phoneNumber,
            services: providerData.services || [],
            experience: typeof providerData.experience === 'number' ? providerData.experience : null,
            bio: providerData.bio || '',
            approvalStatus: providerData.approvalStatus || 'pending',
            createdAt: providerData.createdAt,
          } as ProviderApplication;
        })
      );

      setApplications(apps);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (userId: string) => {
    // Keep Alert for critical approval confirmation
    Alert.alert(
      'Approve Provider',
      'Are you sure you want to approve this provider?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              setProcessingAction({ userId, action: 'approve' });
              
              // Get user data for notification
              const userDoc = await getDoc(doc(db, 'users', userId));
              const userData = userDoc.exists() ? userDoc.data() : {};
              const providerName = userData.displayName || userData.name || 'Provider';
              
              // Update provider status
              await updateDoc(doc(db, 'providers', userId), {
                approvalStatus: 'approved',
                approvedAt: serverTimestamp(),
              });
              
              // Change user role
              await updateDoc(doc(db, 'users', userId), {
                role: 'provider',
                updatedAt: serverTimestamp(),
              });
              
              // Send push notification to provider
              // Using a generic service ID since this is provider application approval, not a specific service
              await notifyServiceApproved(userId, 'provider-application', providerName);
              
              showSuccessMessage('Provider Approved', 'They will see Provider App on next login');
            } catch (error: any) {
              console.error('Approval error:', error);
              showFailedMessage(
                'Approval Failed',
                'Please check Firestore rules for admin permissions'
              );
            } finally {
              setProcessingAction(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (userId: string) => {
    // Keep Alert for critical rejection confirmation
    Alert.alert(
      'Reject Provider',
      'Are you sure you want to reject this application?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingAction({ userId, action: 'reject' });
              
              // Get user data for notification
              const userDoc = await getDoc(doc(db, 'users', userId));
              const userData = userDoc.exists() ? userDoc.data() : {};
              const providerName = userData.displayName || userData.name || 'Provider';
              
              await updateDoc(doc(db, 'providers', userId), {
                approvalStatus: 'rejected',
                rejectedAt: serverTimestamp(),
              });
              
              // Send push notification to provider
              // Using a generic service ID since this is provider application rejection, not a specific service
              await notifyServiceRejected(userId, 'provider-application', providerName);
              
              showSuccessMessage('Application Rejected', 'Provider application has been rejected');
            } catch (error: any) {
              console.error('Rejection error:', error);
              showFailedMessage(
                'Rejection Failed',
                'Please check Firestore rules for admin permissions'
              );
            } finally {
              setProcessingAction(null);
            }
          },
        },
      ]
    );
  };

  return (
    <Container>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-4 pb-6">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Provider Applications
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            {applications.length} pending approval
          </Text>
        </View>

        <View className="px-6">
          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="mt-4" style={{ color: colors.textSecondary }}>
                Loading applications...
              </Text>
            </View>
          ) : applications.length === 0 ? (
            <Card variant="default" className="items-center py-8">
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.textSecondary} />
              <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>
                No pending applications
              </Text>
            </Card>
          ) : (
            applications.map((app) => (
              <Card key={app.userId} variant="elevated" className="mb-4">
                <View className="flex-row items-start mb-4">
                  <Avatar uri={null} name={app.displayName || 'User'} size={60} />
                  <View className="flex-1 ml-4">
                    <Text className="text-lg font-bold mb-1" style={{ color: colors.text }}>
                      {app.displayName || 'Unknown'}
                    </Text>
                    <Text className="text-sm mb-1" style={{ color: colors.textSecondary }}>
                      {app.email || app.phoneNumber}
                    </Text>
                    {typeof app.experience === 'number' && app.experience > 0 && (
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                        <Text className="text-xs ml-1" style={{ color: colors.textSecondary }}>
                          {app.experience} years experience
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {app.bio ? (
                  <Text className="text-sm mb-3" style={{ color: colors.text }}>
                    {app.bio}
                  </Text>
                ) : null}

                {app.services.length > 0 ? (
                  <View className="mb-3">
                    <Text className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
                      Services offered:
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {app.services.map((service, idx) => (
                        <View 
                          key={idx}
                          className="px-3 py-1 rounded-full"
                          style={{ backgroundColor: `${colors.primary}15` }}
                        >
                          <Text className="text-xs" style={{ color: colors.primary }}>
                            {service}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View className="mb-3 px-3 py-2 rounded-lg" style={{ backgroundColor: `${colors.warning}15` }}>
                    <Text className="text-xs" style={{ color: colors.warning }}>
                      ⚠️ Application incomplete - Provider needs to complete application form
                    </Text>
                  </View>
                )}

                <View className="flex-row gap-2 mt-2">
                  <Pressable
                    onPress={() => handleApprove(app.userId)}
                    disabled={processingAction?.userId === app.userId}
                    className="flex-1 py-3 rounded-lg items-center active:opacity-70"
                    style={{ 
                      backgroundColor: `${colors.success}20`,
                      opacity: processingAction?.userId === app.userId ? 0.5 : 1
                    }}
                  >
                    {processingAction?.userId === app.userId && processingAction.action === 'approve' ? (
                      <ActivityIndicator size="small" color={colors.success} />
                    ) : (
                      <Text className="font-semibold" style={{ color: colors.success }}>
                        Approve
                      </Text>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() => handleReject(app.userId)}
                    disabled={processingAction?.userId === app.userId}
                    className="flex-1 py-3 rounded-lg items-center active:opacity-70"
                    style={{ 
                      backgroundColor: `${colors.error}20`,
                      opacity: processingAction?.userId === app.userId ? 0.5 : 1
                    }}
                  >
                    {processingAction?.userId === app.userId && processingAction.action === 'reject' ? (
                      <ActivityIndicator size="small" color={colors.error} />
                    ) : (
                      <Text className="font-semibold" style={{ color: colors.error }}>
                        Reject
                      </Text>
                    )}
                  </Pressable>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </Container>
  );
});

export default AdminProvidersScreen;


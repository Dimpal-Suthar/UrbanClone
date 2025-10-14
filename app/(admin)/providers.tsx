import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { db } from '@/config/firebase';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

interface ProviderApplication {
  userId: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  services: string[];
  experience: number;
  bio: string;
  createdAt: any;
}

const AdminProvidersScreen = observer(() => {
  const { colors } = useTheme();
  const [processingAction, setProcessingAction] = useState<{ userId: string; action: 'approve' | 'reject' } | null>(null);

  // Fetch pending provider applications
  const { data: applications = [], refetch, isLoading } = useQuery({
    queryKey: ['pending-providers'],
    queryFn: async () => {
      const providersQuery = query(
        collection(db, 'providers'),
        where('approvalStatus', '==', 'pending')
      );
      
      const snapshot = await getDocs(providersQuery);
      const apps: ProviderApplication[] = [];
      
      for (const providerDoc of snapshot.docs) {
        const providerData = providerDoc.data();
        
        // Get user details
        const userDoc = await getDocs(
          query(collection(db, 'users'), where('uid', '==', providerDoc.id))
        );
        
        const userData = userDoc.docs[0]?.data();
        
        apps.push({
          userId: providerDoc.id,
          displayName: userData?.displayName,
          email: userData?.email,
          phoneNumber: userData?.phoneNumber,
          ...providerData,
        } as ProviderApplication);
      }
      
      return apps;
    },
  });

  const handleApprove = async (userId: string) => {
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
              
              Alert.alert('Success', 'Provider approved! They will see Provider App on next login.');
              refetch();
            } catch (error: any) {
              console.error('Approval error:', error);
              Alert.alert(
                'Permission Error',
                'Firestore security rules need to be updated.\n\nPlease update your Firestore rules to allow admins to edit users and providers collections.\n\nError: ' + error.message
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
              
              await updateDoc(doc(db, 'providers', userId), {
                approvalStatus: 'rejected',
                rejectedAt: serverTimestamp(),
              });
              
              Alert.alert('Success', 'Provider application rejected');
              refetch();
            } catch (error: any) {
              console.error('Rejection error:', error);
              Alert.alert(
                'Permission Error',
                'Firestore security rules need to be updated.\n\nError: ' + error.message
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
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                      <Text className="text-xs ml-1" style={{ color: colors.textSecondary }}>
                        {app.experience} years experience
                      </Text>
                    </View>
                  </View>
                </View>

                {app.bio && (
                  <Text className="text-sm mb-3" style={{ color: colors.text }}>
                    {app.bio}
                  </Text>
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


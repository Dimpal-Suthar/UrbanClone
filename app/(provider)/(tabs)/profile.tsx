import { ThemeSettings } from '@/components/ThemeSettings';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useProviderStats } from '@/hooks/useProviderStats';
import { showInfoMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

const MENU_ITEMS = [
  { id: '1', icon: 'person-outline', label: 'Edit Profile', screen: '/profile/edit' },
  { id: '2', icon: 'briefcase-outline', label: 'Provider Details', screen: '/provider/edit-details' },
  { id: '3', icon: 'star-outline', label: 'Reviews & Ratings', screen: 'reviews' },
  { id: '4', icon: 'document-text-outline', label: 'Terms of Service', screen: 'terms-of-service' },
  { id: '5', icon: 'shield-checkmark-outline', label: 'Privacy Policy', screen: 'privacy-policy' },
];

const ProviderProfileScreen = observer(() => {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, userProfile, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const { stats, isLoading } = useProviderStats();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoggingOut(true);
            await signOut();
            router.replace('/auth/email');
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const handleMenuPress = (screen: string) => {
    if (screen === '/profile/edit' || screen === '/provider/edit-details') {
      router.push(screen);
      return;
    }
    if (screen === 'reviews') {
      if (!user?.uid) {
        showInfoMessage('Profile unavailable', 'Please sign in again to view reviews.');
        return;
      }
      router.push(`/provider/reviews/${user.uid}`);
      return;
    }
    if (screen === 'terms-of-service') {
      router.push({ pathname: '/legal', params: { type: 'terms' } });
      return;
    }
    if (screen === 'privacy-policy') {
      router.push({ pathname: '/legal', params: { type: 'privacy' } });
      return;
    }
    showInfoMessage('Coming Soon', 'This section will be available soon.');
  };

  const displayName = userProfile?.displayName || user?.displayName || 'Provider';
  const email = userProfile?.email || user?.email || '';
  const phoneNumber = userProfile?.phoneNumber || user?.phoneNumber || '';
  const photoURL = userProfile?.photoURL || user?.photoURL;

  return (
    <Container safeArea edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Profile
          </Text>
        </View>

        {/* User Card */}
        <View className="px-6 mb-6">
          <Card variant="elevated">
            <View className="flex-row items-center">
              <Avatar uri={photoURL} name={displayName} size={80} />
              <View className="flex-1 ml-4">
                <View className="flex-row items-center mb-1">
                  <Text className="text-xl font-bold" style={{ color: colors.text }}>
                    {displayName}
                  </Text>
                  <View 
                    className="ml-2 px-2 py-0.5 rounded"
                    style={{ backgroundColor: `${colors.success}20` }}
                  >
                    <Text className="text-xs font-bold" style={{ color: colors.success }}>
                      PROVIDER
                    </Text>
                  </View>
                </View>
                <Text className="text-sm mb-1" style={{ color: colors.textSecondary }}>
                  {email || phoneNumber}
                </Text>
                {userProfile?.emailVerified && (
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text className="text-xs ml-1" style={{ color: colors.success }}>
                      Verified
                    </Text>
                  </View>
                )}
              </View>
              {/* <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} /> */}
            </View>
          </Card>
        </View>

        {/* Stats */}
        <View className="flex-row px-6 mb-6 gap-3">
          <Card variant="elevated" className="flex-1 items-center py-4">
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text className="text-2xl font-bold mb-1" style={{ color: colors.primary }}>
                {stats?.completedBookings || 0}
              </Text>
            )}
            <Text className="text-sm" style={{ color: colors.textSecondary }}>Jobs Done</Text>
          </Card>
          <Card variant="elevated" className="flex-1 items-center py-4">
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.warning} />
            ) : (
              <Text className="text-2xl font-bold mb-1" style={{ color: colors.warning }}>
                {stats?.averageRating?.toFixed(1) || '0.0'}
              </Text>
            )}
            <Text className="text-sm" style={{ color: colors.textSecondary }}>Rating</Text>
          </Card>
        </View>

        {/* Settings */}
        <View className="px-6 mb-4">
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>Settings</Text>
          <ThemeSettings />
        </View>

        {/* Menu Items */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>Account</Text>
          {MENU_ITEMS.map((item) => (
            <Pressable key={item.id} onPress={() => handleMenuPress(item.screen)} className="active:opacity-70">
              <Card variant="default" className="mb-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Ionicons name={item.icon as any} size={22} color={colors.text} />
                    <Text className="ml-3 text-base flex-1" style={{ color: colors.text }}>
                      {item.label}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
              </Card>
            </Pressable>
          ))}
        </View>

        {/* Logout Button */}
        <View className="px-6 mb-8">
          <Pressable
            onPress={handleLogout}
            disabled={loggingOut}
            className="rounded-xl py-4 items-center active:opacity-70"
            style={{ backgroundColor: `${colors.error}20`, opacity: loggingOut ? 0.5 : 1 }}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="log-out-outline" size={20} color={colors.error} />
                <Text className="ml-2 text-base font-semibold" style={{ color: colors.error }}>
                  Logout
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        <View className="h-6" />
      </ScrollView>
    </Container>
  );
});

export default ProviderProfileScreen;


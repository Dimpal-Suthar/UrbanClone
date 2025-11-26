import { ThemeSettings } from '@/components/ThemeSettings';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerBookings } from '@/hooks/useBookings';
import { useRole } from '@/hooks/useRole';
import { showInfoMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

const MENU_ITEMS = [
  { id: '1', icon: 'person-outline', label: 'Edit Profile', screen: '/profile/edit' },
  { id: '2', icon: 'location-outline', label: 'Saved Addresses', screen: 'addresses' },
  { id: '3', icon: 'help-circle-outline', label: 'Help & Support', screen: 'support' },
  { id: '4', icon: 'document-text-outline', label: 'Terms & Privacy', screen: 'terms' },
];

const ProfileScreen = observer(() => {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, userProfile, signOut } = useAuth();
  const { isProvider, isAdmin } = useRole();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Fetch real user data
  const { data: customerBookings = [], isLoading: loadingBookings } = useCustomerBookings(user?.uid || null);

  // Calculate stats
  const totalBookings = customerBookings.length;
  const completedBookings = customerBookings.filter(booking => booking.status === 'completed').length;
  const pendingBookings = customerBookings.filter(booking => ['pending', 'confirmed', 'in_progress'].includes(booking.status)).length;

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
    if (screen === '/profile/edit') {
      router.push(screen);
      return;
    }
    if (screen === 'addresses') {
      router.push('/addresses');
      return;
    }
    if (screen === 'edit-profile') {
      showInfoMessage('Coming Soon', 'Edit profile feature will be available soon');
      return;
    }
    // Add navigation logic for other menu items
    showInfoMessage('Coming Soon', 'This feature will be available soon');
  };

  const displayName = userProfile?.displayName || user?.displayName || 'User';
  const email = userProfile?.email || user?.email || '';
  const phoneNumber = userProfile?.phoneNumber || user?.phoneNumber || '';
  const photoURL = userProfile?.photoURL || user?.photoURL;

  return (
    <Container>
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
                <Text className="text-xl font-bold mb-1" style={{ color: colors.text }}>
                  {displayName}
                </Text>
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
            {loadingBookings ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text className="text-2xl font-bold mb-1" style={{ color: colors.primary }}>
                {totalBookings}
              </Text>
            )}
            <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>Total Bookings</Text>
          </Card>
          <Card variant="elevated" className="flex-1 items-center py-4">
            {loadingBookings ? (
              <ActivityIndicator size="small" color={colors.success} />
            ) : (
              <Text className="text-2xl font-bold mb-1" style={{ color: colors.success }}>
                {completedBookings}
              </Text>
            )}
            <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>Completed Bookings</Text>
          </Card>
          <Card variant="elevated" className="flex-1 items-center py-4">
            {loadingBookings ? (
              <ActivityIndicator size="small" color={colors.warning} />
            ) : (
              <Text className="text-2xl font-bold mb-1" style={{ color: colors.warning }}>
                {pendingBookings}
              </Text>
            )}
            <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>Pending Bookings</Text>
          </Card>
        </View>

        {/* Become Provider (Only for customers) */}
        {!isProvider && !isAdmin && (
          <View className="px-6 mb-6">
            <Pressable onPress={() => router.push('/provider/apply')} className="active:opacity-70">
              <Card variant="elevated">
                <View className="flex-row items-center">
                  <View 
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${colors.success}20` }}
                  >
                    <Ionicons name="briefcase" size={24} color={colors.success} />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
                      Become a Service Provider
                    </Text>
                    <Text className="text-sm" style={{ color: colors.textSecondary }}>
                      Start earning by offering your services
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
              </Card>
            </Pressable>
          </View>
        )}

        {/* Settings */}
        <View className="px-6 mb-4">
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>Settings</Text>

          <Card variant="default" className="mb-3">
            <View className="flex-row items-center justify-between py-1">
              <View className="flex-row items-center flex-1">
                <Ionicons name="notifications-outline" size={22} color={colors.text} />
                <Text className="ml-3 text-base" style={{ color: colors.text }}>
                  Push Notifications
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Card>

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

export default ProfileScreen;

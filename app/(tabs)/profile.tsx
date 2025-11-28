import { ThemeSettings } from '@/components/ThemeSettings';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerBookings } from '@/hooks/useBookings';
import { useRole } from '@/hooks/useRole';
import { removeAllDeviceTokens } from '@/services/fcmService';
import { getNotificationEnabled, setNotificationEnabled } from '@/services/notificationSettingsService';
import { requestPermissionWithAlert } from '@/utils/permissionUtils';
import { showInfoMessage, showSuccessMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
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
  const [loadingNotificationPref, setLoadingNotificationPref] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Load notification preference on mount
  useEffect(() => {
    const loadNotificationPreference = async () => {
      try {
        const enabled = await getNotificationEnabled();
        setNotificationsEnabled(enabled);
      } catch (error) {
        console.error('Error loading notification preference:', error);
      } finally {
        setLoadingNotificationPref(false);
      }
    };
    loadNotificationPreference();
  }, []);

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

  const handleNotificationToggle = async (enabled: boolean) => {
    // Prevent multiple rapid toggles
    if (loadingNotificationPref) return;
    
    try {
      // Update state immediately for instant UI feedback
      setNotificationsEnabled(enabled);
      
      // Save preference to storage
      await setNotificationEnabled(enabled);
      
      if (!enabled && user?.uid) {
        // When disabling, remove ALL tokens from Firestore for this user
        // This prevents notifications from being sent to any device
        try {
          await removeAllDeviceTokens(user.uid, true); // clearAllTokens = true
          showSuccessMessage('Notifications Disabled', 'You will no longer receive push notifications');
        } catch (error) {
          console.error('Error removing tokens:', error);
          // Still show success since preference is saved
          showSuccessMessage('Notifications Disabled', 'Preference saved');
        }
      } else if (enabled && user?.uid) {
        // When enabling, check if notification permission is granted
        const { requestNotificationPermissions } = await import('@/services/fcmService');
        
        const hasPermission = await requestPermissionWithAlert(
          'notifications',
          () => requestNotificationPermissions(),
          () => {
            showSuccessMessage('Notifications Enabled', 'You will receive push notifications');
          },
          'To receive push notifications, please grant notification permission when prompted.'
        );

        if (!hasPermission) {
          // Revert toggle since permission is not granted
          setNotificationsEnabled(false);
          await setNotificationEnabled(false);
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      // Revert state on error
      setNotificationsEnabled(!enabled);
      showInfoMessage('Error', 'Failed to update notification settings. Please try again.');
    }
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
                <Ionicons 
                  name={notificationsEnabled ? 'notifications' : 'notifications-off-outline'} 
                  size={22} 
                  color={colors.text} 
                />
                <View className="ml-3 flex-1">
                  <Text className="text-base" style={{ color: colors.text }}>
                  Push Notifications
                </Text>
                  {loadingNotificationPref ? (
                    <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                      Loading...
                    </Text>
                  ) : (
                    <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                      {notificationsEnabled ? 'Receiving notifications' : 'Notifications disabled'}
                    </Text>
                  )}
                </View>
              </View>
              {loadingNotificationPref ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
              <Switch
                value={notificationsEnabled}
                  onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
              )}
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

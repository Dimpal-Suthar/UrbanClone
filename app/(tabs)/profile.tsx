import { ThemeSettings } from '@/components/ThemeSettings';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

const MENU_ITEMS = [
  { id: '1', icon: 'person-outline', label: 'Edit Profile', screen: 'edit-profile' },
  { id: '2', icon: 'location-outline', label: 'Saved Addresses', screen: 'addresses' },
  { id: '3', icon: 'card-outline', label: 'Payment Methods', screen: 'payment-methods' },
  { id: '4', icon: 'gift-outline', label: 'Rewards & Offers', screen: 'rewards', badge: '250 pts' },
  { id: '5', icon: 'help-circle-outline', label: 'Help & Support', screen: 'support' },
  { id: '6', icon: 'document-text-outline', label: 'Terms & Privacy', screen: 'terms' },
];

const ProfileScreen = observer(() => {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, userProfile, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

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
            router.replace('/auth/select');
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
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
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </Card>
        </View>

        {/* Stats */}
        <View className="flex-row px-6 mb-6 gap-3">
          <Card variant="elevated" className="flex-1 items-center py-4">
            <Text className="text-2xl font-bold mb-1" style={{ color: colors.primary }}>0</Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>Bookings</Text>
          </Card>
          <Card variant="elevated" className="flex-1 items-center py-4">
            <Text className="text-2xl font-bold mb-1" style={{ color: colors.success }}>0</Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>Points</Text>
          </Card>
          <Card variant="elevated" className="flex-1 items-center py-4">
            <Text className="text-2xl font-bold mb-1" style={{ color: colors.warning }}>0</Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>Reviews</Text>
          </Card>
        </View>

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
            <Pressable key={item.id} className="active:opacity-70">
              <Card variant="default" className="mb-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Ionicons name={item.icon as any} size={22} color={colors.text} />
                    <Text className="ml-3 text-base flex-1" style={{ color: colors.text }}>
                      {item.label}
                    </Text>
                  </View>
                  {item.badge && (
                    <View className="px-3 py-1 rounded-full mr-2" style={{ backgroundColor: `${colors.primary}20` }}>
                      <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                        {item.badge}
                      </Text>
                    </View>
                  )}
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

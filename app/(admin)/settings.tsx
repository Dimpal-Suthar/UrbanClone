import { ThemeSettings } from '@/components/ThemeSettings';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { showFailedMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

const AdminSettings = observer(() => {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, userProfile, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    // Keep Alert for critical logout confirmation
    Alert.alert('Logout', 'Are you sure you want to logout from admin panel?', [
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
            showFailedMessage('Logout Failed', 'Failed to logout. Please try again.');
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const displayName = userProfile?.displayName || user?.displayName || 'Admin';
  const email = userProfile?.email || user?.email || '';
  const phoneNumber = userProfile?.phoneNumber || user?.phoneNumber || '';
  const photoURL = userProfile?.photoURL || user?.photoURL;

  return (
    <Container>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Admin Settings
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            Manage your admin account
          </Text>
        </View>

        {/* Admin Profile Card */}
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
                    style={{ backgroundColor: `${colors.error}20` }}
                  >
                    <Text className="text-xs font-bold" style={{ color: colors.error }}>
                      ADMIN
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
            </View>
          </Card>
        </View>

        {/* Admin Info */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>
            Admin Information
          </Text>
          
          <Card variant="default" className="mb-3">
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
              <View className="ml-3 flex-1">
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  Role
                </Text>
                <Text className="text-base font-semibold" style={{ color: colors.text }}>
                  Administrator
                </Text>
              </View>
            </View>
          </Card>

          <Card variant="default" className="mb-3">
            <View className="flex-row items-center">
              <Ionicons name="mail" size={22} color={colors.primary} />
              <View className="ml-3 flex-1">
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  Email
                </Text>
                <Text className="text-base font-semibold" style={{ color: colors.text }}>
                  {email || 'Not set'}
                </Text>
              </View>
            </View>
          </Card>

          {phoneNumber && (
            <Card variant="default" className="mb-3">
              <View className="flex-row items-center">
                <Ionicons name="call" size={22} color={colors.primary} />
                <View className="ml-3 flex-1">
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>
                    Phone
                  </Text>
                  <Text className="text-base font-semibold" style={{ color: colors.text }}>
                    {phoneNumber}
                  </Text>
                </View>
              </View>
            </Card>
          )}
        </View>

        {/* Theme Settings */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>
            Appearance
          </Text>
          <ThemeSettings />
        </View>

        {/* Admin Actions */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>
            Actions
          </Text>

          <Pressable className="active:opacity-70">
            <Card variant="default" className="mb-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <Ionicons name="document-text-outline" size={22} color={colors.text} />
                  <Text className="ml-3 text-base" style={{ color: colors.text }}>
                    Platform Logs
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </Pressable>

          <Pressable className="active:opacity-70">
            <Card variant="default" className="mb-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <Ionicons name="settings-outline" size={22} color={colors.text} />
                  <Text className="ml-3 text-base" style={{ color: colors.text }}>
                    Platform Settings
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </Pressable>
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
                  Logout from Admin Panel
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

export default AdminSettings;


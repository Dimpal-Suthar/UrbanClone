import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { showFailedMessage, showSuccessMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AdminEditProfile = observer(() => {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, userProfile, updateProfile, loading } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || user?.displayName || '');
      setEmail(userProfile.email || user?.email || '');
      setPhone(userProfile.phone || user?.phoneNumber || '');
    }
  }, [userProfile, user]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Required', 'Display name is required');
      return;
    }

    try {
      setSaving(true);
      await updateProfile({
        displayName: displayName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      showSuccessMessage('Success', 'Profile updated successfully');
      router.push('/(admin)/settings');
    } catch (error: any) {
      console.error('Update profile error:', error);
      showFailedMessage('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.textSecondary }}>
            Loading profile...
          </Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <Pressable onPress={() => router.back()} style={{ padding: 8, marginRight: 8 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
            Edit Profile
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View style={{ padding: 24 }}>
            <Text
              style={{
                fontSize: 16,
                color: colors.textSecondary,
                marginBottom: 24,
              }}
            >
              Update your admin profile information
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Input
                label="Display Name"
                required
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your full name"
                leftIcon={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Input
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                leftIcon={<Ionicons name="call-outline" size={20} color={colors.textSecondary} />}
              />
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 16,
            // paddingBottom: Math.max(insets.bottom, 16),
            paddingBottom: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <Button
            title={saving ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            disabled={saving || !displayName.trim()}
            loading={saving}
            variant="primary"
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
});

export default AdminEditProfile;


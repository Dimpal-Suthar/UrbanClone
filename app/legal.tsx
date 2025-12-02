import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

const PRIVACY_POLICY_URL = 'https://www.brilworks.com/service-squard-privacy-policy/';
const TERMS_OF_SERVICE_URL = 'https://www.brilworks.com/service-squard-terms-of-service/';

export default function LegalScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { type } = useLocalSearchParams<{ type: 'privacy' | 'terms' }>();
  const [loading, setLoading] = useState(true);

  // Validate type parameter
  if (!type || !['privacy', 'terms'].includes(type)) {
    return (
      <Container safeArea edges={['top']}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-lg font-semibold" style={{ color: colors.error }}>
            Invalid page
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-4 px-6 py-3 rounded-xl active:opacity-70"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </Pressable>
        </View>
      </Container>
    );
  }

  // Show WebView with the appropriate URL
  const url = type === 'privacy' ? PRIVACY_POLICY_URL : TERMS_OF_SERVICE_URL;
  const title = type === 'privacy' ? 'Privacy Policy' : 'Terms of Service';

  return (
    <Container safeArea edges={['top']}>
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
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
            marginLeft: 16,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1,
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4 text-sm" style={{ color: colors.textSecondary }}>
            Loading...
          </Text>
        </View>
      )}

      {/* WebView */}
      <WebView
        source={{ uri: url }}
        style={{ flex: 1, backgroundColor: colors.background }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => setLoading(false)}
        startInLoadingState={true}
        renderLoading={() => (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.background,
            }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      />
    </Container>
  );
}


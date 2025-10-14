import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { db } from '@/config/firebase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { observer } from 'mobx-react-lite';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

const SERVICE_NAMES: { [key: string]: string } = {
  'cleaning': 'Home Cleaning',
  'repairs': 'Repairs & Maintenance',
  'beauty': 'Beauty & Spa',
  'appliance': 'Appliance Repair',
  'painting': 'Painting',
  'pest-control': 'Pest Control',
};

const SERVICE_ICONS: { [key: string]: string } = {
  'cleaning': 'sparkles',
  'repairs': 'build',
  'beauty': 'cut',
  'appliance': 'tv',
  'painting': 'color-palette',
  'pest-control': 'bug',
};

const ProviderServicesScreen = observer(() => {
  const { colors } = useTheme();
  const { user } = useAuth();

  // Fetch provider services
  const { data: providerData, isLoading } = useQuery({
    queryKey: ['provider-services', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      const providerDoc = await getDoc(doc(db, 'providers', user.uid));
      return providerDoc.exists() ? providerDoc.data() : null;
    },
    enabled: !!user?.uid,
  });

  const services = providerData?.services || [];

  return (
    <Container>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            My Services
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            {services.length} services offered
          </Text>
        </View>

        {/* Status Card */}
        <View className="px-6 mb-6">
          <Card variant="elevated">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
                  Provider Status
                </Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  {providerData?.approvalStatus === 'approved' ? 'Active & Approved' : 'Pending Approval'}
                </Text>
              </View>
              <View 
                className="px-3 py-1.5 rounded-full"
                style={{ 
                  backgroundColor: providerData?.approvalStatus === 'approved' 
                    ? `${colors.success}20` 
                    : `${colors.warning}20` 
                }}
              >
                <Text 
                  className="text-xs font-bold"
                  style={{ 
                    color: providerData?.approvalStatus === 'approved' 
                      ? colors.success 
                      : colors.warning 
                  }}
                >
                  {providerData?.approvalStatus?.toUpperCase() || 'UNKNOWN'}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Services List */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>
            Services You Offer
          </Text>

          {services.length === 0 ? (
            <Card variant="default" className="items-center py-8">
              <Ionicons name="construct-outline" size={48} color={colors.textSecondary} />
              <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>
                No services added yet
              </Text>
            </Card>
          ) : (
            services.map((serviceId: string) => (
              <Card key={serviceId} variant="default" className="mb-3">
                <View className="flex-row items-center">
                  <View 
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${colors.primary}20` }}
                  >
                    <Ionicons 
                      name={SERVICE_ICONS[serviceId] as any || 'construct'} 
                      size={24} 
                      color={colors.primary} 
                    />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
                      {SERVICE_NAMES[serviceId] || serviceId}
                    </Text>
                    <View className="flex-row items-center">
                      <View 
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: colors.success }}
                      />
                      <Text className="text-xs" style={{ color: colors.textSecondary }}>
                        Active
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Add More Services */}
        <View className="px-6 mb-8">
          <Pressable 
            className="active:opacity-70"
            onPress={() => Alert.alert('Coming Soon', 'Service management feature coming soon!')}
          >
            <View 
              className="rounded-xl py-4 items-center flex-row justify-center"
              style={{ borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed' }}
            >
              <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              <Text className="ml-2 text-base font-semibold" style={{ color: colors.primary }}>
                Add More Services
              </Text>
            </View>
          </Pressable>
        </View>

        <View className="h-6" />
      </ScrollView>
    </Container>
  );
});

export default ProviderServicesScreen;


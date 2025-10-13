import { View, Text, ScrollView, Image, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { SAMPLE_SERVICES, SAMPLE_PROFESSIONALS } from '@/constants/Categories';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();

  console.log('🔍 ServiceDetailScreen - id:', id);
  console.log('🔍 ServiceDetailScreen - id type:', typeof id);
  console.log('🔍 ServiceDetailScreen - router available:', !!router);

  const service = SAMPLE_SERVICES.find(s => s.id === id);
  console.log('🔍 ServiceDetailScreen - service found:', !!service);
  console.log('🔍 ServiceDetailScreen - service:', service);
  
  if (!service) {
    console.log('❌ ServiceDetailScreen - No service found for id:', id);
    return null;
  }

  const professionals = SAMPLE_PROFESSIONALS.filter(p => p.services.includes(id as string));

  return (
    <Container safeArea={true} edges={['top']}>
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 24, 
        paddingVertical: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
      }}>
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginLeft: 16 }}>
          Service Details
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Service Image */}
        <Image
          source={{ uri: service.imageUrl }}
          style={{ width: '100%', height: 256 }}
          resizeMode="cover"
        />

        <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
          {/* Service Info */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: colors.text }}>
              {service.name}
            </Text>
            <Text style={{ fontSize: 16, marginBottom: 16, color: colors.textSecondary }}>
              {service.description}
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 24 }}>
                <Ionicons name="star" size={20} color="#FFB800" />
                <Text style={{ fontSize: 16, marginLeft: 4, fontWeight: '600', color: colors.text }}>
                  {service.rating}
                </Text>
                <Text style={{ fontSize: 14, marginLeft: 4, color: colors.textSecondary }}>
                  ({service.reviewCount} reviews)
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                <Text style={{ fontSize: 16, marginLeft: 4, color: colors.text }}>
                  {service.duration} min
                </Text>
              </View>
            </View>
          </View>

          {/* Price Card */}
          <Card variant="elevated" style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 14, marginBottom: 4, color: colors.textSecondary }}>
                  Service Price
                </Text>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.primary }}>
                  ₹{service.price}
                </Text>
              </View>
              <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: `${colors.success}20` }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.success }}>
                  20% Off
                </Text>
              </View>
            </View>
          </Card>

          {/* What's Included */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: colors.text }}>
              What's Included
            </Text>
            {[
              'Professional cleaning equipment',
              'Eco-friendly cleaning products',
              'Quality assurance check',
              '100% satisfaction guarantee',
            ].map((item, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={{ marginLeft: 12, fontSize: 16, color: colors.text }}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          {/* Professionals */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>
                Available Professionals
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>
                View All
              </Text>
            </View>
            {professionals.slice(0, 2).map((pro) => (
              <Card key={pro.id} variant="default" style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image
                    source={{ uri: pro.photoUrl }}
                    style={{ width: 64, height: 64, borderRadius: 32 }}
                  />
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 4, color: colors.text }}>
                      {pro.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Ionicons name="star" size={14} color="#FFB800" />
                      <Text style={{ fontSize: 14, marginLeft: 4, color: colors.text }}>
                        {pro.rating}
                      </Text>
                      <Text style={{ fontSize: 12, marginLeft: 8, color: colors.textSecondary }}>
                        {pro.completedJobs} jobs
                      </Text>
                    </View>
                    {pro.distance && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                        <Text style={{ fontSize: 12, marginLeft: 4, color: colors.textSecondary }}>
                          {pro.distance} km away
                        </Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={{ 
        paddingHorizontal: 24, 
        paddingVertical: 16, 
        borderTopWidth: 1, 
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
      }}>
        <View style={{ flexDirection: 'row', gap: 12 , justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}> 
          <Button
            title="Book Now"
            onPress={() => console.log('Book service')}
          />
          </View>
          <View style={{flex:1}}> 
          <Button
            title="Track Service"
            variant="outline"
            onPress={() => {
              console.log('🚀 Button pressed - Track Service');
              console.log('🚀 Current id:', id);
              console.log('🚀 Navigation path:', `/tracking/${id}`);
              console.log('🚀 Router available:', !!router);
              
              // Terminal log - will show in Metro bundler
              console.warn('🔥 TRACKING BUTTON PRESSED - ID:', id);
              
              try {
                router.push('/tracking');
                console.log('✅ Navigation command sent successfully');
                console.warn('🔥 NAVIGATION SUCCESS - Path: /tracking');
              } catch (error) {
                console.log('❌ Navigation error:', error);
                console.warn('🔥 NAVIGATION ERROR:', error);
                Alert.alert('Navigation Error', String(error));
              }
            }}
          />
          </View>
        </View>
      </View>
    </Container>
  );
}


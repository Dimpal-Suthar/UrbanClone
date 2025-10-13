import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Service } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from './ui/Card';

interface ServiceCardProps {
  service: Service;
  onPress: () => void;
}

export function ServiceCard({ service, onPress }: ServiceCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable 
      onPress={onPress} 
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Card variant="elevated" style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row' }}>
          {/* Service Image */}
          <Image
            source={{ uri: service.imageUrl }}
            style={{ width: 96, height: 96, borderRadius: 12 }}
            resizeMode="cover"
          />

          {/* Service Info */}
          <View style={{ flex: 1, marginLeft: 16, justifyContent: 'space-between' }}>
            <View>
              <Text 
                style={{ 
                  fontSize: 16, 
                  fontWeight: '600', 
                  marginBottom: 4, 
                  color: colors.text 
                }} 
                numberOfLines={1}
              >
                {service.name}
              </Text>
              <Text 
                style={{ 
                  fontSize: 14, 
                  marginBottom: 8, 
                  color: colors.textSecondary 
                }} 
                numberOfLines={2}
              >
                {service.description}
              </Text>
            </View>

            {/* Rating & Price */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="star" size={16} color="#FFB800" />
                <Text style={{ fontSize: 14, marginLeft: 4, fontWeight: '500', color: colors.text }}>
                  {service.rating}
                </Text>
                <Text style={{ fontSize: 12, marginLeft: 4, color: colors.textSecondary }}>
                  ({service.reviewCount})
                </Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary }}>
                ₹{service.price}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}


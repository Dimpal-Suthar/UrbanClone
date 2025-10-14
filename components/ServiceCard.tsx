import { getCategoryColor, getCategoryIcon } from '@/constants/ServiceCategories';
import { useTheme } from '@/contexts/ThemeContext';
import { Service } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { Card } from './ui/Card';

interface ServiceCardProps {
  service: Service;
  onPress?: () => void;
  showStatus?: boolean;
}

export const ServiceCard = ({ service, onPress, showStatus = false }: ServiceCardProps) => {
  const { colors } = useTheme();
  const categoryColor = getCategoryColor(service.category);
  const categoryIcon = getCategoryIcon(service.category);

  return (
    <Pressable onPress={onPress} className="active:opacity-70">
      <Card variant="elevated" className="mb-3">
        <View className="flex-row items-start">
          {/* Icon */}
          <View
            className="w-14 h-14 rounded-xl items-center justify-center"
            style={{ backgroundColor: `${categoryColor}20` }}
          >
            <Ionicons name={categoryIcon as any} size={28} color={categoryColor} />
          </View>

          {/* Content */}
          <View className="flex-1 ml-4">
            <View className="flex-row items-start justify-between mb-1">
              <Text className="text-lg font-bold flex-1" style={{ color: colors.text }}>
                {service.name}
              </Text>
              {showStatus && (
                <View
                  className="px-2 py-1 rounded-full ml-2"
                  style={{ backgroundColor: service.isActive ? `${colors.success}20` : `${colors.error}20` }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: service.isActive ? colors.success : colors.error }}
                  >
                    {service.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Text>
                </View>
              )}
            </View>

            <Text className="text-sm mb-2" style={{ color: colors.textSecondary }} numberOfLines={2}>
              {service.description}
            </Text>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="cash-outline" size={16} color={colors.primary} />
                <Text className="text-base font-bold ml-1" style={{ color: colors.primary }}>
                  ₹{service.basePrice}
                </Text>
              </View>

              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text className="text-sm ml-1" style={{ color: colors.textSecondary }}>
                  {service.duration} min
                </Text>
              </View>

              {service.rating && service.reviewCount ? (
                <View className="flex-row items-center">
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text className="text-sm ml-1" style={{ color: colors.text }}>
                    {service.rating.toFixed(1)} ({service.reviewCount})
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
};

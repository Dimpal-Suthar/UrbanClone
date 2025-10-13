import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryItem } from '@/constants/Categories';
import { useTheme } from '@/contexts/ThemeContext';

interface CategoryCardProps {
  category: CategoryItem;
  onPress: () => void;
}

export function CategoryCard({ category, onPress }: CategoryCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ 
        alignItems: 'center', 
        opacity: pressed ? 0.7 : 1,
        width: 100 
      })}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
          backgroundColor: `${category.color}20`,
        }}
      >
        <Ionicons name={category.icon as any} size={32} color={category.color} />
      </View>
      <Text 
        style={{ 
          fontSize: 14, 
          fontWeight: '500', 
          textAlign: 'center', 
          color: colors.text 
        }} 
        numberOfLines={1}
      >
        {category.name}
      </Text>
      <Text 
        style={{ 
          fontSize: 12, 
          textAlign: 'center', 
          marginTop: 4, 
          color: colors.textSecondary 
        }} 
        numberOfLines={2}
      >
        {category.description}
      </Text>
    </Pressable>
  );
}


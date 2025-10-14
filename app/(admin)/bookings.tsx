import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { Text, View } from 'react-native';

export default function AdminBookingsScreen() {
  const { colors } = useTheme();
  
  return (
    <Container>
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          All Bookings
        </Text>
        <Text className="text-sm mt-2 text-center" style={{ color: colors.textSecondary }}>
          Coming soon
        </Text>
      </View>
    </Container>
  );
}


import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';

const SAMPLE_CHATS = [
  {
    id: '1',
    name: 'Rahul Sharma',
    avatar: 'https://i.pravatar.cc/150?img=12',
    lastMessage: 'I will arrive in 10 minutes',
    time: '5 min ago',
    unread: 2,
    online: true,
  },
  {
    id: '2',
    name: 'Sanjay Verma',
    avatar: 'https://i.pravatar.cc/150?img=15',
    lastMessage: 'AC servicing completed successfully',
    time: '2 hours ago',
    unread: 0,
    online: false,
  },
  {
    id: '3',
    name: 'Priya Patel',
    avatar: 'https://i.pravatar.cc/150?img=5',
    lastMessage: 'Thank you for choosing our service!',
    time: '1 day ago',
    unread: 0,
    online: false,
  },
];

export default function ChatScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Container>
      {/* Header */}
      <View className="px-6 pt-4 pb-6">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Messages
          </Text>
          <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.surface }}>
            <Ionicons name="create-outline" size={20} color={colors.text} />
          </View>
        </View>
      </View>

      {/* Chat List */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {SAMPLE_CHATS.map((chat) => (
          <Pressable 
            key={chat.id} 
            className="active:opacity-70"
            onPress={() => router.push(`/chat/${chat.id}`)}
          >
            <Card variant="default" className="mb-3">
              <View className="flex-row items-center">
                {/* Avatar */}
                <View className="relative">
                  <Image
                    source={{ uri: chat.avatar }}
                    className="w-14 h-14 rounded-full"
                  />
                  {chat.online && (
                    <View
                      className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2"
                      style={{ backgroundColor: colors.success, borderColor: colors.surface }}
                    />
                  )}
                </View>

                {/* Chat Info */}
                <View className="flex-1 ml-3">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-base font-semibold" style={{ color: colors.text }}>
                      {chat.name}
                    </Text>
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>
                      {chat.time}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text
                      className="text-sm flex-1"
                      style={{
                        color: chat.unread > 0 ? colors.text : colors.textSecondary,
                        fontWeight: chat.unread > 0 ? '600' : '400',
                      }}
                      numberOfLines={1}
                    >
                      {chat.lastMessage}
                    </Text>
                    {chat.unread > 0 && (
                      <View
                        className="ml-2 w-6 h-6 rounded-full items-center justify-center"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <Text className="text-xs font-semibold text-white">
                          {chat.unread}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </Card>
          </Pressable>
        ))}

        {/* Empty State */}
        {SAMPLE_CHATS.length === 0 && (
          <View className="items-center justify-center py-20">
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
            <Text className="text-lg mt-4" style={{ color: colors.textSecondary }}>
              No messages yet
            </Text>
            <Text className="text-sm mt-2 text-center" style={{ color: colors.textSecondary }}>
              Start a conversation with your service professional
            </Text>
          </View>
        )}

        <View className="h-6" />
      </ScrollView>
    </Container>
  );
}


import { ConversationCard } from '@/components/chat/ConversationCard';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useConversations, useConversationsListRealtime, useUnreadCount } from '@/hooks/useConversations';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';

const ChatScreen = observer(() => {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  // Fetch conversations with infinite scroll
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useConversations(user?.uid || null);

  // Realtime: listen for conversation changes and refresh the list
  useConversationsListRealtime(user?.uid || null);

  // Get total unread count
  const { data: unreadCount = 0 } = useUnreadCount(user?.uid || null);

  // Flatten all pages into single array
  const conversations = data?.pages.flatMap((page: any) => page.conversations) || [];

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleConversationPress = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <Container safeArea edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-6">
        <View>
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Messages
          </Text>
          {unreadCount > 0 && (
            <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
            </Text>
          )}
        </View>
      </View>

      {/* Conversations List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-sm mt-4" style={{ color: colors.textSecondary }}>
            Loading conversations...
          </Text>
        </View>
      ) : conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="chatbubbles-outline" size={80} color={colors.textSecondary} />
          <Text className="text-xl font-bold mt-6" style={{ color: colors.text }}>
            No messages yet
          </Text>
          <Text className="text-sm mt-2 text-center" style={{ color: colors.textSecondary }}>
            Start a conversation with your service professional after booking a service
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationCard
              conversation={item}
              currentUserId={user?.uid || ''}
              onPress={() => handleConversationPress(item.id)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </Container>
  );
});

export default ChatScreen;

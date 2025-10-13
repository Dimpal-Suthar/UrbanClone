import { View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Container } from '@/components/ui/Container';
import { useState, useRef, useEffect } from 'react';

const SAMPLE_MESSAGES = [
  {
    id: '1',
    senderId: 'pro',
    text: 'Hello! I will arrive at your location in 10 minutes.',
    timestamp: new Date(Date.now() - 300000),
    isRead: true,
  },
  {
    id: '2',
    senderId: 'user',
    text: 'Great! Looking forward to it.',
    timestamp: new Date(Date.now() - 240000),
    isRead: true,
  },
  {
    id: '3',
    senderId: 'pro',
    text: 'I have all the necessary equipment. Is there anything specific you need?',
    timestamp: new Date(Date.now() - 120000),
    isRead: true,
  },
  {
    id: '4',
    senderId: 'user',
    text: 'No, that should be fine. Thank you!',
    timestamp: new Date(Date.now() - 60000),
    isRead: true,
  },
];

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState(SAMPLE_MESSAGES);
  const [inputText, setInputText] = useState('');

  const proName = 'Rahul Sharma';
  const proStatus = 'Online';

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        senderId: 'user',
        text: inputText.trim(),
        timestamp: new Date(),
        isRead: false,
      };
      setMessages([...messages, newMessage]);
      setInputText('');
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  return (
    <Container safeArea={true} edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View className="flex-row items-center flex-1">
          <Pressable onPress={() => router.back()} className="active:opacity-70 mr-4">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.primary }}>
            <Text className="text-white font-semibold text-lg">
              {proName.charAt(0)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold" style={{ color: colors.text }}>
              {proName}
            </Text>
            <Text className="text-xs" style={{ color: colors.success }}>
              {proStatus}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-4">
          <Pressable className="active:opacity-70">
            <Ionicons name="call-outline" size={24} color={colors.text} />
          </Pressable>
          <Pressable className="active:opacity-70">
            <Ionicons name="videocam-outline" size={24} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 px-6 py-4"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => {
            const isUser = message.senderId === 'user';
            return (
              <View
                key={message.id}
                className={`mb-4 ${isUser ? 'items-end' : 'items-start'}`}
              >
                <View
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'
                  }`}
                  style={{
                    backgroundColor: isUser ? colors.primary : colors.surface,
                  }}
                >
                  <Text
                    className="text-base"
                    style={{ color: isUser ? '#FFFFFF' : colors.text }}
                  >
                    {message.text}
                  </Text>
                </View>
                <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  {formatTime(message.timestamp)}
                  {isUser && message.isRead && (
                    <Ionicons name="checkmark-done" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
                  )}
                </Text>
              </View>
            );
          })}
          <View className="h-4" />
        </ScrollView>

        {/* Input */}
        <View className="px-6 py-4" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
          <View className="flex-row items-center gap-2">
            <Pressable className="active:opacity-70">
              <Ionicons name="add-circle" size={28} color={colors.primary} />
            </Pressable>
            <View className="flex-1 flex-row items-center rounded-full px-4 py-2" style={{ backgroundColor: colors.surface }}>
              <TextInput
                className="flex-1 text-base"
                style={{ color: colors.text }}
                placeholder="Type a message..."
                placeholderTextColor={colors.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
              <Pressable className="active:opacity-70 ml-2">
                <Ionicons name="happy-outline" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Pressable 
              onPress={handleSend}
              className="active:opacity-70"
              disabled={!inputText.trim()}
            >
              <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: inputText.trim() ? colors.primary : colors.border }}>
                <Ionicons name="send" size={20} color={inputText.trim() ? '#FFFFFF' : colors.textSecondary} />
              </View>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}


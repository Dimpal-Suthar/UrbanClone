import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SERVICE_CATEGORIES } from '@/constants/ServiceCategories';
import { useTheme } from '@/contexts/ThemeContext';
import { ServiceCategory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

interface ProviderCategoryModalProps {
  visible: boolean;
  currentCategories: ServiceCategory[];
  onClose: () => void;
  onSave: (categories: ServiceCategory[]) => Promise<void>;
  isLoading: boolean;
}

export const ProviderCategoryModal: React.FC<ProviderCategoryModalProps> = ({
  visible,
  currentCategories,
  onClose,
  onSave,
  isLoading,
}) => {
  const { colors } = useTheme();
  const [selectedCategories, setSelectedCategories] = useState<ServiceCategory[]>(currentCategories);

  // Update selected categories when modal opens
  React.useEffect(() => {
    setSelectedCategories(currentCategories);
  }, [currentCategories, visible]);

  const toggleCategory = (category: ServiceCategory) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleSave = async () => {
    if (selectedCategories.length === 0) {
      return;
    }
    await onSave(selectedCategories);
    onClose(); // Close modal after successful save
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <View className="pt-12 px-6 pb-6" style={{ backgroundColor: colors.background }}>
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                Manage Service Categories
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                Select the services you want to offer
              </Text>
            </View>
            <Pressable 
              onPress={onClose}
              className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
              style={{ backgroundColor: colors.background }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 pt-6">
          {/* Current Selection Info */}
          <Card variant="elevated" className="mb-6">
            <View className="flex-row items-center">
              <View 
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: `${colors.primary}20` }}
              >
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold" style={{ color: colors.text }}>
                  {selectedCategories.length} Categories Selected
                </Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  You can offer services in these categories
                </Text>
              </View>
            </View>
          </Card>

          {/* Categories List */}
          <View className="mb-6">
            <Text className="text-lg font-bold mb-4" style={{ color: colors.text }}>
              Available Categories
            </Text>
            
            {SERVICE_CATEGORIES.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              return (
                <Pressable
                  key={category.id}
                  onPress={() => toggleCategory(category.id)}
                  className="mb-3"
                >
                  <Card 
                    variant={isSelected ? "elevated" : "default"}
                    className="p-4"
                    style={{
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? category.color : colors.border,
                      backgroundColor: isSelected ? `${category.color}10` : colors.surface,
                    }}
                  >
                    <View className="flex-row items-center">
                      <View 
                        className="w-12 h-12 rounded-full items-center justify-center mr-4"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <Ionicons name={category.icon as any} size={24} color={category.color} />
                      </View>
                      
                      <View className="flex-1">
                        <Text 
                          className="text-lg font-bold mb-1" 
                          style={{ color: isSelected ? category.color : colors.text }}
                        >
                          {category.name}
                        </Text>
                        <Text className="text-sm" style={{ color: colors.textSecondary }}>
                          {category.description}
                        </Text>
                      </View>
                      
                      <View className="ml-4">
                        {isSelected ? (
                          <View 
                            className="w-8 h-8 rounded-full items-center justify-center"
                            style={{ backgroundColor: category.color }}
                          >
                            <Ionicons name="checkmark" size={20} color="white" />
                          </View>
                        ) : (
                          <View 
                            className="w-8 h-8 rounded-full items-center justify-center"
                            style={{ 
                              backgroundColor: colors.background,
                              borderWidth: 2,
                              borderColor: colors.border
                            }}
                          >
                            <Ionicons name="add" size={20} color={colors.textSecondary} />
                          </View>
                        )}
                      </View>
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>

          {/* Warning Message */}
          {selectedCategories.length === 0 && (
            <Card variant="default" className="mb-6" style={{ backgroundColor: `${colors.warning}10`, borderColor: colors.warning }}>
              <View className="flex-row items-center">
                <Ionicons name="warning" size={24} color={colors.warning} />
                <View className="ml-3 flex-1">
                  <Text className="text-base font-bold" style={{ color: colors.warning }}>
                    No Categories Selected
                  </Text>
                  <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                    You need to select at least one category to offer services
                  </Text>
                </View>
              </View>
            </Card>
          )}

          <View className="h-6" />
        </ScrollView>

        {/* Footer */}
        <View className="px-6 pb-8 pt-6" style={{ backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 py-4 rounded-2xl items-center justify-center active:opacity-70"
              style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
            >
              <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                Cancel
              </Text>
            </Pressable>
            <Button
              title="Save Changes"
              onPress={handleSave}
              disabled={isLoading || selectedCategories.length === 0}
              loading={isLoading}
              variant="primary"
              size="lg"
              className="flex-1"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

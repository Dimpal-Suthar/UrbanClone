import { View, Text, Switch, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from './ui/Card';

export function ThemeSettings() {
  const { themeMode, colors, setThemeMode } = useTheme();

  const handleDarkModeToggle = (value: boolean) => {
    setThemeMode(value ? 'dark' : 'light');
  };

  const handleSystemModeToggle = (value: boolean) => {
    setThemeMode(value ? 'system' : 'light');
  };

  return (
    <View>
      {/* Dark Mode Toggle */}
      <Card variant="default" style={{ marginBottom: 12 }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          paddingVertical: 4
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons 
              name={themeMode === 'dark' ? 'moon' : 'moon-outline'} 
              size={22} 
              color={colors.text} 
            />
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '500', 
              color: colors.text, 
              marginLeft: 12 
            }}>
              Dark Mode
            </Text>
          </View>
          <Switch
            value={themeMode === 'dark'}
            onValueChange={handleDarkModeToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
            disabled={themeMode === 'system'}
          />
        </View>
      </Card>

      {/* System Mode Toggle */}
      <Card variant="default" style={{ marginBottom: 12 }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          paddingVertical: 4
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons 
              name={themeMode === 'system' ? 'phone-portrait' : 'phone-portrait-outline'} 
              size={22} 
              color={colors.text} 
            />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '500', 
                color: colors.text 
              }}>
                Follow System
              </Text>
              <Text style={{ 
                fontSize: 12, 
                color: colors.textSecondary,
                marginTop: 2
              }}>
                Use device theme setting
              </Text>
            </View>
          </View>
          <Switch
            value={themeMode === 'system'}
            onValueChange={handleSystemModeToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </Card>

      {/* Current Theme Info */}
      <View style={{ 
        backgroundColor: `${colors.primary}10`, 
        borderRadius: 12, 
        padding: 16, 
        marginTop: 8 
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '600', 
            color: colors.primary, 
            marginLeft: 8 
          }}>
            Current Theme
          </Text>
        </View>
        <Text style={{ 
          fontSize: 14, 
          color: colors.textSecondary,
          lineHeight: 20
        }}>
          {themeMode === 'system' 
            ? 'Following your device theme setting' 
            : themeMode === 'dark' 
            ? 'Dark mode is active' 
            : 'Light mode is active'
          }
        </Text>
      </View>
    </View>
  );
}

// Import base configuration from app.json
const appConfig = require('./app.json');

// Get single Google Maps API key for both Android and iOS
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Export config with dynamic environment variables
module.exports = {
  ...appConfig,
  expo: {
    ...appConfig.expo,
    
    // iOS Google Maps configuration (CRITICAL for native module)
    ios: {
      ...appConfig.expo.ios,
      config: {
        googleMapsApiKey: googleMapsApiKey
      }
    },
    
    // Android Google Maps configuration
    android: {
      ...appConfig.expo.android,
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey
        }
      },
      permissions: [
        ...(appConfig.expo.android.permissions || []),
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    
    // Add react-native-maps plugin for proper iOS configuration
    plugins: [
      ...(appConfig.expo.plugins || []),
      [
        'react-native-maps',
        {
          iosGoogleMapsApiKey: googleMapsApiKey,
        },
      ],
    ],
  }
};


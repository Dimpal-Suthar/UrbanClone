// Import base configuration from app.json
const appConfig = require('./app.json');

// Get single Google Maps API key for both Android and iOS
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Export config with dynamic environment variables
module.exports = {
  ...appConfig,
  expo: {
    ...appConfig.expo,
    
    // EAS Update configuration
    updates: {
      url: "https://u.expo.dev/bb51b59e-8081-4d34-a772-0941054818a5"
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    
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
        googleMapsApiKey: googleMapsApiKey
      },
      permissions: [
        ...(appConfig.expo.android.permissions || []),
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    
    // Add react-native-maps plugin and update expo-build-properties to fix OutOfMemoryError
    plugins: [
      ...(appConfig.expo.plugins || []).map(plugin => {
        // Update existing expo-build-properties plugin with memory settings
        if (Array.isArray(plugin) && plugin[0] === 'expo-build-properties') {
          return [
            'expo-build-properties',
            {
              ...plugin[1],
              android: {
                ...(plugin[1].android || {}),
                enableProguardInReleaseBuilds: false
              }
            }
          ];
        }
        return plugin;
      }),
      [
        'react-native-maps',
        {
          iosGoogleMapsApiKey: googleMapsApiKey,
          androidGoogleMapsApiKey: googleMapsApiKey, // CRITICAL: This injects API key into AndroidManifest.xml
        },
      ],
    ],
  }
};


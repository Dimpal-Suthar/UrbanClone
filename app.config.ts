import { ConfigContext, ExpoConfig } from '@expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return {
    ...config,
    name: 'ServiceSquad',
    slug: 'urbanclone',
    version: '1.0.0',
    scheme: 'urbanclone',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.urbanclone.app',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'This app needs access to location when open to show nearby services and track your location.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'This app needs access to location to show nearby services and track your location.',
        NSLocationAlwaysUsageDescription:
          'This app needs access to location in the background to provide real-time tracking during active bookings.',
        LSApplicationQueriesSchemes: ['comgooglemaps', 'googlemaps', 'maps'],
      },
      googleServicesFile: './GoogleService-Info.plist',
      config: {
        googleMapsApiKey,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.urbanclone.app',
      permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'ACCESS_BACKGROUND_LOCATION'],
      googleServicesFile: './google-services.json',
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-location',
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
          },
          android: {
            enableProguardInReleaseBuilds: false,
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: '35.0.0',
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      ...(config.extra || {}),
      router: {},
      eas: {
        projectId: 'bb51b59e-8081-4d34-a772-0941054818a5',
      },
      googleMapsApiKey,
    },
    owner: 'brilworks',
  };
};



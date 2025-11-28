import { ConfigContext, ExpoConfig } from '@expo/config';
import * as dotenv from 'dotenv';

// Load .env file explicitly (needed for app.config.ts during build)
dotenv.config();

export default ({ config }: ConfigContext): ExpoConfig => {
  // Google Maps API key must be provided via environment variable
  // For EAS builds: eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value YOUR_API_KEY
  // For local builds: Set in .env file (automatically loaded) or export before build
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!googleMapsApiKey) {
    const isLocalBuild = process.env.EAS_LOCAL_BUILD === 'true' || process.argv.includes('--local');
    const errorMessage = isLocalBuild
      ? 'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is required for local builds.\n\n' +
        'Set it in one of these ways:\n' +
        '1. Environment variable: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key yarn build:android:apk --local\n' +
        '2. Create .env file: echo "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key" > .env\n' +
        '3. Export before build: export EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key'
      : 'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is required. ' +
        'Please set it as an EAS secret: eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value YOUR_API_KEY';
    
    throw new Error(errorMessage);
  }

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



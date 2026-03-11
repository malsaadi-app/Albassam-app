import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.albassam.hrapp',
  appName: 'مدارس البسام',
  webDir: 'out', // Static export directory
  
  // Point to production server (hybrid approach)
  server: {
    url: 'https://app.albassam-app.com',
    cleartext: false, // Force HTTPS
    androidScheme: 'https',
    iosScheme: 'https',
  },
  
  // App configuration
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
  },
  
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Disable in production
  },
  
  // Plugins configuration
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1D0B3E',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    BiometricAuth: {
      // Configuration will be added as needed
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1D0B3E',
    },
  },
};

export default config;

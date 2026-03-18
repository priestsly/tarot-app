import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.priestsly.tarot',
  appName: 'Mystic Tarot',
  webDir: 'out',
  server: {
    // Use https scheme and localhost for better security and feature support
    androidScheme: 'https',
    hostname: 'localhost',
    allowNavigation: ['*'],
  },
  android: {
    // Allow mixed content (http resources on https page)
    allowMixedContent: true,
  },
};

export default config;

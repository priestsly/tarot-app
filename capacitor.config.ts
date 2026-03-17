import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.priestsly.tarot',
  appName: 'Mystic Tarot',
  webDir: 'out',
  server: {
    // Allow mixed content for WebRTC
    allowNavigation: ['*'],
    cleartext: true,
  },
  android: {
    // Allow WebView to use camera/mic
    webContentsDebuggingEnabled: true,
    allowMixedContent: true,
  },
  plugins: {
    // No special plugin config needed - permissions are in AndroidManifest.xml
    // and getUserMedia is handled by the WebView
  }
};

export default config;

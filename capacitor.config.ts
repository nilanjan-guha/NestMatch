import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nestmatch.app',
  appName: 'NestMatch',
  webDir: 'out',
  server: {
    // We are using adb reverse tcp:3000 tcp:3000 so the emulator can access localhost securely
    // IMPORTANT: Change this to your live Vercel URL (e.g., https://nestmatch.vercel.app) before publishing!
    url: 'http://localhost:3000',
    cleartext: true
  }
};

export default config;

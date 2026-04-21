import type { CapacitorConfig } from '@capacitor/cli';

const mobileWebUrl = process.env.PUMP_MOBILE_WEB_URL?.trim();

const config: CapacitorConfig = {
  appId: 'no.pump.app',
  appName: 'pump.no',
  webDir: 'mobile-web',
  server: mobileWebUrl
    ? {
        url: mobileWebUrl,
        cleartext: mobileWebUrl.startsWith('http://')
      }
    : undefined
};

export default config;

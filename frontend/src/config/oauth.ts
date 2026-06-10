// OAuth configuratie — vul hier je eigen Client IDs in
// Voor Google: https://console.cloud.google.com/ > APIs & Services > Credentials > OAuth 2.0 Client IDs
// Voor Apple: https://developer.apple.com/ > Certificates, Identifiers & Profiles > Identifiers > Service ID

export const OAUTH_CONFIG = {
  google: {
    // iOS client ID (voor Expo Go / native iOS)
    iosClientId: undefined as string | undefined,
    // Android client ID (voor native Android)
    androidClientId: undefined as string | undefined,
    // Web client ID (voor de web build)
    webClientId: undefined as string | undefined,
    // Expo client ID (voor Expo Go via auth-session proxy)
    expoClientId: undefined as string | undefined,
  },
  apple: {
    // Service ID (voor Apple Sign In)
    serviceId: undefined as string | undefined,
    // Redirect URI (moet overeenkomen met Apple Developer config)
    redirectUri: undefined as string | undefined,
  },
};

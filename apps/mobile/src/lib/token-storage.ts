import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const REFRESH_TOKEN_KEY = "vmf_refresh_token";

// O SDK web do expo-secure-store nao implementa alguns metodos nativos (ex:
// deleteItemAsync quebra em runtime). O alvo real deste app e iOS/Android -
// no navegador (so usado pra desenvolvimento rapido/testes), cai pra
// localStorage, que nao tem a mesma seguranca do Keychain/Keystore mas evita
// o crash e mantem o fluxo de autenticacao testavel via "expo start --web".
const isWeb = Platform.OS === "web";

export async function getStoredRefreshToken(): Promise<string | null> {
  if (isWeb) {
    return typeof window === "undefined" ? null : window.localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setStoredRefreshToken(token: string): Promise<void> {
  if (isWeb) {
    if (typeof window !== "undefined") window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function clearStoredRefreshToken(): Promise<void> {
  if (isWeb) {
    if (typeof window !== "undefined") window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

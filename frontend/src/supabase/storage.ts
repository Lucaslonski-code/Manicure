import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'supabase_session';

interface MinimalSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (key !== SESSION_KEY) {
      return SecureStore.getItemAsync(key);
    }
    
    const stored = await SecureStore.getItemAsync(SESSION_KEY);
    if (!stored) return null;
    
    try {
      const minimal = JSON.parse(stored) as MinimalSession;
      // Reconstruct the full session object that Supabase expects
      const session = {
        access_token: minimal.access_token,
        refresh_token: minimal.refresh_token,
        expires_in: minimal.expires_at ? Math.max(0, Math.floor((minimal.expires_at - Date.now()) / 1000)) : 3600,
        expires_at: minimal.expires_at,
        token_type: 'bearer',
        user: null, // User will be fetched separately by the auth system
      };
      return JSON.stringify(session);
    } catch {
      return null;
    }
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    // Check the size of the value we are about to store
    const sizeInBytes = new TextEncoder().encode(value).length;
    if (sizeInBytes > 2048) {
      console.warn(`SecureStore: Value for key "${key}" is ${sizeInBytes} bytes, which exceeds 2048 bytes limit`);
    }

    if (key !== SESSION_KEY) {
      return SecureStore.setItemAsync(key, value);
    }
    
    try {
      const session = JSON.parse(value);
      // Store only the minimal required data
      const minimal: MinimalSession = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
      };
      // Check size of the minimal session before storing
      const jsonString = JSON.stringify(minimal);
      const minimalSizeInBytes = new TextEncoder().encode(jsonString).length;
      if (minimalSizeInBytes > 2048) {
        console.warn(`SecureStore: Minimal session size (${minimalSizeInBytes} bytes) exceeds 2048 bytes limit`);
      }
      return SecureStore.setItemAsync(SESSION_KEY, jsonString);
    } catch {
      // If parsing fails, store as-is (fallback)
      return SecureStore.setItemAsync(key, value);
    }
  },
  
  removeItem: async (key: string): Promise<void> => {
    if (key !== SESSION_KEY) {
      return SecureStore.deleteItemAsync(key);
    }
    return SecureStore.deleteItemAsync(SESSION_KEY);
  },
};

export default SecureStoreAdapter;
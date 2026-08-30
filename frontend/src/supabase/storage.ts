import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'supabase_session';

interface MinimalSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

function extractMinimalSession(value: string): MinimalSession | null {
  try {
    const parsed = JSON.parse(value);
    return {
      access_token: parsed.access_token || '',
      refresh_token: parsed.refresh_token || '',
      expires_at: parsed.expires_at,
    };
  } catch {
    return null;
  }
}

function getSessionSizeInBytes(session: MinimalSession): number {
  return new TextEncoder().encode(JSON.stringify(session)).length;
}

const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (key === SESSION_KEY) {
      const stored = await SecureStore.getItemAsync(SESSION_KEY);
      if (!stored) return null;
      
      try {
        const minimal = extractMinimalSession(stored);
        if (!minimal) return null;
        
        return JSON.stringify({
          access_token: minimal.access_token,
          refresh_token: minimal.refresh_token,
          expires_in: minimal.expires_at ? Math.max(0, Math.floor((minimal.expires_at - Date.now()) / 1000)) : 3600,
          expires_at: minimal.expires_at,
          token_type: 'bearer',
          user: null,
        });
      } catch {
        return null;
      }
    }
    
    const stored = await SecureStore.getItemAsync(key);
    if (!stored) return null;
    
    try {
      const minimal = extractMinimalSession(stored);
      if (minimal) {
        return JSON.stringify({
          access_token: minimal.access_token,
          refresh_token: minimal.refresh_token,
          expires_in: minimal.expires_at ? Math.max(0, Math.floor((minimal.expires_at - Date.now()) / 1000)) : 3600,
          expires_at: minimal.expires_at,
          token_type: 'bearer',
          user: null,
        });
      }
      return stored;
    } catch {
      return null;
    }
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    const sizeInBytes = new TextEncoder().encode(value).length;
    const isSessionKey = key === SESSION_KEY;

    if (isSessionKey) {
      try {
        const minimal = extractMinimalSession(value);
        if (minimal) {
          const jsonString = JSON.stringify(minimal);
          const minimalSizeInBytes = getSessionSizeInBytes(minimal);
          if (minimalSizeInBytes > 2048) {
            console.warn(`SecureStore: Minimal session size (${minimalSizeInBytes} bytes) exceeds 2048 bytes limit for key "${key}"`);
          }
          return SecureStore.setItemAsync(SESSION_KEY, jsonString);
        }
      } catch {
        // If parsing fails, fall through to store as-is below
      }
    }

    if (!isSessionKey && sizeInBytes > 2048) {
      const minimal = extractMinimalSession(value);
      if (minimal) {
        const jsonString = JSON.stringify(minimal);
        const minimalSizeInBytes = getSessionSizeInBytes(minimal);
        console.warn(`SecureStore: Value for key "${key}" is ${sizeInBytes} bytes, extracting minimal session (${minimalSizeInBytes} bytes)`);
        return SecureStore.setItemAsync(SESSION_KEY, jsonString);
      }
      console.warn(`SecureStore: Value for key "${key}" is ${sizeInBytes} bytes, which exceeds 2048 bytes limit and cannot be minimized`);
    }

    return SecureStore.setItemAsync(key, value);
  },
  
  removeItem: async (key: string): Promise<void> => {
    if (key === SESSION_KEY) {
      return SecureStore.deleteItemAsync(SESSION_KEY);
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export default SecureStoreAdapter;
import { createClient } from '@supabase/supabase-js';
import SecureStoreAdapter from './storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// skipAutoInitialize: true é necessário porque o bootstrap de auth é
// controlado manualmente por useAuth (com timeout e processamento de
// deep link). A inicialização automática do SDK poderia chamar
// getSession() antes do app estar pronto, bloqueando a UI.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    skipAutoInitialize: true,
  },
});

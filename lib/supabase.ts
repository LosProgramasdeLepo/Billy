import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ulvxokhhsawattxgwdlk.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsdnhva2hoc2F3YXR0eGd3ZGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0MDk2OTUsImV4cCI6MjA0MDk4NTY5NX0.m5RHN5WryNqTDW4NrkfuOyeq94iyPkgK3gHY3zJBdmc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

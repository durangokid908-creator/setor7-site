import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://apfficthoafljjmwekzu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZmZpY3Rob2FmbGpqbXdla3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMDc1MjEsImV4cCI6MjA3ODg4MzUyMX0.u6Dv-tut1HzixStYyZ1hIZiPzDfO42e9VVaCRCUWxus'

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Import the supabase client like this:
// For React:
// import { supabase } from "@/integrations/supabase/client";
// For React Native:
// import { supabase } from "@/src/integrations/supabase/client";

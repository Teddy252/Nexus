import { createClient } from '@supabase/supabase-js';

// Supabase credentials are hardcoded for this environment.
const supabaseUrl = 'https://hwwycgljavxtebatjkog.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3ljZ2xqYXZ4dGViYXRqa29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDcwODUsImV4cCI6MjA3Mzg4MzA4NX0.i3hd5p08-vUBWMdkkIG_EhU847Gsy_pMihmeoIFaapg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

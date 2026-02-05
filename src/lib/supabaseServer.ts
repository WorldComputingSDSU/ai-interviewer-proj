import { createClient } from '@supabase/supabase-js';

export function supabaseAdmin() {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
    const supabaseKey = process.env.REACT_APP_ANON_KEY
    return createClient(url, key, {auth: {persistSession:false}});
    //return createClient(supabaseUrl, supabaseKey)
}
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function run() {
    try {
        console.log('Checking content_likes table...')
        const { data, error } = await supabase.from('content_likes').select('*').order('created_at', { ascending: false }).limit(20)
        if (error) {
            console.error('Error querying content_likes:', error)
            process.exit(1)
        }
        console.log('Rows:', data)
    } catch (err) {
        console.error('Unexpected error:', err)
        process.exit(1)
    }
}

run()
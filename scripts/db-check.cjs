require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
(async() => {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('[client.server] SUPABASE_URL:', url);
    console.log('[client.server] SUPABASE_SERVICE_ROLE_KEY exists:', !!key);
    if (!url || !key) {
        console.error('Missing SUPABASE env vars');
        process.exit(1);
    }
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    try {
        const { data, error, count } = await supabase.from('products').select('id,slug,name,category_slug,is_active', { count: 'exact' }).range(0, 99);
        console.log('DB product count:', count);
        console.log('Sample rows:', JSON.stringify(data, null, 2));
        if (error) console.error('DB error:', error);
    } catch (e) {
        console.error('DB check failed:', e);
    }
    process.exit(0);
})();
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
(async() => {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('[client.server] SUPABASE_URL:', url);
    console.log('[client.server] SUPABASE_SERVICE_ROLE_KEY exists:', !!key);
    if (!url || !key) process.exit(0);
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    try {
        const { data, error, count } = await supabase.from('products').select('id,slug,name,image', { count: 'exact' }).range(0, 9);
        console.log('DB query result count:', count);
        console.log('DB sample:', JSON.stringify(data, null, 2));
        if (error) console.error('DB error:', error);
    } catch (e) {
        console.error('DB check failed:', e);
    }
    process.exit(0);
})();
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
(async() => {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) process.exit(1);
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    try {
        const { data, error } = await supabase.from('products').select('category_slug');
        if (error) {
            console.error('products fetch error:', error);
        } else {
            const counts = (data || []).reduce((acc, r) => {
                acc[r.category_slug] = (acc[r.category_slug] || 0) + 1;
                return acc;
            }, {});
            console.log('category counts:', counts);
        }
    } catch (e) {
        try {
            const { data, error } = await supabase.from('products').select('category_slug, count:count', { count: 'exact' });
            console.log('fallback products fetch:', data, error);
        } catch (e2) {
            console.error('failed:', e2);
        }
    }
    process.exit(0);
})();
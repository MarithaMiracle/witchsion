import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error('VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
    const slug = 'crystal-101';
    const { data: existing, error: fetchErr } = await supabase.from('content').select('id, type').eq('slug', slug).maybeSingle();
    if (fetchErr) {
        console.error('Fetch error:', fetchErr);
        process.exit(1);
    }
    if (!existing) {
        console.error('No content found with slug', slug);
        process.exit(1);
    }
    console.log('Existing type for', slug, ':', existing.type);
    if (existing.type === 'blog') {
        console.log('Already blog — no change needed.');
        process.exit(0);
    }
    const { error: upsertErr } = await supabase.from('content').update({ type: 'blog' }).eq('id', existing.id);
    if (upsertErr) {
        console.error('Update error:', upsertErr);
        process.exit(1);
    }
    console.log('Updated content type to blog for', slug);
    process.exit(0);
}

run();
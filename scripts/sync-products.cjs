require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
(async() => {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        console.error('Missing SUPABASE env vars');
        process.exit(1);
    }

    const supabase = createClient(url, key, { auth: { persistSession: false } });

    // Static products to sync (only incenses & crystals — other categories already present in DB)
    const incenses = [
        'Karmasutra', 'Call Money', 'Money Drawing', 'Attract Money', 'Meditation', 'Money House',
        'Business Boom', 'Good Fortune', 'Good Luck', 'Call Client', 'Abre Camino', 'Passion', 'Exotic', 'Love', 'Attraction', 'Jasmine', 'Lavender'
    ];

    const crystals = [
        'Citrine', 'Amethyst', 'Rose Quartz', 'Black Obsidian', 'Black Tourmaline', 'Tiger Eyes', 'Clear Quartz', 'Labradorite', 'Moonstone', 'Lapis Lazuli', 'Pyrite', 'Carnelian'
    ];

    const toUpsert = [];

    incenses.forEach((name) => {
        const slug = `incense-${name.toLowerCase().replace(/\s+/g, '-')}`;
        toUpsert.push({
            slug,
            name: `${name} Incense`,
            category_slug: 'incenses',
            price: 15000,
            currency: 'NGN',
            blurb: 'Slow-burning incense, hand-blended.',
            description: `Hand-blended ${name} incense in small-batch format.`,
            is_active: true,
        });
    });

    crystals.forEach((name) => {
        const slug = `crystal-${name.toLowerCase().replace(/\s+/g, '-')}`;
        toUpsert.push({
            slug,
            name,
            category_slug: 'crystals',
            price: 12000,
            currency: 'NGN',
            blurb: 'Pendant or bracelet - chosen for resonance.',
            description: `Ethically sourced ${name.toLowerCase()} offered as pendants and bracelets.`,
            is_active: true,
        });
    });

    try {
        // Ensure category rows exist and map slugs -> ids
        const neededCategories = ['incenses', 'crystals'];
        const { data: existingCats } = await supabase.from('categories').select('id,slug,name').in('slug', neededCategories);
        const catMap = {};
        (existingCats || []).forEach((c) => { catMap[c.slug] = c.id; });

        // Create missing categories
        const missing = neededCategories.filter((s) => !catMap[s]);
        if (missing.length > 0) {
            const toCreate = missing.map((s) => ({ slug: s, name: s === 'incenses' ? 'Incenses' : 'Crystals' }));
            const { data: created, error: createErr } = await supabase.from('categories').upsert(toCreate, { onConflict: 'slug' }).select('id,slug');
            if (createErr) {
                console.error('Failed to create categories:', createErr);
                process.exit(1);
            }
            (created || []).forEach((c) => { catMap[c.slug] = c.id; });
        }

        // Attach category_id to each product
        const toUpsertWithCat = toUpsert.map((p) => ({...p, category_id: catMap[p.category_slug] }));

        console.log(`Attempting to upsert ${toUpsertWithCat.length} products...`);
        const { data, error } = await supabase.from('products').upsert(toUpsertWithCat, { onConflict: 'slug' }).select('id,slug,name,category_slug,category_id');
        if (error) {
            console.error('Upsert error:', error);
            process.exit(1);
        }
        console.log('Upsert succeeded. Sample rows:', JSON.stringify(data.slice(0, 10), null, 2));
    } catch (e) {
        console.error('Sync failed:', e);
        process.exit(1);
    }

    process.exit(0);
})();
// src/seed-products.ts
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const categories = [
  { slug: 'oils', name: 'Oils', blurb: 'Charged & conjured anointing oils.' },
  { slug: 'spell-jars', name: 'Spell Jars', blurb: 'Sealed ritual jars, prepared on order.' },
  { slug: 'baths', name: 'Spiritual Baths', blurb: 'Bespoke baths made to order.' },
  { slug: 'soaps', name: 'Conjured Soaps', blurb: 'Ritual soaps, charged by hand.' },
  { slug: 'smudge', name: 'Smudge Sticks', blurb: 'Hand-bundled cleansing smoke.' },
  { slug: 'incenses', name: 'Incenses', blurb: 'Hand-blended small-batch incense.' },
  { slug: 'crystals', name: 'Crystals', blurb: 'Pendants & bracelets, cleansed.' },
];

async function seed() {
  // Insert categories first
  const { data: insertedCategories, error: catError } = await supabase
    .from('categories')
    .upsert(categories, { onConflict: 'slug' })
    .select();
  
  if (catError) {
    console.error('Error inserting categories:', catError);
    process.exit(1);
  }
  
  console.log('Categories inserted:', insertedCategories?.length);
  
  // Create product map
  const categoryMap = new Map(insertedCategories!.map(c => [c.slug, c]));
  
  // Define products
  const products = [
    // Oils
    { slug: 'magick-attraction-oil', name: 'Magick Attraction Oil', category_slug: 'oils', price: 13000, currency: 'NGN', blurb: 'Hand-charged ritual oil in amber glass.', intention: 'Magick Attraction Oil', use_case: ['Anoint candles', 'Dress petitions', 'Wear over pulse points'] },
    { slug: 'money-drawing-oil', name: 'Money Drawing Oil', category_slug: 'oils', price: 13000, currency: 'NGN', blurb: 'Hand-charged ritual oil in amber glass.', intention: 'Money Drawing Oil', use_case: ['Anoint candles', 'Dress petitions', 'Wear over pulse points'] },
    { slug: 'manifestation-oil', name: 'Manifestation Oil', category_slug: 'oils', price: 15000, currency: 'NGN', blurb: 'Hand-charged ritual oil in amber glass.', intention: 'Manifestation Oil', use_case: ['Anoint candles', 'Dress petitions', 'Wear over pulse points'] },
    { slug: 'lady-of-luxury-oil', name: 'Lady of Luxury', category_slug: 'oils', price: 30000, currency: 'NGN', blurb: 'Hand-charged ritual oil in amber glass.', intention: 'Lady of Luxury', use_case: ['Anoint candles', 'Dress petitions', 'Wear over pulse points'] },
    // Conjured Oils
    { slug: 'delilah-oil', name: 'Delilah', category_slug: 'oils', price: 55000, currency: 'NGN', blurb: 'Long-conjured oil sealed under intention.', intention: 'Delilah', use_case: ['Anoint candles', 'Dress petitions', 'Charge ritual tools'] },
    { slug: 'wealth-prosperity-oil', name: 'Wealth & Prosperity Oil', category_slug: 'oils', price: 50000, currency: 'NGN', blurb: 'Long-conjured oil sealed under intention.', intention: 'Wealth & Prosperity Oil', use_case: ['Anoint candles', 'Dress petitions', 'Charge ritual tools'] },
    { slug: 'abre-camino-oil', name: 'Abre Camino & Favour Oil', category_slug: 'oils', price: 80000, currency: 'NGN', blurb: 'Long-conjured oil sealed under intention.', intention: 'Abre Camino & Favour Oil', use_case: ['Anoint candles', 'Dress petitions', 'Charge ritual tools'] },
    { slug: 'market-boom-oil', name: 'Market Boom Oil', category_slug: 'oils', price: 54000, currency: 'NGN', blurb: 'Long-conjured oil sealed under intention.', intention: 'Market Boom Oil', use_case: ['Anoint candles', 'Dress petitions', 'Charge ritual tools'] },
    { slug: 'lady-of-luxury-conjured', name: 'Lady of Luxury (Conjured)', category_slug: 'oils', price: 73000, currency: 'NGN', blurb: 'Long-conjured oil sealed under intention.', intention: 'Lady of Luxury (Conjured)', use_case: ['Anoint candles', 'Dress petitions', 'Charge ritual tools'] },
    { slug: 'bitch-be-gone-oil', name: 'Bitch Be Gone Oil', category_slug: 'oils', price: 50000, currency: 'NGN', blurb: 'Long-conjured oil sealed under intention.', intention: 'Bitch Be Gone Oil', use_case: ['Anoint candles', 'Dress petitions', 'Charge ritual tools'] },
    { slug: 'blessing-oil', name: 'Blessing Oil', category_slug: 'oils', price: 40000, currency: 'NGN', blurb: 'Long-conjured oil sealed under intention.', intention: 'Blessing Oil', use_case: ['Anoint candles', 'Dress petitions', 'Charge ritual tools'] },
    { slug: 'protection-oil', name: 'Protection Oil', category_slug: 'oils', price: 70000, currency: 'NGN', blurb: 'Long-conjured oil sealed under intention.', intention: 'Protection Oil', use_case: ['Anoint candles', 'Dress petitions', 'Charge ritual tools'] },
    // Soaps
    { slug: 'attraction-soap', name: 'Attraction Soap', category_slug: 'soaps', price: 25000, currency: 'NGN', blurb: 'Ritual soap, charged and cured by hand.', intention: 'Attraction Soap', use_case: ['Cleansing bath', 'Daily ritual shower', 'Pair with spiritual bath'] },
    { slug: 'uncrossing-cleansing-soap', name: 'Uncrossing & Cleansing Soap', category_slug: 'soaps', price: 25000, currency: 'NGN', blurb: 'Ritual soap, charged and cured by hand.', intention: 'Uncrossing & Cleansing Soap', use_case: ['Cleansing bath', 'Daily ritual shower', 'Pair with spiritual bath'] },
    { slug: 'abre-camino-soap', name: 'Abre Camino & Favour Soap', category_slug: 'soaps', price: 50000, currency: 'NGN', blurb: 'Ritual soap, charged and cured by hand.', intention: 'Abre Camino & Favour Soap', use_case: ['Cleansing bath', 'Daily ritual shower', 'Pair with spiritual bath'] },
    { slug: 'money-drawing-soap', name: 'Money Drawing Soap', category_slug: 'soaps', price: 25000, currency: 'NGN', blurb: 'Ritual soap, charged and cured by hand.', intention: 'Money Drawing Soap', use_case: ['Cleansing bath', 'Daily ritual shower', 'Pair with spiritual bath'] },
    { slug: 'goddess-of-love-soap', name: 'Goddess of Love Soap', category_slug: 'soaps', price: 30000, currency: 'NGN', blurb: 'Ritual soap, charged and cured by hand.', intention: 'Goddess of Love Soap', use_case: ['Cleansing bath', 'Daily ritual shower', 'Pair with spiritual bath'] },
    // Baths
    { slug: 'uncrossing-bath', name: 'Uncrossing & Cleansing', category_slug: 'baths', price: 70000, currency: 'NGN', blurb: 'Made to order. Cleanse, reset, attract.', intention: 'Uncrossing & Cleansing', use_case: ['Full body bath', 'Floor wash', 'Anointing'] },
    { slug: 'abre-camino-bath', name: 'Abre Camino & Favour', category_slug: 'baths', price: 100000, currency: 'NGN', blurb: 'Made to order. Cleanse, reset, attract.', intention: 'Abre Camino & Favour', use_case: ['Full body bath', 'Floor wash', 'Anointing'] },
    { slug: 'self-love-bath', name: 'Self Love', category_slug: 'baths', price: 50000, currency: 'NGN', blurb: 'Made to order. Cleanse, reset, attract.', intention: 'Self Love', use_case: ['Full body bath', 'Floor wash', 'Anointing'] },
    { slug: 'attraction-bath', name: 'Attraction', category_slug: 'baths', price: 100000, currency: 'NGN', blurb: 'Made to order. Cleanse, reset, attract.', intention: 'Attraction', use_case: ['Full body bath', 'Floor wash', 'Anointing'] },
    { slug: 'money-cleanse-bath', name: 'Money Cleanse', category_slug: 'baths', price: 100000, currency: 'NGN', blurb: 'Made to order. Cleanse, reset, attract.', intention: 'Money Cleanse', use_case: ['Full body bath', 'Floor wash', 'Anointing'] },
    // Smudge
    { slug: 'palo-santo', name: 'Palo Santo', category_slug: 'smudge', price: 4000, currency: 'NGN', blurb: 'Hand-bundled smudge for cleansing rituals.', intention: 'Palo Santo', use_case: ['Space clearing', 'Object cleansing', 'Pre-ritual prep'] },
    { slug: 'white-sage', name: 'White Sage', category_slug: 'smudge', price: 15000, currency: 'NGN', blurb: 'Hand-bundled smudge for cleansing rituals.', intention: 'White Sage', use_case: ['Space clearing', 'Object cleansing', 'Pre-ritual prep'] },
    { slug: 'blue-sage', name: 'Blue Sage', category_slug: 'smudge', price: 15000, currency: 'NGN', blurb: 'Hand-bundled smudge for cleansing rituals.', intention: 'Blue Sage', use_case: ['Space clearing', 'Object cleansing', 'Pre-ritual prep'] },
    { slug: 'dragon-blood', name: 'Dragon Blood', category_slug: 'smudge', price: 15000, currency: 'NGN', blurb: 'Hand-bundled smudge for cleansing rituals.', intention: 'Dragon Blood', use_case: ['Space clearing', 'Object cleansing', 'Pre-ritual prep'] },
    { slug: 'cedar-smudge', name: 'Cedar', category_slug: 'smudge', price: 15000, currency: 'NGN', blurb: 'Hand-bundled smudge for cleansing rituals.', intention: 'Cedar', use_case: ['Space clearing', 'Object cleansing', 'Pre-ritual prep'] },
    { slug: 'mugwort-smudge', name: 'Mugwort', category_slug: 'smudge', price: 15000, currency: 'NGN', blurb: 'Hand-bundled smudge for cleansing rituals.', intention: 'Mugwort', use_case: ['Space clearing', 'Object cleansing', 'Pre-ritual prep'] },
    // Spell Jars (USD)
    { slug: 'academic-success-jar', name: 'Academic Success', category_slug: 'spell-jars', price: 150, currency: 'USD', blurb: 'Sealed ritual jar prepared on order.', intention: 'Academic Success', use_case: ['Keep on altar', 'Bury in earth (where appropriate)', 'Carry sealed'] },
    { slug: 'prosperity-jar', name: 'Prosperity', category_slug: 'spell-jars', price: 200, currency: 'USD', blurb: 'Sealed ritual jar prepared on order.', intention: 'Prosperity', use_case: ['Keep on altar', 'Bury in earth (where appropriate)', 'Carry sealed'] },
    { slug: 'protection-jar', name: 'Protection', category_slug: 'spell-jars', price: 250, currency: 'USD', blurb: 'Sealed ritual jar prepared on order.', intention: 'Protection', use_case: ['Keep on altar', 'Bury in earth (where appropriate)', 'Carry sealed'] },
    { slug: 'self-love-jar', name: 'Self Love', category_slug: 'spell-jars', price: 100, currency: 'USD', blurb: 'Sealed ritual jar prepared on order.', intention: 'Self Love', use_case: ['Keep on altar', 'Bury in earth (where appropriate)', 'Carry sealed'] },
    { slug: 'anxiety-jar', name: 'Anxiety', category_slug: 'spell-jars', price: 50, currency: 'USD', blurb: 'Sealed ritual jar prepared on order.', intention: 'Anxiety', use_case: ['Keep on altar', 'Bury in earth (where appropriate)', 'Carry sealed'] },
    { slug: 'abundance-jar', name: 'Abundance', category_slug: 'spell-jars', price: 250, currency: 'USD', blurb: 'Sealed ritual jar prepared on order.', intention: 'Abundance', use_case: ['Keep on altar', 'Bury in earth (where appropriate)', 'Carry sealed'] },
    { slug: 'sour-jar', name: 'Sour Jar', category_slug: 'spell-jars', price: 320, currency: 'USD', blurb: 'Sealed ritual jar prepared on order.', intention: 'Sour Jar', use_case: ['Keep on altar', 'Bury in earth (where appropriate)', 'Carry sealed'] },
  ];
  
  // Insert products with category IDs
  const productsWithCategoryIds = products.map(p => {
    const cat = categoryMap.get(p.category_slug)!;
    return {
      ...p,
      category_id: cat.id,
      description: p.blurb,
    };
  });
  
  const { error: productError } = await supabase
    .from('products')
    .upsert(productsWithCategoryIds, { onConflict: 'slug' });
  
  if (productError) {
    console.error('Error inserting products:', productError);
    process.exit(1);
  }
  
  console.log('Products inserted successfully!');
  process.exit(0);
}

seed();
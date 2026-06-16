import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const badges = [
  {
    name: 'First Purchase',
    description: 'Welcome to Witchsion! Thank you for your first order.',
    criteria: 'first_purchase',
    points: 100
  },
  {
    name: 'Community Starter',
    description: 'Made your first post in the community.',
    criteria: 'first_community_post',
    points: 50
  },
  {
    name: 'Collector',
    description: 'Ordered 5 or more products.',
    criteria: '5_orders',
    points: 250
  }
];

async function seed() {
  const { error } = await supabase.from('badges').upsert(badges);
  if (error) {
    console.error('Error seeding gamification:', error);
    process.exit(1);
  }
  console.log('Gamification seeded successfully!');
  process.exit(0);
}

seed();
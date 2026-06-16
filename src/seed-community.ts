import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const groups = [
  { slug: 'manifestation', name: 'Manifestation Circle', description: 'Share your manifestation journeys, tips, and experiences.' },
  { slug: 'energy-work', name: 'Energy Work', description: 'Discuss reiki, chakra balancing, and energy healing practices.' },
  { slug: 'tarot-divination', name: 'Tarot & Divination', description: 'Share readings, ask questions, and learn about divination tools.' },
  { slug: 'spiritual-growth', name: 'Spiritual Growth', description: 'A space for reflection, learning, and sharing your spiritual path.' },
];

async function seed() {
  const { error } = await supabase.from("community_groups").upsert(groups, { onConflict: "slug" });
  if (error) {
    console.error("Error seeding community groups:", error);
    process.exit(1);
  }
  console.log("Community groups seeded successfully!");
  process.exit(0);
}

seed();
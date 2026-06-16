// src/seed-services.ts
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const services = [
  {
    slug: "tarot-reading",
    name: "Tarot Reading",
    category: "Divination",
    description: "A 60-minute intuitive tarot reading for guidance and clarity.",
    price: 35000,
    currency: "NGN",
    duration: "60 minutes",
    is_active: true
  },
  {
    slug: "spiritual-guidance",
    name: "Spiritual Guidance Session",
    category: "Consultation",
    description: "A 90-minute session for spiritual support and direction.",
    price: 50000,
    currency: "NGN",
    duration: "90 minutes",
    is_active: true
  },
  {
    slug: "dream-interpretation",
    name: "Dream Interpretation",
    category: "Divination",
    description: "A 45-minute session to explore the meaning of your dreams.",
    price: 25000,
    currency: "NGN",
    duration: "45 minutes",
    is_active: true
  },
  {
    slug: "energy-reading",
    name: "Energy Reading",
    category: "Energy Work",
    description: "A 60-minute energy assessment and balancing session.",
    price: 40000,
    currency: "NGN",
    duration: "60 minutes",
    is_active: true
  }
];

async function seed() {
  const { error } = await supabase.from("services").upsert(services, { onConflict: "slug" });
  if (error) {
    console.error("Error seeding services:", error);
    process.exit(1);
  }
  console.log("Services seeded successfully!");
  process.exit(0);
}

seed();
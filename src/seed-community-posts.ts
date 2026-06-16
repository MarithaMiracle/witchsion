// src/seed-community-posts.ts
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  // First, let's get groups
  const { data: groups, error: groupsError } = await supabase.from('community_groups').select('id, slug');
  if (groupsError || !groups) {
    console.error('Error fetching groups:', groupsError);
    process.exit(1);
  }
  console.log('Groups found:', groups);

  // Let's get or create a test user (just need a valid UUID for user_id)
  // First check if there are any users in profiles
  const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
  let testUserId: string;
  if (profiles?.length) {
    testUserId = profiles[0].id;
  } else {
    // Create a dummy UUID if no profiles exist
    testUserId = '00000000-0000-0000-0000-000000000000';
  }
  console.log('Using test user ID:', testUserId);

  const posts = [
    {
      user_id: testUserId,
      title: 'Welcome to the community!',
      content: 'So excited to have you here! Feel free to introduce yourself and share your journey.',
      group_id: groups.find(g => g.slug === 'spiritual-growth')?.id
    },
    {
      user_id: testUserId,
      title: 'My first manifestation',
      content: 'Just wanted to share my first successful manifestation! It took time but it worked!',
      group_id: groups.find(g => g.slug === 'manifestation')?.id
    }
  ];

  const { error } = await supabase.from('community_posts').insert(posts);
  if (error) {
    console.error('Error seeding posts:', error);
    process.exit(1);
  }
  console.log('Community posts seeded successfully!');
  process.exit(0);
}

seed();
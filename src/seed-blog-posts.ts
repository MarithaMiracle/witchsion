// src/seed-blog-posts.ts
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const blogPosts = [
  {
    slug: 'introduction-to-witchcraft',
    title: 'Introduction to Witchcraft',
    excerpt: "A beginner's guide to starting your spiritual journey.",
    content: '<p>Welcome to the world of witchcraft! This post will guide you through the basics...</p><h2>What is Witchcraft?</h2><p>Witchcraft is a spiritual practice that connects you with nature and your inner self...</p>',
    type: 'blog',
    is_published: true,
    published_at: new Date().toISOString()
  },
  {
    slug: 'crystal-101',
    title: 'Crystal 101: Choosing Your First Crystal',
    excerpt: 'Learn how to pick the perfect crystal for your practice.',
    content: '<p>Crystals are powerful tools! Let’s explore how to choose your first one...</p><h2>Popular Crystals for Beginners</h2><p>Clear Quartz, Amethyst, Rose Quartz...</p>',
    type: 'blog',
    is_published: true,
    published_at: new Date(Date.now() - 86400000).toISOString() // yesterday
  },
  {
    slug: 'tarot-for-beginners',
    title: 'Tarot for Beginners: A Simple Guide',
    excerpt: 'Start your tarot journey with these easy tips.',
    content: '<p>Tarot is a wonderful tool for self-reflection...</p><h2>Major vs Minor Arcana</h2><p>Let’s break down the differences...</p>',
    type: 'blog',
    is_published: true,
    published_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
  },
  {
    slug: 'moon-magic-basics',
    title: 'Moon Magic Basics',
    excerpt: 'Learn how to work with lunar cycles.',
    content: '<p>The moon is a powerful ally in spiritual practice...</p><h2>New Moon vs Full Moon</h2><p>What each phase means for you...</p>',
    type: 'blog',
    is_published: true,
    published_at: new Date(Date.now() - 259200000).toISOString() // 3 days ago
  },
  {
    slug: 'herb-magic-101',
    title: 'Herb Magic 101',
    excerpt: 'An intro to using herbs in your practice.',
    content: '<p>Herbs have been used in magic and medicine for centuries...</p><h2>Must-Have Herbs</h2><p>Lavender, sage, rosemary, and more...</p>',
    type: 'blog',
    is_published: true,
    published_at: new Date(Date.now() - 345600000).toISOString() // 4 days ago
  }
];

async function seed() {
  for (const post of blogPosts) {
    const { error } = await supabase
      .from('content')
      .upsert(post, { onConflict: 'slug' });
    if (error) {
      console.error('Error seeding post:', post.title, error);
    } else {
      console.log('Seeded post:', post.title);
    }
  }
  process.exit(0);
}

seed();
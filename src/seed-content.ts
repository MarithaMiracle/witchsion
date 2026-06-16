import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const content = [
  {
    slug: 'introduction-to-witchcraft',
    title: 'Introduction to Witchcraft',
    excerpt: "A beginner's guide to starting your spiritual journey.",
    content: `
      <p>Welcome to the world of witchcraft! The path of the modern witch is deeply personal, rooted in nature, intuition, and intention. If you are just starting, the sheer amount of information out there can be overwhelming. Take a deep breath; your practice is yours to define.</p>
      
      <h2>What is Witchcraft?</h2>
      <p>At its core, witchcraft is a spiritual practice that connects you with the natural world and your own inner power. It isn't about flying on broomsticks or cursing your enemies—it's about energy manipulation, mindfulness, and living in alignment with the earth's cycles.</p>
      
      <blockquote>"Magic is simply the art of changing consciousness at will."</blockquote>
      
      <h2>First Steps for Beginners</h2>
      <p>Before you buy every crystal and herb you can find, focus on these foundational practices:</p>
      <ul>
        <li><strong>Meditation and Grounding:</strong> Learn to center your energy. Try standing barefoot on the earth for five minutes a day.</li>
        <li><strong>Protection:</strong> Understand how to shield your energy using visualization or simple tools like salt and black tourmaline.</li>
        <li><strong>Intention Setting:</strong> Magic requires clear focus. Practice writing down your goals clearly and concisely.</li>
      </ul>
      
      <p>Remember, there is no "wrong" way to practice as long as you are acting with respect and intention. Welcome to the journey!</p>
    `,
    type: 'blog',
    is_published: true,
    published_at: new Date().toISOString()
  },
  {
    slug: 'crystal-101',
    title: 'Crystal 101: Choosing Your First Crystal',
    excerpt: 'Learn how to pick the perfect crystal for your practice.',
    content: `
      <p>Crystals are powerful tools that hold specific vibrational frequencies. Whether you want to attract love, find focus, or protect your home, there is a stone that can help.</p>
      
      <h2>The Essential Starter Kit</h2>
      <p>If you are building your first altar, consider these versatile stones:</p>
      <ol>
        <li><strong>Clear Quartz:</strong> The master healer. It amplifies energy and can be programmed for almost any intention.</li>
        <li><strong>Amethyst:</strong> Perfect for intuition, peace, and restful sleep. Keep one by your bed!</li>
        <li><strong>Rose Quartz:</strong> The ultimate stone for unconditional love, compassion, and self-care.</li>
        <li><strong>Black Tourmaline:</strong> A must-have for protection and grounding negative energy.</li>
      </ol>
      
      <h2>How to Choose Your Crystal</h2>
      <p>Don't overthink it! Often, the crystal you need will draw you in. Notice which stones catch your eye or feel warm/tingly when you hold them. Always remember to cleanse your new crystals with smoke, moonlight, or sound before using them in spellwork.</p>
    `,
    type: 'resource',
    is_published: true,
    published_at: new Date().toISOString()
  },
  {
    slug: 'tarot-for-beginners',
    title: 'Tarot for Beginners: A Simple Guide',
    excerpt: 'Start your tarot journey with these easy tips.',
    content: `
      <p>Tarot is a wonderful tool for self-reflection and unlocking your intuition. A standard deck contains 78 cards, each rich with symbolism and archetypal meaning.</p>
      
      <h2>Major vs Minor Arcana</h2>
      <p>Let's break down the differences:</p>
      <ul>
        <li><strong>The Major Arcana (22 cards):</strong> These cards represent significant life events, spiritual lessons, and major themes. When they appear, pay attention—they carry heavy weight. (e.g., The Fool, The Lovers, The Tower).</li>
        <li><strong>The Minor Arcana (56 cards):</strong> These deal with the day-to-day aspects of life. They are divided into four suits: Cups (emotions), Wands/Batons (action/passion), Swords (intellect/conflict), and Pentacles/Coins (material world/finances).</li>
      </ul>
      
      <h2>How to Start Reading</h2>
      <p>The best way to learn is by doing. Pull a "Card of the Day" every morning. Before looking up the meaning in the guidebook, take a moment to look at the imagery. What story does the card tell you? What emotions does it evoke? Trust your gut!</p>
    `,
    type: 'blog',
    is_published: true,
    published_at: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
  },
  {
    slug: 'moon-magic-basics',
    title: 'Moon Magic Basics',
    excerpt: 'Learn how to work with lunar cycles.',
    content: `
      <p>The moon is a powerful ally in spiritual practice. Just as it controls the tides of the ocean, it affects the energetic tides of our lives. Aligning your magic with the lunar phases is an excellent way to supercharge your intentions.</p>
      
      <h2>Key Lunar Phases</h2>
      <ul>
        <li><strong>New Moon:</strong> The sky is dark. This is the time for new beginnings, setting intentions, and planting seeds for what you want to grow.</li>
        <li><strong>Waxing Moon:</strong> The moon is growing larger. Focus on action, motivation, and building momentum toward your goals.</li>
        <li><strong>Full Moon:</strong> The moon is at its peak. Energy is high! This is perfect for charging crystals, making moon water, and performing powerful manifestation spells.</li>
        <li><strong>Waning Moon:</strong> The moon is shrinking. It's time to release, banish negative energy, and let go of what no longer serves you.</li>
      </ul>
      
      <blockquote>"The moon does not apologize for the phases she must go through to become whole again."</blockquote>
    `,
    type: 'blog',
    is_published: true,
    published_at: new Date(Date.now() - 86400000 * 3).toISOString() // 3 days ago
  },
  {
    slug: 'herb-magic-101',
    title: 'Herb Magic 101',
    excerpt: 'An intro to using herbs in your practice.',
    content: `
      <p>Herbs have been used in magic and medicine for centuries. Every plant carries a unique spirit and vibration. You don't need a huge apothecary to start—in fact, your kitchen cabinet is a great place to begin!</p>
      
      <h2>Must-Have Herbs for Your Pantry</h2>
      <ul>
        <li><strong>Rosemary:</strong> An excellent all-purpose herb. It can be used for protection, cleansing, and even as a substitute for almost any other herb in a pinch.</li>
        <li><strong>Cinnamon:</strong> Great for bringing success, prosperity, and speeding up the results of your spells.</li>
        <li><strong>Lavender:</strong> Known for its calming properties, it promotes peace, restful sleep, and happiness.</li>
        <li><strong>Mint:</strong> Attracts money and protects travelers.</li>
      </ul>
      
      <h2>How to Use Them</h2>
      <p>You can incorporate herbs into your practice in many ways: dress a candle with crushed herbs, create a sealed spell jar, brew a magical tea (make sure it's edible first!), or simply carry them in a small pouch (a mojo bag) in your pocket.</p>
    `,
    type: 'blog',
    is_published: true,
    published_at: new Date(Date.now() - 86400000 * 4).toISOString() // 4 days ago
  }
];

async function seed() {
  const { error } = await supabase.from('content').upsert(content, { onConflict: 'slug' });
  if (error) {
    console.error('Error seeding content:', error);
    process.exit(1);
  }
  console.log('Content seeded successfully!');
  process.exit(0);
}

seed();
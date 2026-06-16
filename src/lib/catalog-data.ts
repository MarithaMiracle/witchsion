/** Server-safe catalog data (no Vite asset imports). */
const oilImg = "/assets/product-oil.jpg";
const jarImg = "/assets/product-spelljar.jpg";
const smudgeImg = "/assets/product-smudge.jpg";
const crystalImg = "/assets/product-crystals.jpg";
const tarotImg = "/assets/service-tarot.jpg";
export const defaultProductImage = oilImg;
export type Currency = "NGN" | "USD";

export type Product = {
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  price: number;
  currency: Currency;
  image: string;
  blurb: string;
  description: string;
  intention: string;
  use: string[];
};

export type ServiceCategory =
  | "Spell Work"
  | "Tarot Reading"
  | "Consultation";

export type Service = {
  slug: string;
  name: string;
  category: ServiceCategory;
  price?: number;
  currency?: Currency;
  duration: string;
  blurb: string;
  description: string;
  image?: string;
};

const oils: Product[] = [
  ["magick-attraction-oil", "Magick Attraction Oil", 13000, "Charged Oils"],
  ["money-drawing-oil", "Money Drawing Oil", 13000, "Charged Oils"],
  ["manifestation-oil", "Manifestation Oil", 15000, "Charged Oils"],
  ["lady-of-luxury-oil", "Lady of Luxury", 30000, "Charged Oils"],
].map(([slug, name, price, category]) => ({
  slug: slug as string,
  name: name as string,
  category: category as string,
  categorySlug: "oils",
  price: price as number,
  currency: "NGN" as const,
  image: oilImg,
  blurb: "Hand-charged ritual oil in amber glass.",
  description:
    "A small-batch oil dressed and charged by hand. Intended as a focal point for ritual practice; anoint candles, jewellery, or your skin in line with your own intentions.",
  intention: name as string,
  use: ["Anoint candles", "Dress petitions", "Wear over pulse points"],
}));

const conjuredOils: Product[] = [
  ["delilah-oil", "Delilah", 55000],
  ["wealth-prosperity-oil", "Wealth & Prosperity Oil", 50000],
  ["abre-camino-oil", "Abre Camino & Favour Oil", 80000],
  ["market-boom-oil", "Market Boom Oil", 54000],
  ["lady-of-luxury-conjured", "Lady of Luxury (Conjured)", 73000],
  ["bitch-be-gone-oil", "Bitch Be Gone Oil", 50000],
  ["blessing-oil", "Blessing Oil", 40000],
  ["protection-oil", "Protection Oil", 70000],
].map(([slug, name, price]) => ({
  slug: slug as string,
  name: name as string,
  category: "Conjured Oils",
  categorySlug: "oils",
  price: price as number,
  currency: "NGN" as const,
  image: oilImg,
  blurb: "Long-conjured oil sealed under intention.",
  description:
    "A conjured oil prepared over an extended ritual cycle. Each bottle is finished by hand and intended for focused, intentional use.",
  intention: name as string,
  use: ["Anoint candles", "Dress petitions", "Charge ritual tools"],
}));

const soaps: Product[] = [
  ["attraction-soap", "Attraction Soap", 25000],
  ["uncrossing-cleansing-soap", "Uncrossing & Cleansing Soap", 25000],
  ["abre-camino-soap", "Abre Camino & Favour Soap", 50000],
  ["money-drawing-soap", "Money Drawing Soap", 25000],
  ["goddess-of-love-soap", "Goddess of Love Soap", 30000],
].map(([slug, name, price]) => ({
  slug: slug as string,
  name: name as string,
  category: "Conjured Soaps",
  categorySlug: "soaps",
  price: price as number,
  currency: "NGN" as const,
  image: jarImg,
  blurb: "Ritual soap, charged and cured by hand.",
  description:
    "A handcrafted ritual soap, scented and charged with intention. Use in the bath or shower as part of a personal cleansing or attraction practice.",
  intention: name as string,
  use: ["Cleansing bath", "Daily ritual shower", "Pair with spiritual bath"],
}));

const baths: Product[] = [
  ["uncrossing-bath", "Uncrossing & Cleansing", 70000],
  ["abre-camino-bath", "Abre Camino & Favor", 100000],
  ["self-love-bath", "Self Love", 50000],
  ["attraction-bath", "Attraction", 100000],
  ["money-cleanse-bath", "Money Cleanse", 100000],
].map(([slug, name, price]) => ({
  slug: slug as string,
  name: name as string,
  category: "Spiritual Bath",
  categorySlug: "baths",
  price: price as number,
  currency: "NGN" as const,
  image: jarImg,
  blurb: "Made to order. Cleanse, reset, attract.",
  description:
    "A bespoke spiritual bath blended on order from herbs, oils, and salts. Includes a usage guide; one bath supports a focused cleansing cycle.",
  intention: name as string,
  use: ["Full body bath", "Floor wash", "Anointing"],
}));

const smudge: Product[] = [
  ["palo-santo", "Palo Santo", 4000],
  ["white-sage", "White Sage", 15000],
  ["blue-sage", "Blue Sage", 15000],
  ["dragon-blood", "Dragon Blood", 15000],
  ["cedar-smudge", "Cedar", 15000],
  ["mugwort-smudge", "Mugwort", 15000],
].map(([slug, name, price]) => ({
  slug: slug as string,
  name: name as string,
  category: "Smudge Sticks",
  categorySlug: "smudge",
  price: price as number,
  currency: "NGN" as const,
  image: smudgeImg,
  blurb: "Hand-bundled smudge for cleansing rituals.",
  description:
    "Traditional smudge bundle, hand-tied and dried. Burn with care in a heat-safe vessel for cleansing rituals and atmospheric work.",
  intention: name as string,
  use: ["Space clearing", "Object cleansing", "Pre-ritual prep"],
}));

const spellJars: Product[] = [
  ["academic-success-jar", "Academic Success", 150],
  ["prosperity-jar", "Prosperity", 200],
  ["protection-jar", "Protection", 250],
  ["self-love-jar", "Self Love", 100],
  ["anxiety-jar", "Anxiety", 50],
  ["abundance-jar", "Abundance", 250],
  ["sour-jar", "Sour Jar", 320],
].map(([slug, name, price]) => ({
  slug: slug as string,
  name: name as string,
  category: "Spell Jars",
  categorySlug: "spell-jars",
  price: price as number,
  currency: "USD" as const,
  image: jarImg,
  blurb: "Sealed ritual jar prepared on order.",
  description:
    "A sealed ritual jar layered with herbs, curios, and intention. Prepared on order and dispatched with handling instructions; keep in a quiet, undisturbed place.",
  intention: name as string,
  use: ["Keep on altar", "Bury in earth (where appropriate)", "Carry sealed"],
}));

const incenses: Product[] = [
  "Karmasutra",
  "Call Money",
  "Money Drawing",
  "Attract Money",
  "Meditation",
  "Money House",
  "Business Boom",
  "Good Fortune",
  "Good Luck",
  "Call Client",
  "Abre Camino",
  "Passion",
  "Exotic",
  "Love",
  "Attraction",
  "Jasmine",
  "Lavender",
].map((name) => ({
  slug: `incense-${name.toLowerCase().replace(/\s+/g, "-")}`,
  name: `${name} Incense`,
  category: "Incenses",
  categorySlug: "incenses",
  price: name === "Business Boom" || name === "Abre Camino" ? 16000 : 15000,
  currency: "NGN" as const,
  image: smudgeImg,
  blurb: "Slow-burning incense, hand-blended.",
  description:
    "Hand-blended incense in the brand's signature small-batch format. Burn on charcoal disc or in a heat-safe burner.",
  intention: name,
  use: ["Atmosphere", "Pre-ritual preparation", "Meditation"],
}));

const crystals: Product[] = [
  "Citrine",
  "Amethyst",
  "Rose Quartz",
  "Black Obsidian",
  "Black Tourmaline",
  "Tiger Eyes",
  "Clear Quartz",
  "Labradorite",
  "Moonstone",
  "Lapis Lazuli",
  "Pyrite",
  "Carnelian",
].map((name) => ({
  slug: `crystal-${name.toLowerCase().replace(/\s+/g, "-")}`,
  name,
  category: "Crystals",
  categorySlug: "crystals",
  price: 12000,
  currency: "NGN" as const,
  image: crystalImg,
  blurb: "Pendant or bracelet - chosen for resonance.",
  description: `Ethically sourced ${name.toLowerCase()} offered as pendants and bracelets. Each piece is selected and cleansed before dispatch.`,
  intention: `${name} resonance`,
  use: ["Wear as jewellery", "Carry in pocket", "Place on altar"],
}));

export const products: Product[] = [
  ...oils,
  ...conjuredOils,
  ...soaps,
  ...baths,
  ...smudge,
  ...spellJars,
  ...incenses,
  ...crystals,
];

export const categories: { slug: string; name: string; blurb: string }[] = [
  { slug: "oils", name: "Oils", blurb: "Charged & conjured anointing oils." },
  { slug: "spell-jars", name: "Spell Jars", blurb: "Sealed ritual jars, prepared on order." },
  { slug: "baths", name: "Spiritual Baths", blurb: "Bespoke baths made to order." },
  { slug: "soaps", name: "Conjured Soaps", blurb: "Ritual soaps, charged by hand." },
  { slug: "smudge", name: "Smudge Sticks", blurb: "Hand-bundled cleansing smoke." },
  { slug: "incenses", name: "Incenses", blurb: "Hand-blended small-batch incense." },
  { slug: "crystals", name: "Crystals", blurb: "Pendants & bracelets, cleansed." },
];

export const services: Service[] = [
  {
    slug: "tarot-general",
    name: "Tarot Reading - General",
    category: "Tarot Reading",
    price: 15000,
    currency: "NGN",
    duration: "30 min",
    blurb: "A broad reading on where you are now.",
    description:
      "A focused general tarot reading covering current themes, blocks, and opportunities.",
    image: tarotImg,
  },
  {
    slug: "tarot-love",
    name: "Tarot Reading - Love",
    category: "Tarot Reading",
    price: 25000,
    currency: "NGN",
    duration: "45 min",
    blurb: "A relational reading - self, partner, dynamic.",
    description:
      "An in-depth tarot reading focused on relationships and emotional dynamics.",
    image: tarotImg,
  },
  {
    slug: "tarot-ancestors",
    name: "Tarot Reading - Ancestors",
    category: "Tarot Reading",
    price: 40000,
    currency: "NGN",
    duration: "60 min",
    blurb: "Deep reading honouring ancestral guidance.",
    description:
      "An extended reading honouring ancestral themes.",
    image: tarotImg,
  },
  {
    slug: "spiritual-consultation",
    name: "Spiritual Consultation",
    category: "Consultation",
    duration: "45 min",
    blurb: "Sit with the practitioner. Pricing on request.",
    description:
      "A one-on-one spiritual consultation. We talk through your situation and discuss whether ritual work, products, or simply reflection is the right next step. Pricing varies by depth and duration.",
    image: tarotImg,
  },
  {
    slug: "spell-work-consultation",
    name: "Spell Work Consultation",
    category: "Spell Work",
    duration: "By arrangement",
    blurb: "Pricing depends on the working.",
    description:
      "Discuss spell work; attraction, protection, reflection, road opening, success and abundance, and others; with the practitioner. Pricing depends on the scope and duration of the working.",
    image: tarotImg,
  },
];

export function formatPrice(price: number, currency: Currency): string {
  if (currency === "NGN") {
    return `₦${price.toLocaleString("en-NG")}`;
  }
  return `$${price.toLocaleString("en-US")}`;
}

export function productBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function productsByCategory(categorySlug: string): Product[] {
  return products.filter((p) => p.categorySlug === categorySlug);
}

export function serviceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

export function paginateProducts<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    items: items.slice(start, end),
    total,
    page,
    pageSize,
  };
}


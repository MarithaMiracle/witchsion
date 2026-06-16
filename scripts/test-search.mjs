import Fuse from 'fuse.js';

const products = [
    { slug: 'crystal-citrine', name: 'Citrine', category: 'Crystals' },
    { slug: 'crystal-amethyst', name: 'Amethyst', category: 'Crystals' },
    { slug: 'crystal-rose-quartz', name: 'Rose Quartz', category: 'Crystals' },
    { slug: 'incense-money-drawing', name: 'Money Drawing Incense', category: 'Incenses' },
];

const fuse = new Fuse(products, {
    keys: ['slug', 'name', 'category'],
    threshold: 0.5,
    ignoreLocation: true,
    minMatchCharLength: 2,
});

const terms = ['cry', 'cryst', 'crystals', 'crystal', 'citrine'];

for (const t of terms) {
    const res = fuse.search(t).map(r => r.item.slug + '|' + r.item.name);
    console.log(t.padEnd(10), '=>', res.length ? res.join(', ') : '(no match)');
}
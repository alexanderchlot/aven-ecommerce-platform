// Idempotent seed for the sample catalog. Run with: npm run db:seed
import { db } from "./index";
import { categories, products } from "./schema";
import { unsplash } from "../lib/catalog";

const kr = (sek: number) => sek * 100; // SEK -> öre

const categorySeed = [
  {
    slug: "women",
    name: "Women",
    imageUrl: unsplash("1515886657613-9f3515b0c78f", 900),
    imageAlt: "A woman in a yellow fleece set on a sunlit court",
    sortOrder: 0,
  },
  {
    slug: "men",
    name: "Men",
    imageUrl: unsplash("1507679799987-c73779587ccf", 900),
    imageAlt: "A man in a navy suit adjusting his jacket",
    sortOrder: 1,
  },
  {
    slug: "bags",
    name: "Bags",
    imageUrl: unsplash("1553062407-98eeb64c6a62", 900),
    imageAlt: "A navy canvas backpack on a light floor",
    sortOrder: 2,
  },
  { slug: "shoes", name: "Shoes", sortOrder: 3 },
  {
    slug: "accessories",
    name: "Accessories",
    imageUrl: unsplash("1469334031218-e382a71b716b", 900),
    imageAlt: "A woman holding round sunglasses in front of her eyes",
    sortOrder: 4,
  },
];

const productSeed = [
  {
    slug: "floral-wrap-dress",
    name: "Floral Wrap Dress",
    category: "women",
    priceOre: kr(8900),
    imageUrl: unsplash("1496747611176-843222e1e57c", 800),
    imageAlt: "A cream wrap dress with a rose print",
    tag: "New",
    stockQuantity: 14,
    description:
      "A fluid wrap dress in a soft rose print. The tie waist defines the silhouette and the skirt moves easily.",
    details: [
      "Viscose crepe, fully lined",
      "Tie waist with a wrap front",
      "Midi length",
      "Made in Portugal",
    ],
  },
  {
    slug: "camel-wool-coat",
    name: "Camel Wool Coat",
    category: "men",
    priceOre: kr(14500),
    imageUrl: unsplash("1552374196-1ab2a1c593e8", 800),
    imageAlt: "A man seated in a camel coat and white tee",
    tag: "New",
    stockQuantity: 6,
    description:
      "A relaxed, double-faced wool overcoat in warm camel. Cut with a soft shoulder and a long, easy line.",
    details: [
      "100% virgin wool",
      "Double-faced, unlined",
      "Two front pockets",
      "Dry clean only",
    ],
  },
  {
    slug: "blush-chain-bag",
    name: "Blush Chain Shoulder Bag",
    category: "bags",
    priceOre: kr(11200),
    imageUrl: unsplash("1566150905458-1bf1fc113f0d", 800),
    imageAlt: "A pink leather shoulder bag with a silver chain",
    tag: null,
    stockQuantity: 4,
    description:
      "A structured leather shoulder bag in blush with a contrast chevron. Wear it on the chain or carry it by hand.",
    details: [
      "Smooth calf leather",
      "Silver-tone chain strap",
      "Magnetic flap closure",
      "Interior slip pocket",
    ],
  },
  {
    slug: "floral-satin-pumps",
    name: "Floral Satin Pumps",
    category: "shoes",
    priceOre: kr(7400),
    imageUrl: unsplash("1543163521-1bf539c55dd2", 800),
    imageAlt: "Blue floral satin high-heeled pumps",
    tag: null,
    stockQuantity: 9,
    description:
      "Pointed-toe pumps in printed satin with a slim heel, finished by hand in small batches.",
    details: [
      "Printed satin upper",
      "Leather lining and sole",
      "85mm heel",
      "Made in Italy",
    ],
  },
  {
    slug: "knit-fringe-poncho",
    name: "Knit Fringe Poncho",
    category: "women",
    priceOre: kr(5600),
    imageUrl: unsplash("1434389677669-e08b4cac3105", 800),
    imageAlt: "A cream knitted poncho with fringe on a hanger",
    tag: null,
    stockQuantity: 11,
    description:
      "An open-knit poncho with a fringed hem. Layer it over a tee in spring or over knitwear in autumn.",
    details: [
      "Cotton-blend open knit",
      "One size",
      "Fringed hem",
      "Hand wash cold",
    ],
  },
  {
    slug: "sage-cotton-tee",
    name: "Sage Cotton Tee",
    category: "men",
    priceOre: kr(1200),
    imageUrl: unsplash("1523381210434-271e8be1f52b", 800),
    imageAlt: "Sage green t-shirts on wooden hangers",
    tag: null,
    stockQuantity: 0,
    description:
      "A heavyweight cotton tee in washed sage, cut with a slightly boxy fit and a clean neckline.",
    details: [
      "100% organic cotton",
      "Heavyweight jersey",
      "Relaxed fit",
      "Machine wash cold",
    ],
  },
  {
    slug: "navy-tailored-suit",
    name: "Navy Tailored Suit",
    category: "men",
    priceOre: kr(19800),
    imageUrl: unsplash("1617137968427-85924c800a22", 800),
    imageAlt: "A man in a navy suit with a white shirt",
    tag: null,
    stockQuantity: 3,
    description:
      "A navy two-piece suit with a clean, structured shoulder and a trouser that tapers softly at the ankle.",
    details: [
      "Wool-blend twill",
      "Half-canvassed jacket",
      "Notch lapel, two buttons",
      "Dry clean only",
    ],
  },
  {
    slug: "everyday-backpack",
    name: "Everyday Backpack",
    category: "bags",
    priceOre: kr(4300),
    imageUrl: unsplash("1553062407-98eeb64c6a62", 800),
    imageAlt: "A navy canvas backpack on a light floor",
    tag: null,
    stockQuantity: 23,
    description:
      "A water-resistant canvas backpack with a padded laptop sleeve and a quiet, minimal profile.",
    details: [
      "Recycled canvas",
      "Padded 15\" laptop sleeve",
      "Two-way zip",
      "Adjustable straps",
    ],
  },
];

async function main() {
  const categoryIds = new Map<string, number>();

  for (const c of categorySeed) {
    const [row] = await db
      .insert(categories)
      .values(c)
      .onConflictDoUpdate({ target: categories.slug, set: c })
      .returning({ id: categories.id, slug: categories.slug });
    categoryIds.set(row.slug, row.id);
  }

  for (const { category, ...p } of productSeed) {
    const categoryId = categoryIds.get(category);
    if (!categoryId) throw new Error(`Unknown category: ${category}`);
    const values = { ...p, categoryId };
    await db
      .insert(products)
      .values(values)
      .onConflictDoUpdate({ target: products.slug, set: values });
  }

  console.log(
    `Seeded ${categorySeed.length} categories and ${productSeed.length} products.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { PrismaClient, ProductCondition, ProductStatus, Rarity, Gender, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SALT_ROUNDS = 10

async function main(): Promise<void> {
  console.log('🌱  Seeding database…')

  // ── Passwords ─────────────────────────────────────────────────────────────────
  const adminHash  = await bcrypt.hash('Admin@123',  SALT_ROUNDS)
  const vendorHash = await bcrypt.hash('Vendor@123', SALT_ROUNDS)

  // ── Categories ────────────────────────────────────────────────────────────────
  const [catTops, catBottoms, catDresses, catOuterwear] = await Promise.all([
    prisma.category.upsert({ where: { slug: 'tops' },      update: {}, create: { name: 'Tops',      slug: 'tops' } }),
    prisma.category.upsert({ where: { slug: 'bottoms' },   update: {}, create: { name: 'Bottoms',   slug: 'bottoms' } }),
    prisma.category.upsert({ where: { slug: 'dresses' },   update: {}, create: { name: 'Dresses',   slug: 'dresses' } }),
    prisma.category.upsert({ where: { slug: 'outerwear' }, update: {}, create: { name: 'Outerwear', slug: 'outerwear' } }),
  ])
  console.log('✅  Categories')

  // ── Admin ─────────────────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where:  { email: 'admin@thriftbazaar.in' },
    update: {},
    create: {
      email:        'admin@thriftbazaar.in',
      phone:        '9000000001',
      passwordHash: adminHash,
      role:         UserRole.ADMIN,
      isVerified:   true,
      isActive:     true,
    },
  })
  console.log('✅  Admin user  —  admin@thriftbazaar.in / Admin@123')

  // ── Vendor helpers ────────────────────────────────────────────────────────────
  async function makeVendor(opts: {
    email:       string
    phone:       string
    displayName: string
    bio:         string
    storeName:   string
    storeSlug:   string
    storeDesc:   string
    city:        string
    state:       string
    styleTags:   string[]
    bannerColor: string
    dropSchedule:string
  }) {
    const user = await prisma.user.upsert({
      where:  { email: opts.email },
      update: {},
      create: {
        email:        opts.email,
        phone:        opts.phone,
        passwordHash: vendorHash,
        role:         UserRole.VENDOR,
        isVerified:   true,
        isActive:     true,
      },
    })

    const vendor = await prisma.vendor.upsert({
      where:  { userId: user.id },
      update: {},
      create: {
        userId:      user.id,
        displayName: opts.displayName,
        bio:         opts.bio,
        isApproved:  true,
        isActive:    true,
      },
    })

    const store = await prisma.store.upsert({
      where:  { vendorId: vendor.id },
      update: {},
      create: {
        vendorId:     vendor.id,
        name:         opts.storeName,
        slug:         opts.storeSlug,
        description:  opts.storeDesc,
        city:         opts.city,
        state:        opts.state,
        styleTags:    opts.styleTags,
        bannerColor:  opts.bannerColor,
        dropSchedule: opts.dropSchedule,
        isActive:     true,
        isApproved:   true,
      },
    })

    return { user, vendor, store }
  }

  // ── Vendor 1 — Retro Raj (Mumbai) ─────────────────────────────────────────────
  const v1 = await makeVendor({
    email:        'retro.raj@example.com',
    phone:        '9000000002',
    displayName:  'Retro Raj',
    bio:          'Curating the best Y2K and 90s vintage finds from across India. Every piece hand-picked from Chor Bazaar, Sarojini and beyond.',
    storeName:    "Retro Raj's Closet",
    storeSlug:    'retro-rajs-closet',
    storeDesc:    "Mumbai's go-to for 90s and Y2K vintage. Levi's, Tommy, Nike — the real deal, not replicas.",
    city:         'Mumbai',
    state:        'Maharashtra',
    styleTags:    ['Vintage', 'Y2K', 'Streetwear'],
    bannerColor:  '#4C1D95',
    dropSchedule: 'Every Friday 7 PM IST',
  })
  console.log('✅  Vendor 1 — Retro Raj')

  // ── Vendor 2 — Priya Mehta (Delhi) ────────────────────────────────────────────
  const v2 = await makeVendor({
    email:        'priya.vintage@example.com',
    phone:        '9000000003',
    displayName:  'Priya Mehta',
    bio:          'Boho soul, sustainable wardrobe. Specialising in Indian labels, Indo-Western and slow fashion at its best.',
    storeName:    "Priya's Pre-loved Picks",
    storeSlug:    'priya-preloved-picks',
    storeDesc:    'Delhi-based boho closet. Indian labels, earthy tones, and gentle fashion with a story.',
    city:         'Delhi',
    state:        'Delhi',
    styleTags:    ['Boho', 'Indo-Western', 'Cottagecore'],
    bannerColor:  '#D97706',
    dropSchedule: 'Every Monday 6 PM IST',
  })
  console.log('✅  Vendor 2 — Priya Mehta')

  // ── Vendor 3 — The Thrift Trunk (Bengaluru) ────────────────────────────────────
  const v3 = await makeVendor({
    email:        'thrift.trunk@example.com',
    phone:        '9000000004',
    displayName:  'The Thrift Trunk',
    bio:          "Bengaluru's grunge and streetwear archive. Rare 80s and 90s pieces sourced from estate sales and collector markets all over India.",
    storeName:    'The Thrift Trunk',
    storeSlug:    'the-thrift-trunk',
    storeDesc:    'Grunge, streetwear, and rare 80s/90s finds. Adidas, Nike, and forgotten Indian gems.',
    city:         'Bengaluru',
    state:        'Karnataka',
    styleTags:    ['Grunge', 'Streetwear', '90s'],
    bannerColor:  '#1C1917',
    dropSchedule: 'Bi-weekly on Sundays',
  })
  console.log('✅  Vendor 3 — The Thrift Trunk')

  // ── Products ──────────────────────────────────────────────────────────────────
  type ProductSeed = {
    vendorId:      string
    storeId:       string
    categoryId:    string
    title:         string
    slug:          string
    description:   string
    originalPrice: number
    sellingPrice:  number
    condition:     ProductCondition
    rarity:        Rarity
    gender:        Gender
    status:        ProductStatus
    isAvailable:   boolean
    city:          string
    brand:         string | null
    size:          string | null
    fabric:        string | null
    era:           string | null
    color:         string[]
    style:         string[]
    tags:          string[]
    images:        string[]
    defects:       string | null
    visibleSpots:  string | null
    measurements:  Record<string, string> | null
    views:         number
  }

  const products: ProductSeed[] = [
    // ── Retro Raj (4 products) ────────────────────────────────────────────────
    {
      vendorId:      v1.vendor.id,
      storeId:       v1.store.id,
      categoryId:    catBottoms.id,
      title:         "Levi's 501 Straight Leg Jeans",
      slug:          'levis-501-straight-leg-jeans-mumbai',
      description:   "Authentic 501s from the early 90s — button fly, straight leg, high waist. Barely worn. Sourced from a collector in Bandra. These are the real deal, not the modern slim cut. The denim has that perfect rigid feel that only years of authentic indigo dyeing gives you.",
      originalPrice: 4500,
      sellingPrice:  1299,
      condition:     ProductCondition.LIKE_NEW,
      rarity:        Rarity.VINTAGE_RARE,
      gender:        Gender.UNISEX,
      status:        ProductStatus.ACTIVE,
      isAvailable:   true,
      city:          'Mumbai',
      brand:         "Levi's",
      size:          '32W × 30L',
      fabric:        '100% Cotton Denim',
      era:           '90s',
      color:         ['Blue'],
      style:         ['Vintage', 'Y2K', 'Streetwear'],
      tags:          ['denim', '501', 'high-waist', 'vintage-jeans', 'levis'],
      images: [
        'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80',
        'https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=600&q=80',
      ],
      defects:       null,
      visibleSpots:  null,
      measurements:  { waist: '32 inches', inseam: '30 inches', rise: '12 inches', thigh: '22 inches' },
      views:         312,
    },
    {
      vendorId:      v1.vendor.id,
      storeId:       v1.store.id,
      categoryId:    catTops.id,
      title:         'Tommy Hilfiger Striped Rugby Polo',
      slug:          'tommy-hilfiger-rugby-polo-90s-mumbai',
      description:   "Iconic Tommy Hilfiger rugby polo from the late 90s. Red, white and navy broad stripe with the classic flag logo embroidered on the left chest. The kind of polo that started the whole prep-to-street crossover. 100% original — you can see the woven Hilfiger label at the collar.",
      originalPrice: 3999,
      sellingPrice:  899,
      condition:     ProductCondition.GOOD,
      rarity:        Rarity.RARE,
      gender:        Gender.MEN,
      status:        ProductStatus.ACTIVE,
      isAvailable:   true,
      city:          'Mumbai',
      brand:         'Tommy Hilfiger',
      size:          'L',
      fabric:        '100% Cotton Piqué',
      era:           '90s',
      color:         ['White', 'Red', 'Blue'],
      style:         ['Vintage', 'Streetwear', 'Y2K'],
      tags:          ['polo', 'tommy-hilfiger', 'rugby', 'preppy', '90s'],
      images: [
        'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600&q=80',
      ],
      defects:       null,
      visibleSpots:  'Slight fading at collar edges — adds patina',
      measurements:  { chest: '44 inches', length: '28 inches', shoulder: '18 inches' },
      views:         178,
    },
    {
      vendorId:      v1.vendor.id,
      storeId:       v1.store.id,
      categoryId:    catOuterwear.id,
      title:         'Nike Windrunner Track Jacket',
      slug:          'nike-windrunner-track-jacket-90s-mumbai',
      description:   "Classic Nike Windrunner in the iconic black and white chevron colourblock. Lightweight ripstop shell, full-zip front, two hand pockets. One of the most recognisable athletic jackets ever made — this one is in excellent shape with zero fading on the Swoosh.",
      originalPrice: 6000,
      sellingPrice:  1599,
      condition:     ProductCondition.LIKE_NEW,
      rarity:        Rarity.RARE,
      gender:        Gender.UNISEX,
      status:        ProductStatus.ACTIVE,
      isAvailable:   true,
      city:          'Mumbai',
      brand:         'Nike',
      size:          'M',
      fabric:        '100% Ripstop Nylon',
      era:           '90s',
      color:         ['Black', 'White'],
      style:         ['Streetwear', 'Vintage', 'Y2K'],
      tags:          ['track-jacket', 'windrunner', 'nike', 'athletic', 'chevron'],
      images: [
        'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&q=80',
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80',
      ],
      defects:       null,
      visibleSpots:  null,
      measurements:  { chest: '40 inches', length: '26 inches', sleeve: '24 inches' },
      views:         245,
    },
    {
      vendorId:      v1.vendor.id,
      storeId:       v1.store.id,
      categoryId:    catBottoms.id,
      title:         'Wrangler High-Waist Denim Mini Skirt',
      slug:          'wrangler-high-waist-denim-skirt-y2k-mumbai',
      description:   "Y2K-era Wrangler mini in classic mid-wash denim. Five-button front placket, two back pockets, raw hem finish. Exactly the kind of piece that defined early-2000s street style — and exactly what every vintage hunt is looking for.",
      originalPrice: 2200,
      sellingPrice:  749,
      condition:     ProductCondition.GOOD,
      rarity:        Rarity.UNCOMMON,
      gender:        Gender.WOMEN,
      status:        ProductStatus.ACTIVE,
      isAvailable:   true,
      city:          'Mumbai',
      brand:         'Wrangler',
      size:          'S',
      fabric:        '99% Cotton, 1% Elastane',
      era:           'Y2K',
      color:         ['Blue'],
      style:         ['Y2K', 'Vintage'],
      tags:          ['denim-skirt', 'mini', 'wrangler', 'y2k', 'high-waist'],
      images: [
        'https://images.unsplash.com/photo-1583496661160-fb5218c5b3db?w=600&q=80',
      ],
      defects:       'Minor thread pull on left back pocket — not visible when worn',
      visibleSpots:  null,
      measurements:  { waist: '26 inches', length: '14 inches', hips: '34 inches' },
      views:         167,
    },

    // ── Priya's Pre-loved Picks (3 products) ──────────────────────────────────
    {
      vendorId:      v2.vendor.id,
      storeId:       v2.store.id,
      categoryId:    catTops.id,
      title:         'Fab India Hand Block-Print Cotton Kurta',
      slug:          'fab-india-block-print-kurta-delhi',
      description:   "Hand block-printed kurta from Fab India — bought in 2023, worn twice. Jaipur-style orange and ecru print on 100% handloom cotton. Breathable, easy to style, and completely sustainably made. Tags still attached.",
      originalPrice: 1799,
      sellingPrice:  499,
      condition:     ProductCondition.NEW_WITH_TAGS,
      rarity:        Rarity.COMMON,
      gender:        Gender.WOMEN,
      status:        ProductStatus.ACTIVE,
      isAvailable:   true,
      city:          'Delhi',
      brand:         'Fab India',
      size:          'M',
      fabric:        '100% Handloom Cotton',
      era:           '2020s',
      color:         ['Orange', 'White'],
      style:         ['Boho', 'Indo-Western'],
      tags:          ['kurta', 'block-print', 'cotton', 'fab-india', 'ethnic', 'sustainable'],
      images: [
        'https://images.unsplash.com/photo-1583846552845-5d07f79e6e9b?w=600&q=80',
        'https://images.unsplash.com/photo-1594938298603-c8148c4b1e5d?w=600&q=80',
      ],
      defects:       null,
      visibleSpots:  null,
      measurements:  { length: '42 inches', bust: '38 inches', sleeve: '24 inches' },
      views:         89,
    },
    {
      vendorId:      v2.vendor.id,
      storeId:       v2.store.id,
      categoryId:    catDresses.id,
      title:         'FabAlley Floral Boho Midi Dress',
      slug:          'fabally-floral-boho-midi-dress-delhi',
      description:   "Dreamy FabAlley midi with all-over pink and sage floral print on viscose crepe. Smocked back for a flexible fit, flutter sleeves, V-neck. Worn once for a photoshoot. The fabric drapes beautifully and feels incredibly light.",
      originalPrice: 2999,
      sellingPrice:  899,
      condition:     ProductCondition.LIKE_NEW,
      rarity:        Rarity.UNCOMMON,
      gender:        Gender.WOMEN,
      status:        ProductStatus.ACTIVE,
      isAvailable:   true,
      city:          'Delhi',
      brand:         'FabAlley',
      size:          'S',
      fabric:        '100% Viscose Crepe',
      era:           '2020s',
      color:         ['Pink', 'Green'],
      style:         ['Boho', 'Cottagecore'],
      tags:          ['midi-dress', 'floral', 'boho', 'fabally', 'summer', 'cottagecore'],
      images: [
        'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80',
        'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=600&q=80',
      ],
      defects:       null,
      visibleSpots:  null,
      measurements:  { bust: '34 inches', length: '48 inches', waist: '27 inches' },
      views:         134,
    },
    {
      vendorId:      v2.vendor.id,
      storeId:       v2.store.id,
      categoryId:    catDresses.id,
      title:         'Biba Embroidered Anarkali Suit Set',
      slug:          'biba-embroidered-anarkali-suit-delhi',
      description:   "Stunning Biba Anarkali in deep violet art silk with gold zari embroidery at the yoke and hem. Full set: long Anarkali kameez, matching churidar and embroidered dupatta. Worn exactly once at a family wedding — kept with care since.",
      originalPrice: 5500,
      sellingPrice:  1499,
      condition:     ProductCondition.GOOD,
      rarity:        Rarity.RARE,
      gender:        Gender.WOMEN,
      status:        ProductStatus.ACTIVE,
      isAvailable:   true,
      city:          'Delhi',
      brand:         'Biba',
      size:          'M',
      fabric:        'Art Silk with Zari Embroidery',
      era:           '2010s',
      color:         ['Purple'],
      style:         ['Indo-Western', 'Boho'],
      tags:          ['anarkali', 'ethnic', 'biba', 'wedding', 'embroidered', 'festive'],
      images: [
        'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600&q=80',
      ],
      defects:       null,
      visibleSpots:  'Faint crease marks on dupatta — will steam out easily',
      measurements:  { bust: '38 inches', waist: '32 inches', length: '56 inches' },
      views:         203,
    },

    // ── The Thrift Trunk (3 products) ─────────────────────────────────────────
    {
      vendorId:      v3.vendor.id,
      storeId:       v3.store.id,
      categoryId:    catOuterwear.id,
      title:         'Adidas Originals Trefoil Windbreaker',
      slug:          'adidas-originals-trefoil-windbreaker-bengaluru',
      description:   "All-black Adidas Originals windbreaker with embossed silver Trefoil. Lightweight, packable into its own pocket, barely worn. Found at a collector's market in Coorg — had one owner before me who bought it at a Tokyo flea market in the 90s.",
      originalPrice: 7000,
      sellingPrice:  1899,
      condition:     ProductCondition.LIKE_NEW,
      rarity:        Rarity.RARE,
      gender:        Gender.UNISEX,
      status:        ProductStatus.ACTIVE,
      isAvailable:   true,
      city:          'Bengaluru',
      brand:         'Adidas',
      size:          'L',
      fabric:        '100% Recycled Polyester',
      era:           '90s',
      color:         ['Black'],
      style:         ['Streetwear', 'Vintage', '90s'],
      tags:          ['adidas', 'windbreaker', 'trefoil', 'streetwear', 'jacket', 'originals'],
      images: [
        'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=600&q=80',
        'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80',
      ],
      defects:       null,
      visibleSpots:  null,
      measurements:  { chest: '46 inches', length: '28 inches', sleeve: '25 inches' },
      views:         289,
    },
    {
      vendorId:      v3.vendor.id,
      storeId:       v3.store.id,
      categoryId:    catTops.id,
      title:         'Nirvana Bootleg Tee — In Utero Era',
      slug:          'nirvana-bootleg-band-tee-1994-bengaluru',
      description:   "Rare bootleg Nirvana tee from the 1993–94 In Utero touring era. All-over angel-print graphic, heavyweight cotton jersey, washed to a perfect vintage softness. An actual piece of 90s grunge history — not a modern reprint, the faded label and heavyweight construction confirm the era.",
      originalPrice: 1200,
      sellingPrice:  599,
      condition:     ProductCondition.FAIR,
      rarity:        Rarity.VINTAGE_RARE,
      gender:        Gender.UNISEX,
      status:        ProductStatus.ACTIVE,
      isAvailable:   true,
      city:          'Bengaluru',
      brand:         null,
      size:          'XL',
      fabric:        '100% Heavyweight Cotton (pre-shrunk)',
      era:           '90s',
      color:         ['Black'],
      style:         ['Grunge', 'Vintage', 'Streetwear'],
      tags:          ['band-tee', 'nirvana', 'grunge', 'bootleg', '90s', 'music-tee'],
      images: [
        'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=80',
      ],
      defects:       'Small pit stain under left arm — not visible with arm at side',
      visibleSpots:  'Print crackling at centre chest — expected with age, adds authenticity',
      measurements:  { chest: '48 inches', length: '29 inches', shoulder: '20 inches' },
      views:         421,
    },
    {
      vendorId:      v3.vendor.id,
      storeId:       v3.store.id,
      categoryId:    catOuterwear.id,
      title:         'United Colors of Benetton Wool Blazer',
      slug:          'benetton-wool-blazer-80s-bengaluru',
      description:   "80s Benetton structured blazer in warm camel-brown wool blend. Single-breasted, two-button, fully lined with a grosgrain brand ribbon. A wardrobe classic sourced from a Bengaluru estate sale — the kind of quality that simply isn't made anymore at any price point.",
      originalPrice: 9000,
      sellingPrice:  2499,
      condition:     ProductCondition.LIKE_NEW,
      rarity:        Rarity.VINTAGE_RARE,
      gender:        Gender.MEN,
      status:        ProductStatus.ACTIVE,
      isAvailable:   true,
      city:          'Bengaluru',
      brand:         'United Colors of Benetton',
      size:          '42',
      fabric:        '80% Wool, 20% Polyester',
      era:           '80s',
      color:         ['Brown'],
      style:         ['Vintage', 'Minimalist'],
      tags:          ['blazer', 'wool', 'benetton', '80s', 'structured', 'classic', 'tailored'],
      images: [
        'https://images.unsplash.com/photo-1598522325074-042db73aa4e6?w=600&q=80',
        'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80',
      ],
      defects:       null,
      visibleSpots:  null,
      measurements:  { chest: '42 inches', shoulder: '18 inches', length: '30 inches', sleeve: '25 inches' },
      views:         156,
    },
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where:  { slug: p.slug },
      update: {},
      create: p,
    })
  }
  console.log(`✅  ${products.length} products`)

  console.log('\n🎉  Seed complete!\n')
  console.log('Credentials')
  console.log('  Admin  → admin@thriftbazaar.in        / Admin@123')
  console.log('  Vendor → retro.raj@example.com        / Vendor@123')
  console.log('  Vendor → priya.vintage@example.com    / Vendor@123')
  console.log('  Vendor → thrift.trunk@example.com     / Vendor@123')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err: unknown) => {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  })

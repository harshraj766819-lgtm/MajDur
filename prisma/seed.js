const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const CATEGORIES = [
  {
    name: "Electrician",
    slug: "electrician",
    description: "Domestic and commercial electrical installations, repair, and wiring",
    icon: "Zap",
    baseDailyRate: 850,
  },
  {
    name: "Plumber",
    slug: "plumber",
    description: "Piping, sanitary installations, drainage, and water supply fittings",
    icon: "Wrench",
    baseDailyRate: 800,
  },
  {
    name: "Mason",
    slug: "mason",
    description: "Brick laying, plastering, stone work, and construction masonry",
    icon: "Layers",
    baseDailyRate: 950,
  },
  {
    name: "Carpenter",
    slug: "carpenter",
    description: "Woodworking, furniture assembly, doors, windows, and framing",
    icon: "Hammer",
    baseDailyRate: 900,
  },
  {
    name: "Painter",
    slug: "painter",
    description: "Interior and exterior wall painting, texture coating, and waterproofing",
    icon: "Paintbrush",
    baseDailyRate: 750,
  },
  {
    name: "Welder",
    slug: "welder",
    description: "Metal fabrication, structural welding, grill gates, and ironwork",
    icon: "Flame",
    baseDailyRate: 900,
  },
  {
    name: "Labourer",
    slug: "labourer",
    description: "General daily wage construction helper, loading, and digging",
    icon: "Users",
    baseDailyRate: 550,
  },
  {
    name: "Tile & Marble Worker",
    slug: "tile-marble",
    description: "Floor and wall tiling, granite cutting, marble polishing",
    icon: "HardHat",
    baseDailyRate: 1000,
  },
];

async function main() {
  console.log("🌱 Starting MajDur database seed...");

  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    console.log(`✓ Seeded category: ${cat.name}`);
  }

  // Create default Admin User if not exists
  const adminHashedPassword = await bcrypt.hash("Admin@MajDur2026", 10);
  const adminUser = await prisma.user.upsert({
    where: { phone: "9876543210" },
    update: {},
    create: {
      name: "MajDur Super Admin",
      email: "admin@majdur.in",
      phone: "9876543210",
      password: adminHashedPassword,
      role: "ADMIN",
      isPhoneVerified: true,
      isEmailVerified: true,
    },
  });
  console.log(`✓ Seeded Admin user: ${adminUser.email} (Phone: ${adminUser.phone})`);

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

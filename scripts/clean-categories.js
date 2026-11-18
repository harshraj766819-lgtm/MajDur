const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { PrismaClient } = require(path.resolve(__dirname, "../backend/node_modules/@prisma/client"));
const prisma = new PrismaClient();

const ACTIVE_SLUGS = [
  "construction-labour", "mason", "electrician", "plumber", "carpenter",
  "painter", "welder", "tile-worker", "pop-worker", "false-ceiling-worker",
  "bar-bender", "shuttering-worker", "helper", "housekeeping", "ac-technician",
  "refrigerator-technician", "cctv-technician", "solar-technician", "machine-operator",
  "fabricator", "glass-worker", "aluminium-worker", "waterproofing-worker", "roofer",
  "flooring-worker", "interior-worker", "gardner", "pest-control-worker", "driver",
  "security-guard", "heavy-equipment-operator", "general-maintenance-worker"
];

async function syncCategories() {
  // Mark non-matching categories as isActive: false or remove them if unreferenced
  const allCats = await prisma.category.findMany();
  console.log("Current total categories in DB:", allCats.length);

  for (const cat of allCats) {
    if (!ACTIVE_SLUGS.includes(cat.slug)) {
      // Check if any worker is using it
      const workers = await prisma.workerProfile.count({ where: { categoryId: cat.id } });
      if (workers === 0) {
        await prisma.category.delete({ where: { id: cat.id } });
        console.log(`Deleted legacy category: ${cat.name} (${cat.slug})`);
      } else {
        await prisma.category.update({ where: { id: cat.id }, data: { isActive: false } });
        console.log(`Deactivated legacy category: ${cat.name} (${cat.slug})`);
      }
    } else {
      await prisma.category.update({
        where: { id: cat.id },
        data: { isActive: true, displayOrder: ACTIVE_SLUGS.indexOf(cat.slug) + 1 }
      });
    }
  }

  const activeCount = await prisma.category.count({ where: { isActive: true } });
  console.log("Active 32 categories confirmed in DB:", activeCount);
  await prisma.$disconnect();
}

syncCategories();


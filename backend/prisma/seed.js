const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const CATEGORIES = [
  // Construction and Labour
  { name: "General Labour", hindiName: "सामान्य मजदूर", slug: "general-labour", description: "Loading, unloading, site clearing, digging, helper tasks", baseDailyRate: 550, icon: "Users" },
  { name: "Construction Helper", hindiName: "कंस्ट्रक्शन हेल्पर", slug: "construction-helper", description: "Material handling, cement mixing, scaffolding support", baseDailyRate: 600, icon: "HardHat" },
  { name: "Mason", hindiName: "राज मिस्त्री", slug: "mason", description: "Brickwork, foundation, concrete casting, plastering", baseDailyRate: 950, icon: "Layers" },
  { name: "Bricklayer", hindiName: "ईंट जोड़ने वाला", slug: "bricklayer", description: "Precision brick masonry and boundary wall building", baseDailyRate: 900, icon: "Layers" },
  { name: "Carpenter", hindiName: "बढ़ई", slug: "carpenter", description: "Furniture fabrication, doors, window frames, wood polishing", baseDailyRate: 900, icon: "Hammer" },
  { name: "Electrician", hindiName: "इलेक्ट्रीशियन", slug: "electrician", description: "Domestic & commercial wiring, MCB setup, switchboards", baseDailyRate: 850, icon: "Zap" },
  { name: "Plumber", hindiName: "प्लम्बर", slug: "plumber", description: "Water pipeline, drainage, sanitary fitting, leakage repair", baseDailyRate: 800, icon: "Wrench" },
  { name: "Painter", hindiName: "पेंटर", slug: "painter", description: "Wall putty, primer, interior/exterior paint, texture", baseDailyRate: 750, icon: "Paintbrush" },
  { name: "Welder", hindiName: "वेल्डर", slug: "welder", description: "Metal fabrication, iron grills, safety gates, ARC/MIG welding", baseDailyRate: 900, icon: "Flame" },
  { name: "Tile Worker", hindiName: "टाइल कारीगर", slug: "tile-worker", description: "Floor tiles, granite installation, marble polishing", baseDailyRate: 1000, icon: "Layers" },
  { name: "Shuttering Worker", hindiName: "शटरिंग मिस्त्री", slug: "shuttering-worker", description: "Column, beam & slab formwork shuttering", baseDailyRate: 950, icon: "Hammer" },
  { name: "Steel Fixer", hindiName: "सरिया बांधने वाला", slug: "steel-fixer", description: "Rebar cutting, bending and slab tying", baseDailyRate: 900, icon: "Flame" },
  { name: "Roofing Worker", hindiName: "छत कारीगर", slug: "roofing-worker", description: "Tin shed, waterproof roofing and tile roofs", baseDailyRate: 900, icon: "HardHat" },
  { name: "Civil Technician", hindiName: "सिविल तकनीशियन", slug: "civil-technician", description: "Site measurement, levels, survey and structural assistance", baseDailyRate: 1200, icon: "Briefcase" },
  { name: "Flooring Worker", hindiName: "फ्लोरिंग कारीगर", slug: "flooring-worker", description: "Kota stone, vitrified tile and epoxy flooring", baseDailyRate: 950, icon: "Layers" },
  { name: "Site Supervisor", hindiName: "साइट सुपरवाइजर", slug: "site-supervisor", description: "Daily labor coordination, material audits, quality checks", baseDailyRate: 1400, icon: "HardHat" },

  // Home Services
  { name: "House Cleaning", hindiName: "घर की सफाई", slug: "house-cleaning", description: "Standard home sweeping, mopping, dusting", baseDailyRate: 600, icon: "Sparkles" },
  { name: "Deep Cleaning", hindiName: "गहरी सफाई", slug: "deep-cleaning", description: "Kitchen & bathroom deep scrub, acid wash, sanitization", baseDailyRate: 800, icon: "Sparkles" },
  { name: "AC Repair", hindiName: "एसी रिपेयर", slug: "ac-repair", description: "Split & window AC servicing, gas refill, PCB repair", baseDailyRate: 900, icon: "Wrench" },
  { name: "Refrigerator Repair", hindiName: "फ्रिज रिपेयर", slug: "refrigerator-repair", description: "Compressor check, thermostat, cooling coil issues", baseDailyRate: 800, icon: "Wrench" },
  { name: "Washing Machine Repair", hindiName: "वाशिंग मशीन रिपेयर", slug: "washing-machine-repair", description: "Motor replacement, drainage drum servicing", baseDailyRate: 800, icon: "Wrench" },
  { name: "Gardening", hindiName: "माली / बागवानी", slug: "gardening", description: "Plant care, lawn mowing, pruning, soil preparation", baseDailyRate: 600, icon: "Scissors" },
  { name: "Pest Control", hindiName: "पेस्ट कंट्रोल", slug: "pest-control", description: "Termite, cockroach, and bed bug chemical treatment", baseDailyRate: 900, icon: "Shield" },

  // Professional Services
  { name: "Computer Technician", hindiName: "कंप्यूटर तकनीशियन", slug: "computer-technician", description: "Desktop/laptop troubleshooting, OS install, hardware repairs", baseDailyRate: 900, icon: "Monitor" },
  { name: "Data Entry Operator", hindiName: "डाटा एंट्री ऑपरेटर", slug: "data-entry-operator", description: "Spreadsheet entry, invoice digitization, typing", baseDailyRate: 700, icon: "FileText" },
  { name: "Office Assistant", hindiName: "ऑफिस असिस्टेंट", slug: "office-assistant", description: "Filing, scanning, courier management, pantry management", baseDailyRate: 650, icon: "Briefcase" },

  // Transport and Logistics
  { name: "Driver", hindiName: "ड्राइवर", slug: "driver", description: "Commercial & private vehicle driving (LMV/HMV)", baseDailyRate: 800, icon: "Truck" },
  { name: "Delivery Worker", hindiName: "डिलीवरी वर्कर", slug: "delivery-worker", description: "Last mile parcels, food, local goods delivery", baseDailyRate: 600, icon: "Package" },
  { name: "Warehouse Worker", hindiName: "गोदाम सहायक", slug: "warehouse-worker", description: "Inventory stacking, barcode scanning, packing", baseDailyRate: 650, icon: "Archive" },
  { name: "Loading and Unloading", hindiName: "लोडिंग व अनलोडिंग", slug: "loading-unloading", description: "Heavy freight, trucks, and warehouse goods handling", baseDailyRate: 600, icon: "ArrowUpDown" },

  // Other Services
  { name: "Security Guard", hindiName: "सुरक्षा गार्ड", slug: "security-guard", description: "Gatekeeping, visitor register, night patrol", baseDailyRate: 700, icon: "Shield" },
  { name: "Event Assistant", hindiName: "इवेंट सहायक", slug: "event-assistant", description: "Tent setup, seating arrangement, catering service", baseDailyRate: 650, icon: "Calendar" },
];

async function main() {
  console.log("🌱 Starting MajDur database seed...");
  console.log("Developer: Harsh Singh");

  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { ...cat, displayOrder: i + 1 },
      create: { ...cat, displayOrder: i + 1 },
    });
    console.log(`✓ Seeded category [${i + 1}/${CATEGORIES.length}]: ${cat.name}`);
  }

  // Create default Super Admin User if not exists
  const adminHashedPassword = await bcrypt.hash("Admin@MajDur2026", 10);
  const adminUser = await prisma.user.upsert({
    where: { phone: "9876543210" },
    update: {},
    create: {
      name: "Harsh Singh (Super Admin)",
      email: "admin@majdur.in",
      phone: "9876543210",
      password: adminHashedPassword,
      role: "ADMIN",
      isPhoneVerified: true,
      isEmailVerified: true,
    },
  });
  console.log(`✓ Seeded Super Admin: ${adminUser.email} (Phone: ${adminUser.phone})`);
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

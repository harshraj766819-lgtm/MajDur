const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config();

const prisma = new PrismaClient();

// Exact 32 dynamic trade categories as mandated by Phase 3 prompt
const CATEGORIES_32 = [
  { name: "Construction Labour", hindiName: "निर्माण मजदूर", slug: "construction-labour", description: "Excavation, brick carrying, concrete pouring, debris clearance", baseDailyRate: 550, icon: "Users" },
  { name: "Mason", hindiName: "राज मिस्त्री", slug: "mason", description: "Brickwork, stone masonry, RCC foundation, concrete casting, plastering", baseDailyRate: 950, icon: "Layers" },
  { name: "Electrician", hindiName: "इलेक्ट्रीशियन", slug: "electrician", description: "House wiring, MCB setup, switchboard fitting, inverter installation", baseDailyRate: 850, icon: "Zap" },
  { name: "Plumber", hindiName: "प्लम्बर", slug: "plumber", description: "Water pipelines, CPVC fittings, drainage lines, sanitary ware setup", baseDailyRate: 800, icon: "Wrench" },
  { name: "Carpenter", hindiName: "बढ़ई", slug: "carpenter", description: "Door & window framing, wooden furniture, modular kitchen, laminate", baseDailyRate: 900, icon: "Hammer" },
  { name: "Painter", hindiName: "पेंटर", slug: "painter", description: "Putty application, interior/exterior painting, texture, waterproofing paint", baseDailyRate: 750, icon: "Paintbrush" },
  { name: "Welder", hindiName: "वेल्डर", slug: "welder", description: "ARC/MIG metal welding, safety grill fabrication, metal staircases", baseDailyRate: 900, icon: "Flame" },
  { name: "Tile Worker", hindiName: "टाइल कारीगर", slug: "tile-worker", description: "Vitrified floor tiles, bathroom wall tiles, marble & granite installation", baseDailyRate: 1000, icon: "Grid" },
  { name: "POP Worker", hindiName: "पीओपी कारीगर", slug: "pop-worker", description: "Plaster of Paris cornice design, wall moulding, smooth wall finishes", baseDailyRate: 850, icon: "Sparkles" },
  { name: "False Ceiling Worker", hindiName: "फॉल्स सीलिंग कारीगर", slug: "false-ceiling-worker", description: "Gypsum board framing, grid channel ceilings, acoustic tiles", baseDailyRate: 950, icon: "Maximize" },
  { name: "Bar Bender", hindiName: "सरिया बांधने वाला", slug: "bar-bender", description: "TMT bar cutting, rebar bending, column & beam steel cage tying", baseDailyRate: 900, icon: "Link" },
  { name: "Shuttering Worker", hindiName: "शटरिंग मिस्त्री", slug: "shuttering-worker", description: "Plywood & iron shuttering for roof slabs, pillars, lintels", baseDailyRate: 950, icon: "Hammer" },
  { name: "Helper", hindiName: "सहायक / हेल्पर", slug: "helper", description: "Assisting senior mistris, material lifting, mixing mortar", baseDailyRate: 550, icon: "UserPlus" },
  { name: "Housekeeping", hindiName: "हाउसकीपिंग कर्मी", slug: "housekeeping", description: "Floor scrubbing, residential cleaning, commercial sanitization", baseDailyRate: 600, icon: "Sparkles" },
  { name: "AC Technician", hindiName: "एसी तकनीशियन", slug: "ac-technician", description: "Split/Window AC installation, copper piping, gas charging, PCB repair", baseDailyRate: 900, icon: "Wind" },
  { name: "Refrigerator Technician", hindiName: "रेफ्रिजरेटर तकनीशियन", slug: "refrigerator-technician", description: "Compressor servicing, cooling coil diagnostics, thermostat fixes", baseDailyRate: 800, icon: "Box" },
  { name: "CCTV Technician", hindiName: "सीसीटीवी तकनीशियन", slug: "cctv-technician", description: "IP camera setup, NVR/DVR cabling, network configuration, testing", baseDailyRate: 900, icon: "Camera" },
  { name: "Solar Technician", hindiName: "सोलर तकनीशियन", slug: "solar-technician", description: "Rooftop solar panel mounting, inverter wiring, grid synchronization", baseDailyRate: 1100, icon: "Sun" },
  { name: "Machine Operator", hindiName: "मशीन ऑपरेटर", slug: "machine-operator", description: "Concrete mixer, compactor, tile cutter, and generator operations", baseDailyRate: 950, icon: "Cpu" },
  { name: "Fabricator", hindiName: "फैब्रिकेटर", slug: "fabricator", description: "Structural steel sheds, MS sheet fabrication, rolling shutters", baseDailyRate: 950, icon: "Wrench" },
  { name: "Glass Worker", hindiName: "ग्लास कारीगर", slug: "glass-worker", description: "Toughened glass fitting, spider glazing, mirrors, glass partitions", baseDailyRate: 1000, icon: "Square" },
  { name: "Aluminium Worker", hindiName: "एल्युमिनियम कारीगर", slug: "aluminium-worker", description: "Sliding window fabrication, aluminum door frames, ACP panelling", baseDailyRate: 950, icon: "Columns" },
  { name: "Waterproofing Worker", hindiName: "वाटरप्रूफिंग कारीगर", slug: "waterproofing-worker", description: "Terrace bitumen coating, bathroom chemical grouting, damp treatment", baseDailyRate: 900, icon: "Droplets" },
  { name: "Roofer", hindiName: "छत कारीगर", slug: "roofer", description: "Corrugated sheet fixing, roof waterproofing, clay tile placement", baseDailyRate: 850, icon: "Home" },
  { name: "Flooring Worker", hindiName: "फ्लोरिंग कारीगर", slug: "flooring-worker", description: "Kota stone, marble grinding, epoxy floor screed, wooden flooring", baseDailyRate: 950, icon: "Layers" },
  { name: "Interior Worker", hindiName: "इंटीरियर कारीगर", slug: "interior-worker", description: "Drywall partition, wallpaper application, modular panel assembly", baseDailyRate: 1000, icon: "Layout" },
  { name: "Gardner", hindiName: "माली / बागवानी", slug: "gardner", description: "Lawn grooming, plant pruning, pesticide treatment, landscaping", baseDailyRate: 600, icon: "Scissors" },
  { name: "Pest Control Worker", hindiName: "पेस्ट कंट्रोल कर्मी", slug: "pest-control-worker", description: "Termite chemical treatment, rodent control, fogging services", baseDailyRate: 850, icon: "ShieldAlert" },
  { name: "Driver", hindiName: "ड्राइवर", slug: "driver", description: "LMV & HMV commercial trucks, delivery vans, personal chauffeurs", baseDailyRate: 800, icon: "Truck" },
  { name: "Security Guard", hindiName: "सुरक्षा गार्ड", slug: "security-guard", description: "Gate security, visitor registers, perimeter watch, night patrol", baseDailyRate: 700, icon: "ShieldCheck" },
  { name: "Heavy Equipment Operator", hindiName: "हैवी इक्विपमेंट ऑपरेटर", slug: "heavy-equipment-operator", description: "JCB, excavator, crane, roller, and forklift site operation", baseDailyRate: 1400, icon: "Truck" },
  { name: "General Maintenance Worker", hindiName: "सामान्य रखरखाव कर्मी", slug: "general-maintenance-worker", description: "Multi-trade residential fixes, minor electrical, plumbing & painting", baseDailyRate: 750, icon: "Tool" },
];

async function main() {
  console.log("🌱 Starting MajDur database seed...");
  console.log("Developer: Harsh Singh");

  // 1. Seed exact 32 Categories
  for (let i = 0; i < CATEGORIES_32.length; i++) {
    const cat = CATEGORIES_32[i];
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { ...cat, displayOrder: i + 1, isActive: true },
      create: { ...cat, displayOrder: i + 1, isActive: true },
    });
  }
  console.log(`✓ Verified and seeded all 32 trade categories.`);

  // 2. Seed Super Admin User
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
  console.log(`✓ Verified Super Admin: ${adminUser.email}`);

  // 3. Seed Sample Real Verified Workers for Development & Platform Discovery
  const SAMPLE_WORKERS = [
    {
      name: "Rameshwar Mistri",
      phone: "9811223344",
      email: "rameshwar.mason@majdur.in",
      role: "WORKER",
      categorySlug: "mason",
      categoryName: "Mason",
      bio: "12 years experience in precision brickwork, residential RCC slabs, plastering, and stone boundary walls. Completed 130+ projects across NCR.",
      dailyRate: 950,
      hourlyRate: 150,
      experienceYears: 12,
      locationCity: "Delhi NCR",
      locationState: "Delhi",
      locationPincode: "110001",
      isVerified: true,
      isAvailable: true,
      rating: 4.9,
      totalReviews: 84,
      completedJobs: 132,
    },
    {
      name: "Mohd. Shakeel",
      phone: "9822334455",
      email: "shakeel.electrician@majdur.in",
      role: "WORKER",
      categorySlug: "electrician",
      categoryName: "Electrician",
      bio: "Certified licensed electrician with 8 years experience in 3-phase industrial wiring, house DB boxes, MCB tripping resolution, and inverter setups.",
      dailyRate: 850,
      hourlyRate: 130,
      experienceYears: 8,
      locationCity: "Mumbai",
      locationState: "Maharashtra",
      locationPincode: "400001",
      isVerified: true,
      isAvailable: true,
      rating: 4.8,
      totalReviews: 62,
      completedJobs: 98,
    },
    {
      name: "Karan Badhai",
      phone: "9833445566",
      email: "karan.carpenter@majdur.in",
      role: "WORKER",
      categorySlug: "carpenter",
      categoryName: "Carpenter",
      bio: "Master carpenter specializing in modular kitchen cabinets, solid teak door frames, window shutters, and PU wood polishing.",
      dailyRate: 900,
      hourlyRate: 140,
      experienceYears: 10,
      locationCity: "Bengaluru",
      locationState: "Karnataka",
      locationPincode: "560001",
      isVerified: true,
      isAvailable: true,
      rating: 4.9,
      totalReviews: 47,
      completedJobs: 79,
    },
    {
      name: "Dinesh Prajapati",
      phone: "9844556677",
      email: "dinesh.plumber@majdur.in",
      role: "WORKER",
      categorySlug: "plumber",
      categoryName: "Plumber",
      bio: "Master plumber expert in CPVC/UPVC pipelines, concealed bathroom fittings, water pressure pump setups, and underground leak detection.",
      dailyRate: 800,
      hourlyRate: 120,
      experienceYears: 7,
      locationCity: "Patna",
      locationState: "Bihar",
      locationPincode: "800001",
      isVerified: true,
      isAvailable: true,
      rating: 4.7,
      totalReviews: 39,
      completedJobs: 65,
    },
    {
      name: "Suresh Verma",
      phone: "9855667788",
      email: "suresh.painter@majdur.in",
      role: "WORKER",
      categorySlug: "painter",
      categoryName: "Painter",
      bio: "Interior and exterior painting specialist with airless spray guns, Royal luxury emulsion, wall texture, and damp proofing primer coats.",
      dailyRate: 750,
      hourlyRate: 110,
      experienceYears: 9,
      locationCity: "Lucknow",
      locationState: "Uttar Pradesh",
      locationPincode: "226001",
      isVerified: true,
      isAvailable: true,
      rating: 4.8,
      totalReviews: 53,
      completedJobs: 88,
    },
    {
      name: "Balwant Singh",
      phone: "9866778899",
      email: "balwant.welder@majdur.in",
      role: "WORKER",
      categorySlug: "welder",
      categoryName: "Welder",
      bio: "Heavy structural welder and fabricator. Specializes in iron safety gates, industrial truss roofs, spiral stairs, and MIG/ARC welding.",
      dailyRate: 900,
      hourlyRate: 140,
      experienceYears: 11,
      locationCity: "Pune",
      locationState: "Maharashtra",
      locationPincode: "411001",
      isVerified: true,
      isAvailable: true,
      rating: 4.9,
      totalReviews: 34,
      completedJobs: 56,
    },
  ];

  const defaultPassword = await bcrypt.hash("Worker@MajDur2026", 10);

  for (const w of SAMPLE_WORKERS) {
    const user = await prisma.user.upsert({
      where: { phone: w.phone },
      update: {},
      create: {
        name: w.name,
        phone: w.phone,
        email: w.email,
        password: defaultPassword,
        role: "WORKER",
        isPhoneVerified: true,
        isEmailVerified: true,
      },
    });

    const categoryRecord = await prisma.category.findUnique({
      where: { slug: w.categorySlug },
    });

    await prisma.workerProfile.upsert({
      where: { userId: user.id },
      update: {
        bio: w.bio,
        dailyRate: w.dailyRate,
        hourlyRate: w.hourlyRate,
        experienceYears: w.experienceYears,
        category: w.categoryName,
        categoryId: categoryRecord ? categoryRecord.id : null,
        locationCity: w.locationCity,
        locationState: w.locationState,
        locationPincode: w.locationPincode,
        isVerified: w.isVerified,
        isAvailable: w.isAvailable,
        rating: w.rating,
        totalReviews: w.totalReviews,
        completedJobs: w.completedJobs,
      },
      create: {
        userId: user.id,
        bio: w.bio,
        dailyRate: w.dailyRate,
        hourlyRate: w.hourlyRate,
        experienceYears: w.experienceYears,
        category: w.categoryName,
        categoryId: categoryRecord ? categoryRecord.id : null,
        locationCity: w.locationCity,
        locationState: w.locationState,
        locationPincode: w.locationPincode,
        isVerified: w.isVerified,
        isAvailable: w.isAvailable,
        rating: w.rating,
        totalReviews: w.totalReviews,
        completedJobs: w.completedJobs,
      },
    });
  }
  console.log(`✓ Seeded ${SAMPLE_WORKERS.length} real sample verified workers.`);

  // 4. Seed Sample Verified Contractors for Platform Statistics & Discovery
  const SAMPLE_CONTRACTORS = [
    {
      name: "Sharma Civil Builders",
      phone: "9877112233",
      email: "sharma.contractors@majdur.in",
      companyName: "Sharma Civil Works Pvt Ltd",
      companyBio: "Turnkey residential and commercial RCC construction contractor with over 25+ skilled masons and daily wage laborers.",
      gstNumber: "07AAAAA0000A1Z5",
      licenseNumber: "PWD-DL-2021-998",
      city: "Delhi NCR",
      state: "Delhi",
      pincode: "110092",
      isVerified: true,
    },
    {
      name: "Apex Infrastructure Group",
      phone: "9877223344",
      email: "apex.infra@majdur.in",
      companyName: "Apex Infrastructure & Fabrication",
      companyBio: "Industrial shed fabrication, multi-story commercial interiors, and civil contracting.",
      gstNumber: "27BBBBB1111B2Z6",
      licenseNumber: "MH-BOM-CIVIL-441",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400050",
      isVerified: true,
    },
  ];

  for (const c of SAMPLE_CONTRACTORS) {
    const user = await prisma.user.upsert({
      where: { phone: c.phone },
      update: {},
      create: {
        name: c.name,
        phone: c.phone,
        email: c.email,
        password: defaultPassword,
        role: "CONTRACTOR",
        isPhoneVerified: true,
        isEmailVerified: true,
      },
    });

    await prisma.contractorProfile.upsert({
      where: { userId: user.id },
      update: {
        companyName: c.companyName,
        companyBio: c.companyBio,
        gstNumber: c.gstNumber,
        licenseNumber: c.licenseNumber,
        city: c.city,
        state: c.state,
        pincode: c.pincode,
        isVerified: c.isVerified,
      },
      create: {
        userId: user.id,
        companyName: c.companyName,
        companyBio: c.companyBio,
        gstNumber: c.gstNumber,
        licenseNumber: c.licenseNumber,
        city: c.city,
        state: c.state,
        pincode: c.pincode,
        isVerified: c.isVerified,
      },
    });
  }
  console.log(`✓ Seeded ${SAMPLE_CONTRACTORS.length} sample active contractors.`);

  console.log("✅ MajDur Phase 3 database seed finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

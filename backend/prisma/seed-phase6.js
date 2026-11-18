const { PrismaClient } = require("@prisma/client");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config();

const prisma = new PrismaClient();

const CANONICAL_SKILLS = [
  // Mason
  { categorySlug: "mason", skills: ["Brickwork & Block Masonry", "RCC Slab & Beam Casting", "Wall Plastering (Internal/External)", "Stone Masonry", "Tile & Marble Flooring"] },
  // Electrician
  { categorySlug: "electrician", skills: ["Concealed House Wiring", "Distribution Box (DB) & MCB Dressing", "Inverter & Battery Wiring", "3-Phase Commercial Wiring", "Fault Finding & Earthing"] },
  // Plumber
  { categorySlug: "plumber", skills: ["CPVC/UPVC Pipeline Fitting", "Bathroom Sanitary Ware Installation", "Water Pressure Pump Setup", "Drainage & Sewerage Line Work", "Concealed Leakage Detection"] },
  // Carpenter
  { categorySlug: "carpenter", skills: ["Solid Wood Door & Window Framing", "Modular Kitchen Cabinetry", "Wardrobe & Almirah Fabrication", "Laminate & Veneer Pasting", "PU Wood Polishing"] },
  // Painter
  { categorySlug: "painter", skills: ["Wall Putty & Primer Application", "Luxury Emulsion & Acrylic Paint", "Texture & Stencil Wall Design", "Exterior Weather-Proof Coating", "Wood & Metal Enamel Painting"] },
  // Welder
  { categorySlug: "welder", skills: ["MIG & ARC Welding", "Iron Safety Grill & Gate Fabrication", "Structural Steel Truss Roofing", "Spiral Metal Staircases", "Rolling Shutter Repair"] },
  // Tile Worker
  { categorySlug: "tile-worker", skills: ["Vitrified Floor Tile Laying", "Bathroom Wall & Dado Tiles", "Granite Kitchen Slab Installation", "Epoxy Tile Grouting", "Marble Grinding & Polishing"] },
  // POP Worker
  { categorySlug: "pop-worker", skills: ["Plaster of Paris False Ceiling", "Decorative Wall Moulding", "POP Cornice & Border Work", "Smooth Surface Punning", "Cove Lighting Channel Setup"] },
  // AC Technician
  { categorySlug: "ac-technician", skills: ["Split AC Copper Pipe Installation", "Freon/R32 Gas Charging", "PCB Board Diagnostics & Repair", "AC Deep Jet Foam Servicing", "Ductable AC Maintenance"] },
  // Construction Labour
  { categorySlug: "construction-labour", skills: ["Site Excavation & Trenching", "Concrete Mortar Mixing", "Brick & Material Hauling", "Debris Clearance & Site Loading", "Water Curing for RCC Structures"] }
];

async function seedSkillsAndJobs() {
  console.log("🛠️ Seeding Phase 6 Canonical Skills and Open Marketplace Jobs...");
  console.log("Developer: Harsh Singh");

  // 1. Seed Skills linked to Categories
  let totalSkillsCreated = 0;
  for (const group of CANONICAL_SKILLS) {
    const category = await prisma.category.findUnique({
      where: { slug: group.categorySlug }
    });

    if (!category) continue;

    for (const skillName of group.skills) {
      const existing = await prisma.skill.findUnique({ where: { name: skillName } });
      if (!existing) {
        await prisma.skill.create({
          data: {
            name: skillName,
            categoryId: category.id
          }
        });
        totalSkillsCreated++;
      }
    }
  }
  console.log(`✓ Seeded ${totalSkillsCreated} new trade skills across core categories.`);

  // 2. Fetch Customer and Contractor users to act as posters
  const customers = await prisma.user.findMany({ where: { role: "CUSTOMER" }, take: 2 });
  const contractors = await prisma.user.findMany({ where: { role: "CONTRACTOR" }, take: 2 });

  const posterA = customers[0] || contractors[0];
  const posterB = contractors[0] || customers[0];

  if (!posterA) {
    console.log("⚠️ No customer or contractor user found to post jobs. Skipping sample jobs.");
    return;
  }

  // 3. Seed Realistic OPEN Jobs
  const OPEN_JOBS = [
    {
      title: "Full 3BHK Concealed Electrical Wiring & DB Setup",
      description: "Need an experienced licensed electrician to complete full apartment internal concealed conduit wiring, modular switchboards (80 points), main distribution board dressing, and inverter backup wiring.",
      categorySlug: "electrician",
      categoryName: "Electrician",
      budget: 18500,
      budgetType: "FIXED",
      jobType: "CONTRACT",
      city: "Delhi NCR",
      area: "Sector 57, Gurugram",
      address: "Tower B, Nirvana Greens, Sector 57, Gurugram",
      pincode: "122003",
      expectedDays: 6,
      workersNeeded: 2,
      posterId: posterA.id,
    },
    {
      title: "Boundary Wall Brickwork & Exterior Plastering (1200 Sq Ft)",
      description: "Require skilled masons for 9-inch red brick boundary wall construction along with cement-sand plastering and coping work. Mortar mixing helper will be provided.",
      categorySlug: "mason",
      categoryName: "Mason",
      budget: 1200,
      budgetType: "DAILY",
      jobType: "ONE_TIME",
      city: "Delhi NCR",
      area: "Noida Sector 76",
      address: "Plot 42, Supertech Silicon City, Sector 76, Noida",
      pincode: "201301",
      expectedDays: 5,
      workersNeeded: 3,
      posterId: posterB.id,
    },
    {
      title: "Commercial Kitchen CPVC Plumbing & Drainage Network",
      description: "Restaurant setup requiring heavy-duty CPVC water inlet lines, grease trap installation, concealed floor drain piping, and commercial sink faucets.",
      categorySlug: "plumber",
      categoryName: "Plumber",
      budget: 14000,
      budgetType: "FIXED",
      jobType: "CONTRACT",
      city: "Mumbai",
      area: "Andheri West",
      address: "Unit 12, Link Road Commercial Hub, Andheri West, Mumbai",
      pincode: "400053",
      expectedDays: 4,
      workersNeeded: 2,
      posterId: posterB.id,
    },
    {
      title: "Custom Teakwood Main Entrance Door & Window Frames",
      description: "Crafting and installing 8 ft x 4 ft main entrance solid teak frame and panel door with mortise lock fitting. Precision handwork and finish required.",
      categorySlug: "carpenter",
      categoryName: "Carpenter",
      budget: 950,
      budgetType: "DAILY",
      jobType: "ONE_TIME",
      city: "Bengaluru",
      area: "Indiranagar",
      address: "100 Feet Road, 2nd Stage, Indiranagar, Bengaluru",
      pincode: "560038",
      expectedDays: 3,
      workersNeeded: 1,
      posterId: posterA.id,
    },
    {
      title: "2BHK Complete Asian Paints Royale Luxury Emulsion & Texture",
      description: "Two coats of wall putty, primer, and two coats of Asian Paints Royale in 2 bedrooms, hall, and kitchen. Living room feature wall requires metallic stucco texture.",
      categorySlug: "painter",
      categoryName: "Painter",
      budget: 22000,
      budgetType: "FIXED",
      jobType: "CONTRACT",
      city: "Lucknow",
      area: "Gomti Nagar",
      address: "Vipul Khand, Gomti Nagar, Lucknow",
      pincode: "226010",
      expectedDays: 5,
      workersNeeded: 2,
      posterId: posterA.id,
    },
    {
      title: "Warehouse Safety Grills & Heavy Sliding Gate Welding",
      description: "MS angle and hollow pipe fabrication for 10 warehouse windows and 14 ft wide sliding main gate. ARC/MIG welding equipment can be supplied if required.",
      categorySlug: "welder",
      categoryName: "Welder",
      budget: 1100,
      budgetType: "DAILY",
      jobType: "CONTRACT",
      city: "Pune",
      area: "Bhosari Industrial Estate",
      address: "MIDC Sector 10, Bhosari, Pune",
      pincode: "411026",
      expectedDays: 4,
      workersNeeded: 2,
      posterId: posterB.id,
    },
    {
      title: "Vitrified Floor Tiles Laying (800 Sq Ft Living & Dining)",
      description: "Laying 4ft x 2ft vitrified tiles on screed bed with 2mm spacers and epoxy grout filling. Strict level laser alignment required.",
      categorySlug: "tile-worker",
      categoryName: "Tile Worker",
      budget: 16000,
      budgetType: "FIXED",
      jobType: "ONE_TIME",
      city: "Delhi NCR",
      area: "Dwarka Sector 12",
      address: "Pocket 7, DDA SFS Flats, Sector 12 Dwarka, New Delhi",
      pincode: "110078",
      expectedDays: 4,
      workersNeeded: 2,
      posterId: posterA.id,
    },
    {
      title: "Rooftop Solar Structure Fabrication & Panel Installation",
      description: "5kW on-grid solar project. Assemble galvanized iron mounting structures, fasten solar PV panels, and route DC cabling with earthing rods.",
      categorySlug: "solar-technician",
      categoryName: "Solar Technician",
      budget: 1300,
      budgetType: "DAILY",
      jobType: "ONE_TIME",
      city: "Jaipur",
      area: "Mansarovar",
      address: "Shipra Path, Mansarovar, Jaipur",
      pincode: "302020",
      expectedDays: 3,
      workersNeeded: 2,
      posterId: posterB.id,
    }
  ];

  let totalJobsCreated = 0;
  for (const jobData of OPEN_JOBS) {
    const existingJob = await prisma.job.findFirst({
      where: { title: jobData.title, city: jobData.city }
    });

    if (!existingJob) {
      const cat = await prisma.category.findUnique({
        where: { slug: jobData.categorySlug }
      });

      await prisma.job.create({
        data: {
          title: jobData.title,
          description: jobData.description,
          categoryName: jobData.categoryName,
          categoryId: cat ? cat.id : null,
          budget: jobData.budget,
          budgetType: jobData.budgetType,
          jobType: jobData.jobType,
          city: jobData.city,
          area: jobData.area,
          address: jobData.address,
          pincode: jobData.pincode,
          expectedDays: jobData.expectedDays,
          workersNeeded: jobData.workersNeeded,
          status: "OPEN",
          posterId: jobData.posterId,
        }
      });
      totalJobsCreated++;
    }
  }

  console.log(`✓ Seeded ${totalJobsCreated} open marketplace jobs across categories and cities.`);
  console.log("✅ Phase 6 helper seed completed successfully!");
}

seedSkillsAndJobs()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


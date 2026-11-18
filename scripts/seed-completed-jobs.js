const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { PrismaClient } = require(path.resolve(__dirname, "../backend/node_modules/@prisma/client"));
const bcrypt = require(path.resolve(__dirname, "../backend/node_modules/bcryptjs"));
const prisma = new PrismaClient();

async function seedJobs() {
  const customerPassword = await bcrypt.hash("Customer@MajDur2026", 10);
  const customer = await prisma.user.upsert({
    where: { phone: "9899001122" },
    update: {},
    create: {
      name: "Amit Sharma",
      phone: "9899001122",
      email: "amit.customer@majdur.in",
      password: customerPassword,
      role: "CUSTOMER",
      isPhoneVerified: true,
      isEmailVerified: true,
    }
  });

  const categories = await prisma.category.findMany({ take: 6 });
  const sampleJobs = [
    { title: "Complete Residential Rewiring", category: "Electrician", city: "Delhi NCR", address: "Sector 18, Noida", pincode: "201301", budget: 8500, status: "COMPLETED" },
    { title: "Boundary Wall Masonry Construction", category: "Mason", city: "Delhi NCR", address: "Rohini Sector 7", pincode: "110085", budget: 15000, status: "COMPLETED" },
    { title: "Master Bathroom Plumbing & Sanitary Fitting", category: "Plumber", city: "Mumbai", address: "Andheri West", pincode: "400053", budget: 6200, status: "COMPLETED" },
    { title: "Solid Teak Door Framing & Fitting", category: "Carpenter", city: "Bengaluru", address: "Indiranagar", pincode: "560038", budget: 7400, status: "COMPLETED" },
    { title: "2BHK Interior Putty & Royale Paint", category: "Painter", city: "Lucknow", address: "Gomti Nagar", pincode: "226010", budget: 18000, status: "COMPLETED" },
    { title: "Heavy Metal Terrace Safety Grill", category: "Welder", city: "Pune", address: "Kothrud", pincode: "411038", budget: 9500, status: "COMPLETED" },
  ];

  for (let i = 0; i < sampleJobs.length; i++) {
    const sj = sampleJobs[i];
    const cat = categories.find(c => c.name.toLowerCase().includes(sj.category.toLowerCase())) || categories[0];
    await prisma.job.create({
      data: {
        title: sj.title,
        description: `Verified completed project in ${sj.city}. Inspected and paid in full.`,
        categoryName: sj.category,
        categoryId: cat.id,
        posterId: customer.id,
        city: sj.city,
        address: sj.address,
        pincode: sj.pincode,
        budget: sj.budget,
        status: "COMPLETED",
        jobType: "ONE_TIME",
        budgetType: "FIXED",
      }
    });
  }

  const completedCount = await prisma.job.count({ where: { status: "COMPLETED" } });
  console.log("Seeded completed jobs. Total in DB:", completedCount);
  await prisma.$disconnect();
}

seedJobs();

/**
 * Setup & Teardown helper for Phase 9 Live Chrome Browser QA
 * Creates isolated test customer, test worker, and an ACCEPTED booking ready for Razorpay Test Mode payment.
 */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../backend/.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { PrismaClient } = require(path.resolve(__dirname, "../backend/node_modules/@prisma/client"));
const prisma = new PrismaClient();

const API_BASE = "http://localhost:5000/api";
const STATE_FILE = path.resolve(__dirname, "../test-evidence/phase9/qa-fixture-state.json");

async function apiReq(endpoint, { method = "GET", token = null, body = null } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function setup() {
  const ts = Date.now();
  const suffix = String(ts).slice(-7);
  const custEmail = `p9.chrome.cust.${ts}@majdur.test`;
  const workerEmail = `p9.chrome.worker.${ts}@majdur.test`;
  const password = "Password@123";

  const custReg = await apiReq("/auth/register/customer", {
    method: "POST",
    body: {
      name: "Harsh QA Customer",
      email: custEmail,
      phone: `944${suffix}`,
      password,
    },
  });
  if (custReg.status !== 201) throw new Error(`Customer reg failed: ${JSON.stringify(custReg.json)}`);
  const customerId = custReg.json.data.user.id;
  const customerToken = custReg.json.data.accessToken;

  const workerReg = await apiReq("/auth/register/worker", {
    method: "POST",
    body: {
      name: "Ramesh QA Electrician",
      email: workerEmail,
      phone: `955${suffix}`,
      password,
      trade: "Electrician",
      experienceYears: 5,
      city: "Lucknow",
      pincode: "226001",
      dailyRate: 1500,
    },
  });
  if (workerReg.status !== 201) throw new Error(`Worker reg failed: ${JSON.stringify(workerReg.json)}`);
  const workerId = workerReg.json.data.user.id;
  const workerToken = workerReg.json.data.accessToken;

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const bookingRes = await apiReq("/bookings", {
    method: "POST",
    token: customerToken,
    body: {
      workerId,
      serviceCategory: "Electrician",
      startDate: tomorrow,
      totalDays: 2,
      address: "B-12, Hazratganj",
      city: "Lucknow",
      notes: "Phase 9 Chrome QA Test Booking",
    },
  });
  if (bookingRes.status !== 201) throw new Error(`Booking failed: ${JSON.stringify(bookingRes.json)}`);
  const bookingId = bookingRes.json.data.id;
  const bookingNumber = bookingRes.json.data.bookingNumber;

  const acceptRes = await apiReq(`/bookings/${bookingId}/accept`, {
    method: "PATCH",
    token: workerToken,
    body: { note: "Accepted for Phase 9 Chrome QA" },
  });
  if (acceptRes.status !== 200) throw new Error(`Accept failed: ${JSON.stringify(acceptRes.json)}`);

  const state = {
    customerId,
    customerEmail: custEmail,
    customerPassword: password,
    workerId,
    workerEmail,
    bookingId,
    bookingNumber,
    totalAmount: 3000,
  };

  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  console.log(JSON.stringify(state, null, 2));
}

async function cleanup() {
  if (!fs.existsSync(STATE_FILE)) {
    console.log("No fixture state file found.");
    return;
  }
  const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  const userIds = [state.customerId, state.workerId].filter(Boolean);

  if (state.bookingId) {
    const payments = await prisma.payment.findMany({
      where: { bookingId: state.bookingId },
      select: { id: true },
    });
    const paymentIds = payments.map((p) => p.id);
    if (paymentIds.length > 0) {
      await prisma.paymentEvent.deleteMany({ where: { paymentId: { in: paymentIds } } });
      await prisma.payment.deleteMany({ where: { id: { in: paymentIds } } });
    }
    await prisma.invoice.deleteMany({ where: { bookingId: state.bookingId } });
    await prisma.bookingStatusHistory.deleteMany({ where: { bookingId: state.bookingId } });
    await prisma.booking.deleteMany({ where: { id: state.bookingId } });
  }
  if (userIds.length > 0) {
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.refreshSession.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.workerProfile.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.customerProfile.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
  fs.unlinkSync(STATE_FILE);
  console.log("Cleaned up Phase 9 Chrome QA fixture completely.");
}

(async () => {
  try {
    if (process.argv.includes("--cleanup")) {
      await cleanup();
    } else {
      await setup();
    }
  } finally {
    await prisma.$disconnect();
  }
})();


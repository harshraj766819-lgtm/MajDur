process.env.NODE_ENV = "test";
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { app } = require(path.resolve(__dirname, "../backend/dist/server.js"));
const { prisma } = require(path.resolve(__dirname, "../backend/dist/config/prisma.js"));
const http = require("http");

async function runCompletePhase8Audit() {
  const PORT = 5098;
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));

  console.log(`\n======================================================`);
  console.log(`🛡️ MajDur Phase 8 Stage 1: End-to-End, Security & Database Audit Suite`);
  console.log(`Developer: Harsh Singh`);
  console.log(`Audit Test Port: ${PORT}`);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;
  const auditLog = [];

  function assert(condition, message, details = "") {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      auditLog.push({ status: "PASS", message, details });
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message} - ${details}`);
      auditLog.push({ status: "FAIL", message, details });
      failed++;
    }
  }

  async function apiCall(method, endpoint, body = null, headers = {}) {
    const opts = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`http://localhost:${PORT}/api${endpoint}`, opts);
    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    return { status: res.status, data };
  }

  const baseNum = Date.now().toString().slice(-9);
  const custAPhone = `9${baseNum}`;
  const custBPhone = `8${baseNum}`;
  const workerAPhone = `7${baseNum}`;
  const workerBPhone = `6${baseNum}`;

  let custAToken = "";
  let custBToken = "";
  let workerAToken = "";
  let workerBToken = "";

  let custAUserId = "";
  let custBUserId = "";
  let workerAUserId = "";
  let workerBUserId = "";

  try {
    // =========================================================================
    // SECTION 1: PROVISIONING TEST PARTICIPANTS
    // =========================================================================
    console.log("--- 1. Provisioning Dedicated Customer & Worker Test Profiles ---");

    const regCustA = await apiCall("POST", "/auth/register/customer", {
      name: "Audit Customer A",
      phone: custAPhone,
      email: `audit.custA.${baseNum}@majdur.test`,
      password: "Password123!",
    });
    assert(regCustA.status === 201, "Customer A registers successfully (201 Created)");
    custAToken = regCustA.data.data.accessToken;
    custAUserId = regCustA.data.data.user.id;

    const regCustB = await apiCall("POST", "/auth/register/customer", {
      name: "Audit Customer B (Attacker/IDOR)",
      phone: custBPhone,
      email: `audit.custB.${baseNum}@majdur.test`,
      password: "Password123!",
    });
    assert(regCustB.status === 201, "Customer B registers successfully (201 Created)");
    custBToken = regCustB.data.data.accessToken;
    custBUserId = regCustB.data.data.user.id;

    const regWorkerA = await apiCall("POST", "/auth/register/worker", {
      name: "Ramesh Sharma Electrician",
      phone: workerAPhone,
      email: `ramesh.${baseNum}@majdur.test`,
      password: "Password123!",
      trade: "Electrician",
      experience: 5,
      city: "Noida",
      pincode: "201301",
    });
    assert(regWorkerA.status === 201, "Worker A registers successfully (201 Created)");
    workerAToken = regWorkerA.data.data.accessToken;
    workerAUserId = regWorkerA.data.data.user.id;

    await prisma.workerProfile.update({
      where: { userId: workerAUserId },
      data: {
        isVerified: true,
        isAvailable: true,
        dailyRate: 850,
        hourlyRate: 140,
        experienceYears: 5,
        rating: 4.9,
        totalReviews: 18,
        completedJobs: 14,
        locationCity: "Noida",
        locationState: "Uttar Pradesh",
        locationPincode: "201301",
        bio: "Certified residential and commercial master electrician with 5+ years experience.",
        serviceAreas: {
          create: [
            { areaName: "Sector 62", city: "Noida", pincode: "201309", radiusKm: 15 },
          ],
        },
      },
    });

    const regWorkerB = await apiCall("POST", "/auth/register/worker", {
      name: "Suresh Mason B (Attacker/IDOR)",
      phone: workerBPhone,
      email: `suresh.${baseNum}@majdur.test`,
      password: "Password123!",
      trade: "Mason",
      experience: 3,
      city: "Delhi NCR",
      pincode: "110001",
    });
    assert(regWorkerB.status === 201, "Worker B registers successfully (201 Created)");
    workerBToken = regWorkerB.data.data.accessToken;
    workerBUserId = regWorkerB.data.data.user.id;

    const custAHeaders = { Authorization: `Bearer ${custAToken}` };
    const custBHeaders = { Authorization: `Bearer ${custBToken}` };
    const workerAHeaders = { Authorization: `Bearer ${workerAToken}` };
    const workerBHeaders = { Authorization: `Bearer ${workerBToken}` };

    // =========================================================================
    // SECTION 2: CUSTOMER E2E LIFECYCLE (Steps 1 to 11)
    // =========================================================================
    console.log("\n--- 2. Customer End-to-End Journey (Search -> Hire -> Track -> Cancel) ---");

    // 1. Customer searches worker directory
    const searchRes = await apiCall("GET", "/workers?category=Electrician&city=Noida");
    assert(searchRes.status === 200, "Customer searches directory for Electricians in Noida (200 OK)");
    const targetWorker = searchRes.data.data.workers.find((w) => w.userId === workerAUserId);
    assert(targetWorker !== undefined, "Ramesh Sharma Electrician located in search results");
    assert(targetWorker.dailyRate === 850, "Daily rate displays correct value (₹850/day)");

    // 2. Customer applies wage and experience bounds
    const refinedSearch = await apiCall("GET", "/workers?category=Electrician&city=Noida&minRate=500&maxRate=1000&minExperience=3");
    assert(refinedSearch.status === 200, "Refined search with rate (₹500-₹1000) and exp (>=3y) succeeds");
    assert(refinedSearch.data.data.workers.some((w) => w.userId === workerAUserId), "Worker A matches refined filter parameters");

    // 3. Customer submits booking request
    const bookingStartDate = new Date(Date.now() + 86400000).toISOString();
    const createBookingRes = await apiCall("POST", "/bookings", {
      workerId: workerAUserId,
      serviceCategory: "Electrician",
      startDate: bookingStartDate,
      totalDays: 2,
      address: "Flat 402, Sector 62, Prateek Fedora",
      city: "Noida",
      notes: "Inverter and switchboard rewiring audit",
    }, custAHeaders);

    assert(createBookingRes.status === 201, "Customer submits booking request (201 Created)");
    const booking1 = createBookingRes.data.data;
    assert(booking1.status === "REQUESTED", "Initial booking status is REQUESTED");
    assert(booking1.totalAmount === 850 * 2, "Total amount accurately calculated as ₹1,700 (₹850 x 2 days)");
    assert(booking1.bookingNumber.startsWith("MD-"), "Booking assigned official reference code");

    // 4. Customer opens booking dashboard
    const custDashBookings = await apiCall("GET", "/bookings", null, custAHeaders);
    assert(custDashBookings.status === 200, "Customer opens booking dashboard (200 OK)");
    assert(custDashBookings.data.data.bookings.some((b) => b.id === booking1.id), "New booking appears in customer booking queue");

    // 5. Customer views booking details
    const bookingDetail = await apiCall("GET", `/bookings/${booking1.id}`, null, custAHeaders);
    assert(bookingDetail.status === 200, "Customer views booking details (200 OK)");
    assert(bookingDetail.data.data.statusHistory.length >= 1, "Status history timeline initialized");
    assert(bookingDetail.data.data.statusHistory[0].status === "REQUESTED", "Timeline records REQUESTED stage");

    // 6. Customer cancels an eligible booking
    const cancelRes = await apiCall("PATCH", `/bookings/${booking1.id}/cancel`, {
      reason: "Scheduling conflict resolved; booking canceled.",
    }, custAHeaders);
    assert(cancelRes.status === 200, "Customer cancels eligible booking (200 OK)");
    assert(cancelRes.data.data.status === "CANCELLED", "Booking status successfully transitioned to CANCELLED");

    // =========================================================================
    // SECTION 3: WORKER E2E LIFECYCLE (Accept -> Start -> Complete -> Invoicing)
    // =========================================================================
    console.log("\n--- 3. Worker End-to-End Journey (Queue -> Accept -> Start -> Complete -> Invoicing) ---");

    // Customer creates a 2nd booking for worker execution
    const createBooking2 = await apiCall("POST", "/bookings", {
      workerId: workerAUserId,
      serviceCategory: "Electrical Emergency",
      startDate: bookingStartDate,
      totalDays: 3,
      address: "House 24, Sector 62",
      city: "Noida",
      notes: "Main breaker tripping continuously",
    }, custAHeaders);
    const booking2 = createBooking2.data.data;
    assert(booking2.status === "REQUESTED", "Booking 2 created for execution test");

    // 1. Worker checks incoming queue
    const workerQueue = await apiCall("GET", "/bookings?status=REQUESTED", null, workerAHeaders);
    assert(workerQueue.status === 200, "Worker checks incoming booking queue (200 OK)");
    assert(workerQueue.data.data.bookings.some((b) => b.id === booking2.id), "Worker sees incoming booking 2");

    // 2. Worker accepts booking
    const workerAccept = await apiCall("PATCH", `/bookings/${booking2.id}/accept`, {
      note: "Confirmed. Will reach site at 9:00 AM.",
    }, workerAHeaders);
    assert(workerAccept.status === 200, "Worker accepts booking via /accept (200 OK)");
    assert(workerAccept.data.data.status === "ACCEPTED", "Booking status is now ACCEPTED");

    // 3. Worker starts the job (IN_PROGRESS)
    const workerStart = await apiCall("PATCH", `/bookings/${booking2.id}/status`, {
      status: "IN_PROGRESS",
      note: "Arrived at site. Diagnostic work started on electrical panel.",
    }, workerAHeaders);
    assert(workerStart.status === 200, "Worker transitions booking to IN_PROGRESS (200 OK)");
    assert(workerStart.data.data.status === "IN_PROGRESS", "Booking status is IN_PROGRESS");

    // 4. Worker marks job completed
    const initialCompletedJobs = (await prisma.workerProfile.findUnique({ where: { userId: workerAUserId } })).completedJobs;
    const workerComplete = await apiCall("PATCH", `/bookings/${booking2.id}/status`, {
      status: "COMPLETED",
      note: "Faulty 63A MCB replaced. All circuits tested under load.",
    }, workerAHeaders);
    assert(workerComplete.status === 200, "Worker completes booking via /status (200 OK)");
    assert(workerComplete.data.data.status === "COMPLETED", "Booking status is now COMPLETED");

    // 5. Verify worker completedJobs count incremented exactly once
    const finalWorkerProfile = await prisma.workerProfile.findUnique({ where: { userId: workerAUserId } });
    assert(finalWorkerProfile.completedJobs === initialCompletedJobs + 1, `Worker completedJobs incremented exactly once (${initialCompletedJobs} -> ${finalWorkerProfile.completedJobs})`);

    // 6. Verify customer invoice auto-generation
    const generatedInvoice = await prisma.invoice.findFirst({ where: { bookingId: booking2.id } });
    assert(generatedInvoice !== null, "Official invoice automatically generated on completion");
    assert(generatedInvoice.totalAmount === 850 * 3, `Invoice totalAmount matches booking total: ₹${850 * 3}`);
    assert(generatedInvoice.invoiceNumber.startsWith("INV-"), "Invoice formatted with standard INV- prefix");

    // =========================================================================
    // SECTION 4: WORKER REJECTION & DISPUTE LIFECYCLE
    // =========================================================================
    console.log("\n--- 4. Worker Rejection & Dispute Flow Verification ---");

    // Create 3rd booking to test worker decline
    const createBooking3 = await apiCall("POST", "/bookings", {
      workerId: workerAUserId,
      serviceCategory: "High Voltage Wiring",
      startDate: bookingStartDate,
      totalDays: 1,
      address: "Industrial Complex",
      city: "Noida",
    }, custAHeaders);
    const booking3 = createBooking3.data.data;

    // Worker declines booking
    const workerDecline = await apiCall("PATCH", `/bookings/${booking3.id}/reject`, {
      reason: "High voltage specialization license required for this industrial unit.",
    }, workerAHeaders);
    assert(workerDecline.status === 200, "Worker declines booking via /reject (200 OK)");
    assert(workerDecline.data.data.status === "REJECTED", "Booking status is now REJECTED");

    // Create 4th booking to test dispute
    const createBooking4 = await apiCall("POST", "/bookings", {
      workerId: workerAUserId,
      serviceCategory: "Generator Setup",
      startDate: bookingStartDate,
      totalDays: 1,
      address: "Expressway Tower",
      city: "Noida",
    }, custAHeaders);
    const booking4 = createBooking4.data.data;
    await apiCall("PATCH", `/bookings/${booking4.id}/accept`, {}, workerAHeaders);
    await apiCall("PATCH", `/bookings/${booking4.id}/status`, { status: "IN_PROGRESS" }, workerAHeaders);

    // Customer disputes active work
    const disputeRes = await apiCall("PATCH", `/bookings/${booking4.id}/status`, {
      status: "DISPUTED",
      note: "Generator installation incomplete; cable length insufficient.",
    }, custAHeaders);
    assert(disputeRes.status === 200, "Customer raises dispute on active IN_PROGRESS booking (200 OK)");
    assert(disputeRes.data.data.status === "DISPUTED", "Booking status transitioned to DISPUTED");

    // =========================================================================
    // SECTION 5: SECURITY AUDIT (IDOR, Permissions & Matrix Tamper Resistance)
    // =========================================================================
    console.log("\n--- 5. Security & IDOR Authorization Audit ---");

    // Security Test 1: Unauthenticated API request blocked
    const unauthReq = await apiCall("GET", `/bookings/${booking2.id}`);
    assert(unauthReq.status === 401, "Security: Unauthenticated request rejected with 401 Unauthorized");

    // Security Test 2: Customer B attempts to view Customer A's booking (IDOR)
    const idorView = await apiCall("GET", `/bookings/${booking2.id}`, null, custBHeaders);
    assert(idorView.status === 403, "Security: Customer B viewing Customer A's booking blocked with 403 Forbidden (IDOR)");

    // Security Test 3: Customer B attempts to cancel Customer A's booking (IDOR)
    const idorCancel = await apiCall("PATCH", `/bookings/${booking4.id}/cancel`, { reason: "Malicious cancel" }, custBHeaders);
    assert(idorCancel.status === 403, "Security: Customer B cancelling Customer A's booking blocked with 403 Forbidden (IDOR)");

    // Security Test 4: Worker B attempts to accept Worker A's booking (IDOR)
    const idorAccept = await apiCall("PATCH", `/bookings/${booking4.id}/accept`, {}, workerBHeaders);
    assert(idorAccept.status === 403, "Security: Worker B accepting Worker A's booking blocked with 403 Forbidden (IDOR)");

    // Security Test 5: Worker B attempts to decline Worker A's booking (IDOR)
    const idorReject = await apiCall("PATCH", `/bookings/${booking4.id}/reject`, {}, workerBHeaders);
    assert(idorReject.status === 403, "Security: Worker B declining Worker A's booking blocked with 403 Forbidden (IDOR)");

    // Security Test 6: Customer attempts to mark job COMPLETED (Role escalation)
    const roleEscalation = await apiCall("PATCH", `/bookings/${booking4.id}/status`, { status: "COMPLETED" }, custAHeaders);
    assert(roleEscalation.status === 403, "Security: Customer attempting to mark job COMPLETED blocked with 403 Forbidden");

    // Security Test 7: Cannot cancel COMPLETED booking
    const cancelCompleted = await apiCall("PATCH", `/bookings/${booking2.id}/cancel`, { reason: "Post-completion cancel" }, custAHeaders);
    assert(cancelCompleted.status === 400, "Security: Cancellation of COMPLETED booking blocked with 400 Bad Request");

    // Security Test 8: State machine matrix violation (COMPLETED -> ACCEPTED)
    const matrixViolation1 = await apiCall("PATCH", `/bookings/${booking2.id}/status`, { status: "ACCEPTED" }, workerAHeaders);
    assert(matrixViolation1.status === 400, "Security: Transition from terminal COMPLETED to ACCEPTED blocked with 400 Bad Request");

    // Security Test 9: State machine matrix violation (CANCELLED -> IN_PROGRESS)
    const matrixViolation2 = await apiCall("PATCH", `/bookings/${booking1.id}/status`, { status: "IN_PROGRESS" }, workerAHeaders);
    assert(matrixViolation2.status === 400, "Security: Transition from terminal CANCELLED to IN_PROGRESS blocked with 400 Bad Request");

    // Security Test 10: Non-existent booking ID (404)
    const nonExistentBooking = await apiCall("GET", "/bookings/6af95a8fe99673593728febd", null, custAHeaders);
    assert(nonExistentBooking.status === 404, "Security: Non-existent booking ID returns 404 Not Found");

    // Security Test 11: Malformed booking payload (missing required fields)
    const malformedBooking = await apiCall("POST", "/bookings", { workerId: workerAUserId }, custAHeaders);
    assert(malformedBooking.status === 400, "Security: Missing address/city payload returns 400 Bad Request");

    // =========================================================================
    // SECTION 6: MONGODB DATABASE RECORD INTEGRITY AUDIT
    // =========================================================================
    console.log("\n--- 6. MongoDB Database Record Integrity Audit ---");

    // Check booking records
    const dbBooking = await prisma.booking.findUnique({
      where: { id: booking2.id },
      include: { customer: true, worker: true, statusHistory: true, invoices: true },
    });

    assert(dbBooking !== null, "MongoDB: Booking record retrieved successfully via Prisma");
    assert(dbBooking.status === "COMPLETED", "MongoDB: Booking status persisted as COMPLETED");
    assert(dbBooking.customerId === custAUserId, "MongoDB: Customer relationship correctly references Customer A ObjectId");
    assert(dbBooking.workerId === workerAUserId, "MongoDB: Worker relationship correctly references Worker A ObjectId");
    assert(dbBooking.totalAmount === 850 * 3, "MongoDB: Total amount is exact (₹2550)");
    assert(dbBooking.statusHistory.length >= 3, `MongoDB: Audit trail records complete history (${dbBooking.statusHistory.length} events logged)`);
    assert(dbBooking.invoices.length === 1, "MongoDB: Exactly one invoice created (no duplicate invoices)");
    assert(dbBooking.invoices[0].amount === 2550, "MongoDB: Invoice amount matches booking amount exactly");

  } catch (err) {
    console.error("Audit test error:", err);
    failed++;
  } finally {
    server.close();
    console.log(`\n======================================================`);
    console.log(`📊 Phase 8 Stage 1 Audit Summary: ${passed} PASSED, ${failed} FAILED`);
    console.log(`======================================================\n`);

    // Clean up test records
    console.log("Cleaning up test database records...");
    const userIds = [custAUserId, custBUserId, workerAUserId, workerBUserId].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.invoice.deleteMany({ where: { booking: { customerId: { in: userIds } } } }).catch(() => {});
      await prisma.bookingStatusHistory.deleteMany({ where: { booking: { customerId: { in: userIds } } } }).catch(() => {});
      await prisma.booking.deleteMany({ where: { customerId: { in: userIds } } }).catch(() => {});
      await prisma.notification.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {});
      await prisma.serviceArea.deleteMany({ where: { workerProfile: { userId: { in: userIds } } } }).catch(() => {});
      await prisma.workerProfile.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {});
      await prisma.customerProfile.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: { in: userIds } } }).catch(() => {});
    }
    await prisma.$disconnect();

    process.exit(failed > 0 ? 1 : 0);
  }
}

runCompletePhase8Audit();


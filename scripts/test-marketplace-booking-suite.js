process.env.NODE_ENV = "test";
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { app } = require(path.resolve(__dirname, "../backend/dist/server.js"));
const { prisma } = require(path.resolve(__dirname, "../backend/dist/config/prisma.js"));
const http = require("http");

async function runMarketplaceBookingSuite() {
  const PORT = 5092;
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));

  console.log(`\n======================================================`);
  console.log(`🧪 MajDur Phase 8 Stage 1: Marketplace Search & Booking Lifecycle Suite`);
  console.log(`Developer: Harsh Singh`);
  console.log(`Test Server Port: ${PORT}`);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
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
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await res.json().catch(() => ({}));
    } else {
      data = await res.text().catch(() => "");
    }
    return { status: res.status, data, headers: res.headers };
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
    // 1. SETUP: Create Customers and Workers for testing
    // =========================================================================
    console.log("--- 1. Setting up Test Users & Worker Profiles ---");

    // Register Customer A
    const regCustA = await apiCall("POST", "/auth/register/customer", {
      name: "Rohan Customer A",
      phone: custAPhone,
      email: `rohan.${baseNum}@example.com`,
      password: "Password123!",
    });
    assert(regCustA.status === 201, "Customer A registered successfully");
    custAToken = regCustA.data.data.accessToken;
    custAUserId = regCustA.data.data.user.id;

    // Register Customer B
    const regCustB = await apiCall("POST", "/auth/register/customer", {
      name: "Suresh Customer B",
      phone: custBPhone,
      email: `suresh.${baseNum}@example.com`,
      password: "Password123!",
    });
    assert(regCustB.status === 201, "Customer B registered successfully");
    custBToken = regCustB.data.data.accessToken;
    custBUserId = regCustB.data.data.user.id;

    // Register Worker A (Electrician in Noida)
    const regWorkerA = await apiCall("POST", "/auth/register/worker", {
      name: "Amit Electrician A",
      phone: workerAPhone,
      email: `amit.${baseNum}@example.com`,
      password: "Password123!",
      trade: "Electrician",
      experience: 5,
      city: "Noida",
      pincode: "201301",
    });
    assert(regWorkerA.status === 201, "Worker A registered successfully");
    workerAToken = regWorkerA.data.data.accessToken;
    workerAUserId = regWorkerA.data.data.user.id;

    // Update Worker A profile with verified status, daily rate, bio, and rating for search tests
    await prisma.workerProfile.update({
      where: { userId: workerAUserId },
      data: {
        isVerified: true,
        isAvailable: true,
        dailyRate: 950,
        hourlyRate: 150,
        experienceYears: 6,
        rating: 4.8,
        totalReviews: 12,
        completedJobs: 8,
        locationCity: "Noida",
        locationState: "Uttar Pradesh",
        locationPincode: "201301",
        bio: "Specialist in industrial wiring, inverter setup, and domestic electrical repair.",
        serviceAreas: {
          create: [
            { areaName: "Sector 62", city: "Noida", pincode: "201309", radiusKm: 15 },
            { areaName: "Indirapuram", city: "Ghaziabad", pincode: "201014", radiusKm: 20 },
          ],
        },
      },
    });

    // Register Worker B (Plumber in Delhi NCR)
    const regWorkerB = await apiCall("POST", "/auth/register/worker", {
      name: "Vikram Plumber B",
      phone: workerBPhone,
      email: `vikram.${baseNum}@example.com`,
      password: "Password123!",
      trade: "Plumber",
      experience: 2,
      city: "Delhi NCR",
      pincode: "110001",
    });
    assert(regWorkerB.status === 201, "Worker B registered successfully");
    workerBToken = regWorkerB.data.data.accessToken;
    workerBUserId = regWorkerB.data.data.user.id;

    await prisma.workerProfile.update({
      where: { userId: workerBUserId },
      data: {
        isVerified: false,
        isAvailable: false, // Intentionally unavailable for testing rejection
        dailyRate: 650,
        experienceYears: 2,
        rating: 3.8,
        completedJobs: 1,
        locationCity: "Delhi NCR",
        locationState: "Delhi",
        locationPincode: "110001",
        bio: "Basic plumbing, pipe leakage fixing, tap installation.",
      },
    });

    const custAHeaders = { Authorization: `Bearer ${custAToken}` };
    const custBHeaders = { Authorization: `Bearer ${custBToken}` };
    const workerAHeaders = { Authorization: `Bearer ${workerAToken}` };
    const workerBHeaders = { Authorization: `Bearer ${workerBToken}` };

    // =========================================================================
    // 2. ADVANCED WORKER SEARCH & MONGODB FILTERS
    // =========================================================================
    console.log("\n--- 2. Testing Advanced Worker Search & Filters ---");

    // Search all workers
    const allWorkers = await apiCall("GET", "/workers");
    assert(allWorkers.status === 200, "GET /api/workers returns 200");
    assert(Array.isArray(allWorkers.data.data.workers), "Returns array of workers");
    assert(allWorkers.data.data.pagination && allWorkers.data.data.pagination.totalResults >= 2, "Pagination metadata included");

    // Search by category
    const catSearch = await apiCall("GET", "/workers?category=Electrician");
    assert(catSearch.status === 200, "GET /api/workers?category=Electrician returns 200");
    const hasWorkerAInCat = catSearch.data.data.workers.some((w) => w.userId === workerAUserId);
    assert(hasWorkerAInCat, "Category filter returns Worker A (Electrician)");

    // Search by City
    const citySearch = await apiCall("GET", "/workers?city=Noida");
    assert(citySearch.status === 200, "GET /api/workers?city=Noida returns 200");
    const hasWorkerAInCity = citySearch.data.data.workers.some((w) => w.userId === workerAUserId);
    assert(hasWorkerAInCity, "City filter returns Worker A located in Noida");

    // Search by Service Area
    const areaSearch = await apiCall("GET", "/workers?area=Sector%2062");
    assert(areaSearch.status === 200, "GET /api/workers?area=Sector 62 returns 200");
    const hasWorkerAInArea = areaSearch.data.data.workers.some((w) => w.userId === workerAUserId);
    assert(hasWorkerAInArea, "Area filter matches operational serviceArea Sector 62");

    // Search by PIN code (serviceArea PIN)
    const pinSearch = await apiCall("GET", "/workers?pincode=201309");
    assert(pinSearch.status === 200, "GET /api/workers?pincode=201309 returns 200");
    const hasWorkerAInPin = pinSearch.data.data.workers.some((w) => w.userId === workerAUserId);
    assert(hasWorkerAInPin, "PIN filter matches operational serviceArea PIN 201309");

    // Search by Experience bounds
    const expSearch = await apiCall("GET", "/workers?minExperience=4");
    assert(expSearch.status === 200, "GET /api/workers?minExperience=4 returns 200");
    const expWorkers = expSearch.data.data.workers;
    assert(expWorkers.every((w) => w.experienceYears >= 4), "minExperience filter returns only workers with >= 4 years");

    // Search by Price bounds (dailyRate)
    const rateSearch = await apiCall("GET", "/workers?minRate=800&maxRate=1200");
    assert(rateSearch.status === 200, "GET /api/workers?minRate=800&maxRate=1200 returns 200");
    const rateWorkers = rateSearch.data.data.workers;
    assert(rateWorkers.every((w) => w.dailyRate >= 800 && w.dailyRate <= 1200), "Rate filter respects minRate and maxRate");

    // Search by Availability
    const availSearch = await apiCall("GET", "/workers?isAvailable=true");
    assert(availSearch.status === 200, "GET /api/workers?isAvailable=true returns 200");
    assert(availSearch.data.data.workers.every((w) => w.isAvailable === true), "isAvailable filter returns only available workers");

    // Search by Verification
    const verifSearch = await apiCall("GET", "/workers?isVerified=true");
    assert(verifSearch.status === 200, "GET /api/workers?isVerified=true returns 200");
    assert(verifSearch.data.data.workers.every((w) => w.isVerified === true), "isVerified filter returns only verified workers");

    // Search by Minimum Rating
    const ratingSearch = await apiCall("GET", "/workers?minRating=4.5");
    assert(ratingSearch.status === 200, "GET /api/workers?minRating=4.5 returns 200");
    assert(ratingSearch.data.data.workers.every((w) => w.rating >= 4.5), "minRating filter returns only workers with rating >= 4.5");

    // Text Search keyword
    const keywordSearch = await apiCall("GET", "/workers?search=industrial%20wiring");
    assert(keywordSearch.status === 200, "GET /api/workers?search=industrial wiring returns 200");
    assert(keywordSearch.data.data.workers.some((w) => w.userId === workerAUserId), "Keyword search matches bio content");

    // Sorting by daily rate ascending
    const sortRateAsc = await apiCall("GET", "/workers?sortBy=rate_asc");
    assert(sortRateAsc.status === 200, "GET /api/workers?sortBy=rate_asc returns 200");
    const rates = sortRateAsc.data.data.workers.map((w) => w.dailyRate);
    let isSortedAsc = true;
    for (let i = 1; i < rates.length; i++) {
      if (rates[i] < rates[i - 1]) isSortedAsc = false;
    }
    assert(isSortedAsc, "Sort by rate_asc produces non-decreasing dailyRate order");

    // Sorting by experience
    const sortExp = await apiCall("GET", "/workers?sortBy=experience");
    assert(sortExp.status === 200, "GET /api/workers?sortBy=experience returns 200");

    // Pagination verification
    const pageCheck = await apiCall("GET", "/workers?page=1&limit=1");
    assert(pageCheck.status === 200, "GET /api/workers?page=1&limit=1 returns 200");
    assert(pageCheck.data.data.workers.length === 1, "Limit parameter correctly restricts result count to 1");
    assert(pageCheck.data.data.pagination.currentPage === 1, "Pagination currentPage is 1");
    assert(pageCheck.data.data.pagination.pageSize === 1, "Pagination pageSize is 1");
    assert(pageCheck.data.data.pagination.hasNextPage === true, "Pagination hasNextPage is true");

    // Search alias endpoint verification
    const aliasSearch = await apiCall("GET", "/workers/search?city=Noida");
    assert(aliasSearch.status === 200, "GET /api/workers/search alias returns 200");
    assert(aliasSearch.data.data.workers.some((w) => w.userId === workerAUserId), "Alias endpoint returns matching workers");

    // =========================================================================
    // 3. BOOKING CREATION & VALIDATION CHECKS
    // =========================================================================
    console.log("\n--- 3. Testing Booking Creation & Input Validation ---");

    // Unauthenticated booking creation rejected with 401
    const unauthBooking = await apiCall("POST", "/bookings", {
      workerId: workerAUserId,
      startDate: new Date(Date.now() + 86400000).toISOString(),
      address: "Tower B, Sector 62",
      city: "Noida",
    });
    assert(unauthBooking.status === 401, "Unauthenticated POST /bookings rejected with 401");

    // Self-booking rejection check
    const selfBooking = await apiCall(
      "POST",
      "/bookings",
      {
        workerId: workerAUserId,
        startDate: new Date(Date.now() + 86400000).toISOString(),
        address: "Self address",
        city: "Noida",
      },
      workerAHeaders
    );
    assert(selfBooking.status === 400, "User attempting to book themselves rejected with 400");
    assert(selfBooking.data.message.includes("own services"), "Rejection message specifies cannot book own services");

    // Booking unavailable worker rejected
    const unavailBooking = await apiCall(
      "POST",
      "/bookings",
      {
        workerId: workerBUserId,
        startDate: new Date(Date.now() + 86400000).toISOString(),
        address: "Laxmi Nagar",
        city: "Delhi NCR",
      },
      custAHeaders
    );
    assert(unavailBooking.status === 400, "Booking unavailable worker rejected with 400");
    assert(unavailBooking.data.message.includes("unavailable"), "Rejection message mentions worker is unavailable");

    // Start date in past rejected
    const pastDateBooking = await apiCall(
      "POST",
      "/bookings",
      {
        workerId: workerAUserId,
        startDate: "2020-01-01T00:00:00.000Z",
        address: "Sector 62",
        city: "Noida",
      },
      custAHeaders
    );
    assert(pastDateBooking.status === 400, "Booking with start date in past rejected with 400");

    // Valid booking creation by Customer A for Worker A
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const validBookingRes = await apiCall(
      "POST",
      "/bookings",
      {
        workerId: workerAUserId,
        serviceCategory: "Electrical Installation",
        startDate: tomorrow,
        totalDays: 2,
        address: "Flat 402, Prateek Fedora, Sector 62",
        city: "Noida",
        notes: "Require full inverter wiring and switchboard replacement.",
      },
      custAHeaders
    );

    assert(validBookingRes.status === 201, "Customer creates valid booking request (201 Created)");
    const booking1 = validBookingRes.data.data;
    assert(booking1.status === "REQUESTED", "Initial status is 'REQUESTED'");
    assert(booking1.totalDays === 2, "Booking totalDays is 2");
    assert(booking1.totalAmount === 950 * 2, "Booking totalAmount computed correctly (₹950 * 2 = ₹1900)");
    assert(booking1.bookingNumber.startsWith("MD-"), "Booking assigned unique reference number");

    // =========================================================================
    // 4. BOOKING LIFECYCLE: ACCEPT -> IN_PROGRESS -> COMPLETED
    // =========================================================================
    console.log("\n--- 4. Testing Complete Booking Lifecycle (Accept -> In Progress -> Complete) ---");

    // Unauthorized worker B cannot accept Worker A's booking
    const unauthAccept = await apiCall(
      "PATCH",
      `/bookings/${booking1.id}/accept`,
      { note: "Hacker trying to accept" },
      workerBHeaders
    );
    assert(unauthAccept.status === 403, "Worker B attempting to accept Worker A's booking rejected with 403 (IDOR)");

    // Customer cannot accept their own booking
    const custAccept = await apiCall(
      "PATCH",
      `/bookings/${booking1.id}/accept`,
      { note: "Customer accepts" },
      custAHeaders
    );
    assert(custAccept.status === 403, "Customer attempting to accept booking rejected with 403");

    // Worker A accepts booking
    const workerAccept = await apiCall(
      "PATCH",
      `/bookings/${booking1.id}/accept`,
      { note: "I will arrive at 9:00 AM sharp with required equipment." },
      workerAHeaders
    );
    assert(workerAccept.status === 200, "Worker A accepts booking request (200 OK)");
    assert(workerAccept.data.data.status === "ACCEPTED", "Booking status is now 'ACCEPTED'");

    // Accepting already accepted booking is rejected
    const reAccept = await apiCall(
      "PATCH",
      `/bookings/${booking1.id}/accept`,
      {},
      workerAHeaders
    );
    assert(reAccept.status === 400, "Cannot accept already accepted booking (400 Bad Request)");

    // Worker transitions booking to IN_PROGRESS
    const inProgressRes = await apiCall(
      "PATCH",
      `/bookings/${booking1.id}/status`,
      { status: "IN_PROGRESS", note: "Tools unpacked and work commenced on site." },
      workerAHeaders
    );
    assert(inProgressRes.status === 200, "Worker transitions booking to 'IN_PROGRESS' (200 OK)");
    assert(inProgressRes.data.data.status === "IN_PROGRESS", "Booking status is 'IN_PROGRESS'");

    // Customer cannot advance execution to COMPLETED
    const custComplete = await apiCall(
      "PATCH",
      `/bookings/${booking1.id}/status`,
      { status: "COMPLETED" },
      custAHeaders
    );
    assert(custComplete.status === 403, "Customer attempting to transition execution to COMPLETED rejected with 403");

    // Worker marks work COMPLETED
    const initialJobs = (await prisma.workerProfile.findUnique({ where: { userId: workerAUserId } })).completedJobs;
    const completeRes = await apiCall(
      "PATCH",
      `/bookings/${booking1.id}/status`,
      { status: "COMPLETED", note: "Inverter setup and rewiring completed successfully." },
      workerAHeaders
    );
    assert(completeRes.status === 200, "Worker marks work 'COMPLETED' (200 OK)");
    assert(completeRes.data.data.status === "COMPLETED", "Booking status is 'COMPLETED'");

    // Verify invoice auto-generation on completion
    const invoice = await prisma.invoice.findFirst({ where: { bookingId: booking1.id } });
    assert(invoice !== null && invoice.totalAmount === 1900, "Invoice auto-generated with correct total ₹1900");

    // Verify worker completedJobs counter incremented
    const updatedWorkerProfile = await prisma.workerProfile.findUnique({ where: { userId: workerAUserId } });
    assert(updatedWorkerProfile.completedJobs === initialJobs + 1, "Worker profile completedJobs incremented by 1");

    // =========================================================================
    // 5. STATE MACHINE VALIDATION MATRIX: REJECT ILLEGAL TRANSITIONS
    // =========================================================================
    console.log("\n--- 5. Testing State Machine Validation Matrix ---");

    // Illegal transition: COMPLETED -> ACCEPTED
    const illegalTrans1 = await apiCall(
      "PATCH",
      `/bookings/${booking1.id}/status`,
      { status: "ACCEPTED" },
      workerAHeaders
    );
    assert(illegalTrans1.status === 400, "Transition from COMPLETED to ACCEPTED rejected with 400");
    assert(illegalTrans1.data.message.includes("Invalid status transition"), "Error specifies invalid transition");

    // Illegal transition: COMPLETED -> IN_PROGRESS
    const illegalTrans2 = await apiCall(
      "PATCH",
      `/bookings/${booking1.id}/status`,
      { status: "IN_PROGRESS" },
      workerAHeaders
    );
    assert(illegalTrans2.status === 400, "Transition from COMPLETED to IN_PROGRESS rejected with 400");

    // Attempting to cancel COMPLETED booking must fail
    const illegalCancel = await apiCall(
      "PATCH",
      `/bookings/${booking1.id}/cancel`,
      { reason: "Cancel after done" },
      custAHeaders
    );
    assert(illegalCancel.status === 400, "Attempt to cancel COMPLETED booking rejected with 400");

    // =========================================================================
    // 6. CANCELLATION FLOW & IDOR CHECKS
    // =========================================================================
    console.log("\n--- 6. Testing Cancellation Flow & IDOR Security ---");

    // Create a 2nd booking to test cancellation
    const booking2Res = await apiCall(
      "POST",
      "/bookings",
      {
        workerId: workerAUserId,
        serviceCategory: "Switchboard Fix",
        startDate: tomorrow,
        totalDays: 1,
        address: "House 10, Sector 12",
        city: "Noida",
      },
      custAHeaders
    );
    const booking2 = booking2Res.data.data;
    assert(booking2.status === "REQUESTED", "Booking 2 created in 'REQUESTED' status");

    // Customer B attempts to cancel Customer A's booking (IDOR)
    const idorCancel = await apiCall(
      "PATCH",
      `/bookings/${booking2.id}/cancel`,
      { reason: "Malicious cancel" },
      custBHeaders
    );
    assert(idorCancel.status === 403, "Customer B cannot cancel Customer A's booking (403 IDOR blocked)");

    // Customer A cancels their own booking
    const cancelRes = await apiCall(
      "PATCH",
      `/bookings/${booking2.id}/cancel`,
      { reason: "Plans changed, will reschedule later" },
      custAHeaders
    );
    assert(cancelRes.status === 200, "Customer A successfully cancels booking (200 OK)");
    assert(cancelRes.data.data.status === "CANCELLED", "Booking status is now 'CANCELLED'");

    // Illegal transition: CANCELLED -> IN_PROGRESS rejected
    const illegalTrans3 = await apiCall(
      "PATCH",
      `/bookings/${booking2.id}/status`,
      { status: "IN_PROGRESS" },
      workerAHeaders
    );
    assert(illegalTrans3.status === 400, "Transition from CANCELLED to IN_PROGRESS rejected with 400");

    // =========================================================================
    // 7. WORKER REJECT FLOW
    // =========================================================================
    console.log("\n--- 7. Testing Worker Reject Flow ---");

    // Create a 3rd booking to test worker rejection
    const booking3Res = await apiCall(
      "POST",
      "/bookings",
      {
        workerId: workerAUserId,
        serviceCategory: "Heavy Industrial Setup",
        startDate: tomorrow,
        totalDays: 3,
        address: "Industrial Area Site 4",
        city: "Greater Noida",
      },
      custAHeaders
    );
    const booking3 = booking3Res.data.data;

    // Worker B attempts to reject Worker A's booking (IDOR)
    const idorReject = await apiCall(
      "PATCH",
      `/bookings/${booking3.id}/reject`,
      { reason: "Malicious decline" },
      workerBHeaders
    );
    assert(idorReject.status === 403, "Worker B cannot decline Worker A's booking (403 IDOR blocked)");

    // Worker A declines the booking
    const workerRejectRes = await apiCall(
      "PATCH",
      `/bookings/${booking3.id}/reject`,
      { reason: "Unavailable due to prior contractor commitments on requested dates" },
      workerAHeaders
    );
    assert(workerRejectRes.status === 200, "Worker A declines booking (200 OK)");
    assert(workerRejectRes.data.data.status === "REJECTED", "Booking status is 'REJECTED'");

    // Cannot reject already rejected booking
    const reReject = await apiCall(
      "PATCH",
      `/bookings/${booking3.id}/reject`,
      {},
      workerAHeaders
    );
    assert(reReject.status === 400, "Cannot decline already rejected booking (400 Bad Request)");

    // =========================================================================
    // 8. DISPUTE LIFECYCLE FLOW
    // =========================================================================
    console.log("\n--- 8. Testing Dispute Lifecycle Flow ---");

    // Create a 4th booking to test dispute
    const booking4Res = await apiCall(
      "POST",
      "/bookings",
      {
        workerId: workerAUserId,
        serviceCategory: "Emergency Wiring",
        startDate: tomorrow,
        totalDays: 1,
        address: "Apartment 101, Expressway",
        city: "Noida",
      },
      custAHeaders
    );
    const booking4 = booking4Res.data.data;

    // Worker accepts and starts work
    await apiCall("PATCH", `/bookings/${booking4.id}/accept`, {}, workerAHeaders);
    await apiCall("PATCH", `/bookings/${booking4.id}/status`, { status: "IN_PROGRESS" }, workerAHeaders);

    // Customer raises dispute on IN_PROGRESS booking
    const disputeRes = await apiCall(
      "PATCH",
      `/bookings/${booking4.id}/status`,
      { status: "DISPUTED", note: "Artisan arrived late and damaged switch plate." },
      custAHeaders
    );
    assert(disputeRes.status === 200, "Customer raises dispute on in-progress booking (200 OK)");
    assert(disputeRes.data.data.status === "DISPUTED", "Booking status is now 'DISPUTED'");

    // =========================================================================
    // 9. READ LISTS & DETAIL IDOR ACCESS SECURITY
    // =========================================================================
    console.log("\n--- 9. Testing Booking Read Queries & Detail IDOR Protection ---");

    // Customer A queries their bookings
    const custBookings = await apiCall("GET", "/bookings", null, custAHeaders);
    assert(custBookings.status === 200, "Customer retrieves their bookings list (200 OK)");
    assert(custBookings.data.data.bookings.length >= 4, "Customer A sees all their initiated bookings");
    assert(custBookings.data.data.bookings.every((b) => b.customerId === custAUserId), "All bookings belong to Customer A");

    // Worker A queries their work assignments
    const workerBookings = await apiCall("GET", "/bookings", null, workerAHeaders);
    assert(workerBookings.status === 200, "Worker retrieves their bookings list (200 OK)");
    assert(workerBookings.data.data.bookings.every((b) => b.workerId === workerAUserId), "All bookings assigned to Worker A");

    // Single booking detail view by participant
    const detailRes = await apiCall("GET", `/bookings/${booking1.id}`, null, custAHeaders);
    assert(detailRes.status === 200, "Customer A views their own booking detail (200 OK)");
    assert(detailRes.data.data.id === booking1.id, "Detail record matches requested ID");
    assert(Array.isArray(detailRes.data.data.statusHistory), "Includes statusHistory audit timeline");

    // IDOR check: Customer B cannot view Customer A's booking detail
    const idorDetail = await apiCall("GET", `/bookings/${booking1.id}`, null, custBHeaders);
    assert(idorDetail.status === 403, "Customer B attempting to view Customer A's booking rejected with 403 (IDOR)");

  } catch (err) {
    console.error("Test execution exception:", err);
    failed++;
  } finally {
    server.close();
    console.log(`\n======================================================`);
    console.log(`📊 Phase 8 Stage 1 Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log(`======================================================\n`);

    // Clean up test data
    console.log("Cleaning up test database records...");
    const validUserIds = [custAUserId, custBUserId, workerAUserId, workerBUserId].filter(Boolean);
    if (validUserIds.length > 0) {
      await prisma.invoice.deleteMany({ where: { booking: { customerId: { in: validUserIds } } } }).catch(() => {});
      await prisma.bookingStatusHistory.deleteMany({ where: { booking: { customerId: { in: validUserIds } } } }).catch(() => {});
      await prisma.booking.deleteMany({ where: { customerId: { in: validUserIds } } }).catch(() => {});
      await prisma.notification.deleteMany({ where: { userId: { in: validUserIds } } }).catch(() => {});
      await prisma.serviceArea.deleteMany({ where: { workerProfile: { userId: { in: validUserIds } } } }).catch(() => {});
      await prisma.workerProfile.deleteMany({ where: { userId: { in: validUserIds } } }).catch(() => {});
      await prisma.customerProfile.deleteMany({ where: { userId: { in: validUserIds } } }).catch(() => {});
    }
    await prisma.user.deleteMany({ where: { phone: { in: [custAPhone, custBPhone, workerAPhone, workerBPhone] } } }).catch(() => {});
    await prisma.$disconnect();

    process.exit(failed > 0 ? 1 : 0);
  }
}

runMarketplaceBookingSuite();

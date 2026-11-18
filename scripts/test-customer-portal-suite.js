process.env.NODE_ENV = "test";
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { app } = require(path.resolve(__dirname, "../backend/dist/server.js"));
const { prisma } = require(path.resolve(__dirname, "../backend/dist/config/prisma.js"));
const http = require("http");

async function runCustomerPortalSuite() {
  const PORT = 5089;
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`\n=========================================`);
  console.log(`🧪 MajDur Phase 5 Customer Portal Test Suite`);
  console.log(`Developer: Harsh Singh`);
  console.log(`Test Server Port: ${PORT}`);
  console.log(`=========================================\n`);

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
    const contentType = res.headers.get("content-type") || "";
    let data;
    if (contentType.includes("application/json")) {
      data = await res.json().catch(() => ({}));
    } else if (contentType.includes("application/pdf")) {
      const arrayBuffer = await res.arrayBuffer();
      data = Buffer.from(arrayBuffer);
    } else {
      data = await res.text().catch(() => "");
    }
    const setCookie = res.headers.get("set-cookie");
    return { status: res.status, data, headers: res.headers, setCookie };
  }

  const baseNum = Date.now().toString().slice(-9);
  const custAPhone = `9${baseNum}`;
  const custBPhone = `8${baseNum}`;
  const workerPhone = `7${baseNum}`;

  try {
    // ----------------------------------------------------
    // SETUP: Register Customer A, Customer B, and Worker
    // ----------------------------------------------------
    const regCustA = await apiCall("POST", "/auth/register/customer", {
      name: "Rohan Customer A",
      phone: custAPhone,
      email: `rohan.${baseNum}@example.com`,
      password: "Password123!",
    });
    assert(regCustA.status === 201, "Setup: Customer A registered");
    const custAToken = regCustA.data.data.accessToken;
    const custAId = regCustA.data.data.user.id;
    const custAHeaders = { Authorization: `Bearer ${custAToken}` };

    const regCustB = await apiCall("POST", "/auth/register/customer", {
      name: "Suresh Customer B",
      phone: custBPhone,
      email: `suresh.${baseNum}@example.com`,
      password: "Password123!",
    });
    assert(regCustB.status === 201, "Setup: Customer B registered");
    const custBToken = regCustB.data.data.accessToken;
    const custBHeaders = { Authorization: `Bearer ${custBToken}` };

    const regWorker = await apiCall("POST", "/auth/register/worker", {
      name: "Mukesh Mason",
      phone: workerPhone,
      email: `mukesh.${baseNum}@example.com`,
      password: "Password123!",
      trade: "mason",
      experienceYears: 6,
      city: "Noida",
      dailyRate: 900,
    });
    assert(regWorker.status === 201, "Setup: Worker registered");
    const workerToken = regWorker.data.data.accessToken;
    const workerId = regWorker.data.data.user.id;
    const workerHeaders = { Authorization: `Bearer ${workerToken}` };

    // ----------------------------------------------------
    // MODULE 1: Customer Dashboard Metrics
    // ----------------------------------------------------
    const dashRes = await apiCall("GET", "/customer/dashboard", null, custAHeaders);
    assert(dashRes.status === 200, "GET /customer/dashboard returns 200 OK");
    assert(dashRes.data.data.stats.totalBookings === 0, "Dashboard stats: initial bookings count is 0");
    assert(dashRes.data.data.stats.totalSpent === 0, "Dashboard stats: initial totalSpent is 0");
    assert(Array.isArray(dashRes.data.data.recentBookings), "Dashboard returns recentBookings array");

    // ----------------------------------------------------
    // MODULE 2: Customer Profile & Addresses
    // ----------------------------------------------------
    const profRes = await apiCall("GET", "/customer/profile", null, custAHeaders);
    assert(profRes.status === 200, "GET /customer/profile returns 200 OK");
    assert(profRes.data.data.name === "Rohan Customer A", "Profile matches registered name");

    const updateProfRes = await apiCall("PUT", "/customer/profile", {
      name: "Rohan Verma",
      city: "Gurugram",
      state: "Haryana",
      pincode: "122001",
    }, custAHeaders);
    assert(updateProfRes.status === 200, "PUT /customer/profile updates user and customerProfile");
    assert(updateProfRes.data.data.user.name === "Rohan Verma", "Profile name updated to 'Rohan Verma'");
    assert(updateProfRes.data.data.customerProfile.city === "Gurugram", "CustomerProfile city updated to 'Gurugram'");

    // Address CRUD
    const addAddressRes = await apiCall("POST", "/customer/addresses", {
      title: "Home Villa",
      line1: "House 42, Sector 15",
      area: "South City",
      city: "Gurugram",
      state: "Haryana",
      pincode: "122001",
      isDefault: true,
    }, custAHeaders);
    assert(addAddressRes.status === 201, "POST /customer/addresses creates new address");
    const addressId = addAddressRes.data.data.id;
    assert(addAddressRes.data.data.isDefault === true, "Address marked as default");

    const updateAddressRes = await apiCall("PUT", `/customer/addresses/${addressId}`, {
      line2: "Near Huda City Center",
    }, custAHeaders);
    assert(updateAddressRes.status === 200, "PUT /customer/addresses/:id updates address line2");

    const deleteAddressRes = await apiCall("DELETE", `/customer/addresses/${addressId}`, null, custAHeaders);
    assert(deleteAddressRes.status === 200, "DELETE /customer/addresses/:id removes address");

    // ----------------------------------------------------
    // MODULE 3: Worker Directory Search & Detail
    // ----------------------------------------------------
    const searchRes = await apiCall("GET", `/workers?city=Noida`, null, custAHeaders);
    assert(searchRes.status === 200, "GET /workers with city filter returns 200 OK");
    assert(Array.isArray(searchRes.data.data.workers), "Worker search returns array of workers");

    const workerDetailRes = await apiCall("GET", `/workers/${workerId}`);
    assert(workerDetailRes.status === 200, "GET /workers/:id returns worker profile");
    assert(workerDetailRes.data.data.user.name === "Mukesh Mason", "Worker name verified");
    assert(Array.isArray(workerDetailRes.data.data.reviews), "Worker details includes reviews array");

    // ----------------------------------------------------
    // MODULE 4: Booking Creation, Tracking & IDOR Protection
    // ----------------------------------------------------
    const createBookingRes = await apiCall("POST", "/bookings", {
      workerId,
      serviceCategory: "Mason / Rajmistri",
      startDate: new Date(Date.now() + 86400000).toISOString(),
      totalDays: 2,
      address: "Tower B, Apartment 401, Sector 62",
      city: "Noida",
      notes: "Boundary wall plastering work",
    }, custAHeaders);

    assert(createBookingRes.status === 201, "POST /bookings creates booking request with status 201");
    const booking = createBookingRes.data.data;
    const bookingId = booking.id;
    assert(booking.status === "REQUESTED", "Booking initial status is REQUESTED");
    assert(booking.bookingNumber.startsWith("MD-"), "Booking number has prefix MD-YYYY-");
    assert(booking.totalAmount === 1800, "Booking total amount calculated correctly (900 * 2 = 1800)");

    // Customer A can view their booking
    const getBookingRes = await apiCall("GET", `/bookings/${bookingId}`, null, custAHeaders);
    assert(getBookingRes.status === 200, "Customer A can view their booking details");

    // IDOR Check: Customer B tries to view Customer A's booking
    const idorViewRes = await apiCall("GET", `/bookings/${bookingId}`, null, custBHeaders);
    assert(idorViewRes.status === 403, "IDOR: Customer B blocked from viewing Customer A's booking with 403");

    // IDOR Check: Customer B tries to cancel Customer A's booking
    const idorCancelRes = await apiCall("PATCH", `/bookings/${bookingId}/cancel`, { reason: "Malicious cancel" }, custBHeaders);
    assert(idorCancelRes.status === 403, "IDOR: Customer B blocked from cancelling Customer A's booking with 403");

    // ----------------------------------------------------
    // MODULE 5: Reviews & Completion Enforcement
    // ----------------------------------------------------
    // Customer A attempts to review before completion -> MUST FAIL
    const prematureReviewRes = await apiCall("POST", "/reviews", {
      bookingId,
      rating: 5,
      comment: "Great work!",
    }, custAHeaders);
    assert(prematureReviewRes.status === 400, "Reviewing incomplete booking is rejected with 400 Bad Request");

    // Progress booking through lifecycle: REQUESTED -> ACCEPTED -> COMPLETED
    const acceptRes = await apiCall("PATCH", `/bookings/${bookingId}/status`, { status: "ACCEPTED" }, workerHeaders);
    assert(acceptRes.status === 200, "Worker accepts booking request -> status ACCEPTED");

    const completeRes = await apiCall("PATCH", `/bookings/${bookingId}/status`, { status: "COMPLETED", note: "Plaster work finished cleanly" }, workerHeaders);
    assert(completeRes.status === 200, "Worker marks booking COMPLETED -> status COMPLETED");
    assert(completeRes.data.data.status === "COMPLETED", "Booking confirmed completed");

    // Review submission now succeeds
    const submitReviewRes = await apiCall("POST", "/reviews", {
      bookingId,
      rating: 5,
      comment: "Excellent craftsmanship and punctual! Very satisfied.",
    }, custAHeaders);
    assert(submitReviewRes.status === 201, "POST /reviews succeeds for completed booking with 201 Created");
    assert(submitReviewRes.data.data.rating === 5, "Submitted review rating is 5 stars");

    // Duplicate review attempt -> MUST FAIL with 409 Conflict
    const dupReviewRes = await apiCall("POST", "/reviews", {
      bookingId,
      rating: 4,
      comment: "Trying duplicate review",
    }, custAHeaders);
    assert(dupReviewRes.status === 409, "Duplicate review for same booking is rejected with 409 Conflict");

    // Verify Worker's profile rating recalculated in DB
    const updatedWorker = await apiCall("GET", `/workers/${workerId}`);
    assert(updatedWorker.data.data.rating >= 4.5, "Worker genuine rating recalculated in MongoDB");
    assert(updatedWorker.data.data.reviews.length >= 1, "Worker profile includes the submitted review");

    // ----------------------------------------------------
    // MODULE 6: Invoices & PDF Generation
    // ----------------------------------------------------
    const invoicesRes = await apiCall("GET", "/invoices", null, custAHeaders);
    assert(invoicesRes.status === 200, "GET /invoices returns 200 OK");
    assert(invoicesRes.data.data.length >= 1, "Completed booking automatically generated official invoice");
    const invoice = invoicesRes.data.data[0];
    const invoiceId = invoice.id;
    assert(invoice.invoiceNumber.startsWith("INV-"), "Invoice number format INV-YYYY- verified");
    assert(invoice.totalAmount === 1800, "Invoice total amount matches booking (₹1800)");

    // IDOR Check: Customer B tries to download Customer A's invoice
    const idorPdfRes = await apiCall("GET", `/invoices/${invoiceId}/download`, null, custBHeaders);
    assert(idorPdfRes.status === 403, "IDOR: Customer B blocked from downloading Customer A's invoice with 403");

    // Customer A downloads valid PDF invoice
    const downloadPdfRes = await apiCall("GET", `/invoices/${invoiceId}/download`, null, custAHeaders);
    assert(downloadPdfRes.status === 200, "Customer A downloads invoice PDF with 200 OK");
    assert(downloadPdfRes.headers.get("content-type") === "application/pdf", "Content-Type is application/pdf");
    // Check %PDF- header magic bytes
    const pdfMagic = downloadPdfRes.data.slice(0, 5).toString("utf-8");
    assert(pdfMagic === "%PDF-", "Generated file is a valid binary PDF with '%PDF-' header");

    // ----------------------------------------------------
    // MODULE 7: Customer Notifications
    // ----------------------------------------------------
    const notifsRes = await apiCall("GET", "/notifications", null, custAHeaders);
    assert(notifsRes.status === 200, "GET /notifications returns 200 OK");
    assert(notifsRes.data.data.notifications.length >= 1, "Customer received automated system notifications");
    const notifId = notifsRes.data.data.notifications[0].id;

    const readNotifRes = await apiCall("PATCH", `/notifications/${notifId}/read`, null, custAHeaders);
    assert(readNotifRes.status === 200, "PATCH /notifications/:id/read marks notification as read");
    assert(readNotifRes.data.data.isRead === true, "Notification isRead is true");

    const readAllRes = await apiCall("PATCH", "/notifications/read-all", null, custAHeaders);
    assert(readAllRes.status === 200, "PATCH /notifications/read-all marks all unread as read");

    // ----------------------------------------------------
    // MODULE 8: Booking Cancellation Workflow
    // ----------------------------------------------------
    const secondBookingRes = await apiCall("POST", "/bookings", {
      workerId,
      serviceCategory: "Mason / Rajmistri",
      startDate: new Date(Date.now() + 172800000).toISOString(),
      totalDays: 1,
      address: "Phase 2, Site 12",
      city: "Noida",
    }, custAHeaders);
    const secondBookingId = secondBookingRes.data.data.id;

    const cancelRes = await apiCall("PATCH", `/bookings/${secondBookingId}/cancel`, {
      reason: "Plans changed, scheduling next month",
    }, custAHeaders);
    assert(cancelRes.status === 200, "Customer A successfully cancels eligible pending booking");
    assert(cancelRes.data.data.status === "CANCELLED", "Booking status updated to CANCELLED");

    // ----------------------------------------------------
    // MODULE 9: Customer Password Change
    // ----------------------------------------------------
    const changePassRes = await apiCall("PUT", "/customer/change-password", {
      currentPassword: "Password123!",
      newPassword: "NewSecretPassword456!",
      confirmPassword: "NewSecretPassword456!",
    }, custAHeaders);
    assert(changePassRes.status === 200, "PUT /customer/change-password updates customer password");

    // Verify login works with new password
    const reLoginRes = await apiCall("POST", "/auth/login", {
      identifier: custAPhone,
      password: "NewSecretPassword456!",
      role: "CUSTOMER",
    });
    assert(reLoginRes.status === 200, "Customer signs in successfully with new password");

    // Verify updated dashboard metrics
    const finalDashRes = await apiCall("GET", "/customer/dashboard", null, custAHeaders);
    assert(finalDashRes.data.data.stats.totalBookings === 2, "Final dashboard: total bookings = 2");
    assert(finalDashRes.data.data.stats.completedBookings === 1, "Final dashboard: completed bookings = 1");
    assert(finalDashRes.data.data.stats.cancelledBookings === 1, "Final dashboard: cancelled bookings = 1");
    assert(finalDashRes.data.data.stats.totalSpent === 1800, "Final dashboard: totalSpent = ₹1800");

  } catch (err) {
    console.error("Test execution exception:", err);
    failed++;
  } finally {
    server.close();
    console.log(`\n=========================================`);
    console.log(`📊 Phase 5 Customer Portal Results: ${passed} PASSED, ${failed} FAILED`);
    console.log(`=========================================\n`);
    
    // Clean up test users from DB
    await prisma.review.deleteMany({ where: { comment: { contains: "craftsmanship" } } }).catch(() => {});
    await prisma.invoice.deleteMany({ where: { invoiceNumber: { startsWith: "INV-" } } }).catch(() => {});
    await prisma.booking.deleteMany({ where: { city: "Noida" } }).catch(() => {});
    await prisma.notification.deleteMany({ where: { user: { phone: { in: [custAPhone, custBPhone, workerPhone] } } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { phone: { in: [custAPhone, custBPhone, workerPhone] } } }).catch(() => {});
    await prisma.$disconnect();

    process.exit(failed > 0 ? 1 : 0);
  }
}

runCustomerPortalSuite();


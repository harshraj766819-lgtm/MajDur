/**
 * MajDur Phase 8 Stage 2: Notifications Engine Test Suite
 * Developer: Harsh Singh
 */
process.env.NODE_ENV = "test";
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { app } = require(path.resolve(__dirname, "../backend/dist/server.js"));
const { prisma } = require(path.resolve(__dirname, "../backend/dist/config/prisma.js"));
const { NotificationService } = require(path.resolve(__dirname, "../backend/dist/services/notification.service.js"));
const { signAccessToken } = require(path.resolve(__dirname, "../backend/dist/utils/token.js"));
const http = require("http");

async function runNotificationsTestSuite() {
  const PORT = 5092;
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));

  console.log(`\n======================================================`);
  console.log(`🔔 MajDur Phase 8 Stage 2: Notifications Engine Test Suite`);
  console.log(`Test Port: ${PORT}`);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = "") {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message} - ${details}`);
      failed++;
    }
  }

  async function apiCall(method, endpoint, body = null, token = null) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`http://localhost:${PORT}/api${endpoint}`, opts);
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, ok: res.ok, data };
  }

  // Create isolated test users
  const timestamp = Date.now();
  let userA, userB;
  let tokenA, tokenB;
  let createdNotifIds = [];

  try {
    userA = await prisma.user.create({
      data: {
        name: `Test Customer Notif ${timestamp}`,
        phone: `9${timestamp.toString().slice(-9)}`,
        email: `notif.userA.${timestamp}@majdur.test`,
        password: "hashed_test_password",
        role: "CUSTOMER",
      },
    });

    userB = await prisma.user.create({
      data: {
        name: `Test Worker Notif ${timestamp}`,
        phone: `9${(timestamp + 1).toString().slice(-9)}`,
        email: `notif.userB.${timestamp}@majdur.test`,
        password: "hashed_test_password",
        role: "WORKER",
      },
    });

    tokenA = signAccessToken({
      userId: userA.id,
      role: userA.role,
      name: userA.name,
      phone: userA.phone,
      email: userA.email,
    });

    tokenB = signAccessToken({
      userId: userB.id,
      role: userB.role,
      name: userB.name,
      phone: userB.phone,
      email: userB.email,
    });

    console.log(`Created test users: UserA (${userA.id}), UserB (${userB.id})`);

    // 1. Initial unread count should be 0
    const initialCount = await apiCall("GET", "/notifications/unread-count", null, tokenA);
    assert(initialCount.status === 200, "GET /notifications/unread-count returns 200");
    assert(initialCount.data?.data?.unreadCount === 0, "Initial unread count is 0");

    // 2. Unauthenticated request to /notifications rejected
    const unauthRes = await apiCall("GET", "/notifications");
    assert(unauthRes.status === 401, "GET /notifications without token returns 401 Unauthorized");

    // 3. Create notifications via NotificationService
    const notif1 = await NotificationService.createNotification({
      userId: userA.id,
      title: "Booking Confirmed",
      message: "Your booking for Electrician has been accepted.",
      type: "BOOKING_ACCEPTED",
      link: "/dashboard/customer/bookings/test-1",
    });
    assert(notif1 !== null && notif1.id, "NotificationService.createNotification persists record to MongoDB");
    if (notif1) createdNotifIds.push(notif1.id);

    const notif2 = await NotificationService.createNotification({
      userId: userA.id,
      title: "Work Started",
      message: "Artisan Ramesh has started work on your site.",
      type: "WORK_STARTED",
      link: "/dashboard/customer/bookings/test-1",
    });
    if (notif2) createdNotifIds.push(notif2.id);

    const notifB = await NotificationService.createNotification({
      userId: userB.id,
      title: "New Booking Request",
      message: "You have a new hiring request from Amit.",
      type: "BOOKING_REQUEST",
    });
    if (notifB) createdNotifIds.push(notifB.id);

    // 4. Verify unread count updated
    const countAfter = await apiCall("GET", "/notifications/unread-count", null, tokenA);
    assert(countAfter.data?.data?.unreadCount === 2, "Unread count for UserA is now 2");

    // 5. Query notifications with pagination
    const listRes = await apiCall("GET", "/notifications?page=1&limit=10", null, tokenA);
    assert(listRes.status === 200, "GET /notifications returns 200 OK");
    assert(listRes.data?.data?.notifications?.length === 2, "UserA receives exactly their 2 notifications");
    assert(listRes.data?.data?.pagination?.totalResults === 2, "Pagination totalResults is 2");
    assert(listRes.data?.data?.notifications[0].id === notif2.id, "Notifications ordered newest first");

    // 6. User isolation check: UserA does NOT see UserB's notification
    const userAIds = listRes.data?.data?.notifications?.map((n) => n.id) || [];
    assert(!userAIds.includes(notifB.id), "UserA cannot see notifications belonging to UserB");

    // 7. Mark one notification as read
    const readRes = await apiCall("PATCH", `/notifications/${notif1.id}/read`, null, tokenA);
    assert(readRes.status === 200, "PATCH /notifications/:id/read returns 200 OK");
    assert(readRes.data?.data?.isRead === true, "Notification isRead updated to true");
    assert(readRes.data?.data?.readAt !== null, "Notification readAt timestamp is recorded");

    // 8. Verify unread count dropped to 1
    const countAfterRead = await apiCall("GET", "/notifications/unread-count", null, tokenA);
    assert(countAfterRead.data?.data?.unreadCount === 1, "Unread count dropped to 1");

    // 9. IDOR Check: UserB cannot mark UserA's notification as read
    const idorRead = await apiCall("PATCH", `/notifications/${notif2.id}/read`, null, tokenB);
    assert(idorRead.status === 403 || idorRead.status === 404, "IDOR: UserB cannot mark UserA notification as read (returns 403/404)");

    // 10. Filter unreadOnly
    const unreadOnlyRes = await apiCall("GET", "/notifications?unread=true", null, tokenA);
    assert(unreadOnlyRes.data?.data?.notifications?.length === 1, "Filter ?unread=true returns only 1 unread notification");
    assert(unreadOnlyRes.data?.data?.notifications[0].id === notif2.id, "Correct unread notification returned");

    // 11. Mark all as read
    const readAllRes = await apiCall("PATCH", "/notifications/read-all", null, tokenA);
    assert(readAllRes.status === 200, "PATCH /notifications/read-all returns 200 OK");

    const countAfterReadAll = await apiCall("GET", "/notifications/unread-count", null, tokenA);
    assert(countAfterReadAll.data?.data?.unreadCount === 0, "Unread count after read-all is 0");

    // 12. IDOR Check: UserB cannot delete UserA's notification
    const idorDelete = await apiCall("DELETE", `/notifications/${notif2.id}`, null, tokenB);
    assert(idorDelete.status === 403 || idorDelete.status === 404, "IDOR: UserB cannot delete UserA notification (returns 403/404)");

    // 13. UserA deletes own notification
    const deleteRes = await apiCall("DELETE", `/notifications/${notif2.id}`, null, tokenA);
    assert(deleteRes.status === 200, "UserA successfully deletes own notification (returns 200)");

    // Verify deletion
    const verifyDelete = await apiCall("PATCH", `/notifications/${notif2.id}/read`, null, tokenA);
    assert(verifyDelete.status === 404, "Deleted notification returns 404 on subsequent access");

    // 14. Non-existent notification ID handling
    const fakeId = "609c1234567890abcdef1234";
    const fakeRes = await apiCall("PATCH", `/notifications/${fakeId}/read`, null, tokenA);
    assert(fakeRes.status === 404, "Non-existent notification returns 404 Not Found");

    // 15. NotificationService safe-fail test
    const invalidNotif = await NotificationService.createNotification({
      userId: "",
      title: "",
      message: "",
    });
    assert(invalidNotif === null, "NotificationService returns null safely on invalid parameters without crashing");

  } catch (err) {
    console.error("Test execution exception:", err);
    failed++;
  } finally {
    // Teardown test accounts and notifications
    console.log("\nTearing down test artifacts...");
    try {
      if (createdNotifIds.length > 0) {
        await prisma.notification.deleteMany({
          where: { id: { in: createdNotifIds } },
        });
      }
      if (userA?.id) {
        await prisma.notification.deleteMany({ where: { userId: userA.id } });
        await prisma.user.delete({ where: { id: userA.id } });
      }
      if (userB?.id) {
        await prisma.notification.deleteMany({ where: { userId: userB.id } });
        await prisma.user.delete({ where: { id: userB.id } });
      }
      console.log("Teardown complete.");
    } catch (cleanupErr) {
      console.warn("Teardown warning:", cleanupErr.message);
    }

    server.close();
    await prisma.$disconnect();

    console.log(`\n======================================================`);
    console.log(`Test Results: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
    console.log(`======================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  }
}

runNotificationsTestSuite();


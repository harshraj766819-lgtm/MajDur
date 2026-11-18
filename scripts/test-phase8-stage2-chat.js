/**
 * MajDur Phase 8 Stage 2: Conversations & Messaging Backend REST Test Suite
 * Developer: Harsh Singh
 */
process.env.NODE_ENV = "test";
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { app } = require(path.resolve(__dirname, "../backend/dist/server.js"));
const { prisma } = require(path.resolve(__dirname, "../backend/dist/config/prisma.js"));
const { signAccessToken } = require(path.resolve(__dirname, "../backend/dist/utils/token.js"));
const http = require("http");

async function runChatTestSuite() {
  const PORT = 5093;
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));

  console.log(`\n======================================================`);
  console.log(`💬 MajDur Phase 8 Stage 2: Conversations & Messaging Test Suite`);
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

  const timestamp = Date.now();
  let custUser, workerUser, strangerUser;
  let tokenCust, tokenWorker, tokenStranger;
  let testBooking;
  let testConversationId;

  try {
    // 1. Create test users
    custUser = await prisma.user.create({
      data: {
        name: `Customer Alice ${timestamp}`,
        phone: `9${timestamp.toString().slice(-9)}`,
        email: `alice.${timestamp}@majdur.test`,
        password: "hashed_test_password",
        role: "CUSTOMER",
      },
    });

    workerUser = await prisma.user.create({
      data: {
        name: `Artisan Bob ${timestamp}`,
        phone: `9${(timestamp + 1).toString().slice(-9)}`,
        email: `bob.${timestamp}@majdur.test`,
        password: "hashed_test_password",
        role: "WORKER",
      },
    });

    strangerUser = await prisma.user.create({
      data: {
        name: `Stranger Charlie ${timestamp}`,
        phone: `9${(timestamp + 2).toString().slice(-9)}`,
        email: `charlie.${timestamp}@majdur.test`,
        password: "hashed_test_password",
        role: "CUSTOMER",
      },
    });

    tokenCust = signAccessToken({
      userId: custUser.id,
      role: custUser.role,
      name: custUser.name,
      phone: custUser.phone,
      email: custUser.email,
    });

    tokenWorker = signAccessToken({
      userId: workerUser.id,
      role: workerUser.role,
      name: workerUser.name,
      phone: workerUser.phone,
      email: workerUser.email,
    });

    tokenStranger = signAccessToken({
      userId: strangerUser.id,
      role: strangerUser.role,
      name: strangerUser.name,
      phone: strangerUser.phone,
      email: strangerUser.email,
    });

    // 2. Create test booking
    const bookingNumber = `MD-${new Date().getFullYear()}-${timestamp.toString().slice(-6)}`;
    testBooking = await prisma.booking.create({
      data: {
        bookingNumber,
        customerId: custUser.id,
        workerId: workerUser.id,
        serviceCategory: "Electrical",
        status: "ACCEPTED",
        startDate: new Date(),
        dailyRate: 850,
        totalDays: 2,
        totalAmount: 1700,
        address: "123 Test Street",
        city: "Noida",
      },
    });

    console.log(`Created test identities & booking ${bookingNumber}`);

    // 3. Create conversation linked to booking
    const createConvoRes = await apiCall(
      "POST",
      "/conversations",
      { bookingId: testBooking.id },
      tokenCust
    );
    assert(createConvoRes.status === 200 || createConvoRes.status === 201, "POST /conversations returns 200/201");
    testConversationId = createConvoRes.data?.data?.id;
    assert(testConversationId, "Conversation ID generated");
    assert(createConvoRes.data?.data?.members?.length === 2, "Conversation has exactly 2 members (Customer & Worker)");

    // 4. Idempotency: Repeating call returns same conversation
    const repeatConvoRes = await apiCall(
      "POST",
      "/conversations",
      { bookingId: testBooking.id },
      tokenWorker
    );
    assert(repeatConvoRes.data?.data?.id === testConversationId, "Repeat POST /conversations returns same conversation");

    // 5. IDOR: Stranger cannot create/join conversation for booking
    const idorConvoRes = await apiCall(
      "POST",
      "/conversations",
      { bookingId: testBooking.id },
      tokenStranger
    );
    assert(idorConvoRes.status === 403, "IDOR: Stranger denied access to booking conversation (403 Forbidden)");

    // 6. List conversations
    const listCust = await apiCall("GET", "/conversations", null, tokenCust);
    assert(listCust.status === 200, "GET /conversations returns 200 OK");
    assert(listCust.data?.data?.length === 1, "Customer has 1 conversation");

    const listStranger = await apiCall("GET", "/conversations", null, tokenStranger);
    assert(listStranger.data?.data?.length === 0, "Stranger has 0 conversations");

    // 7. Get single conversation details
    const getConvoCust = await apiCall("GET", `/conversations/${testConversationId}`, null, tokenCust);
    assert(getConvoCust.status === 200, "Participant can fetch conversation details");

    const getConvoStranger = await apiCall("GET", `/conversations/${testConversationId}`, null, tokenStranger);
    assert(getConvoStranger.status === 403, "IDOR: Stranger cannot fetch conversation details (403)");

    // 8. Send message validation
    const emptyMsgRes = await apiCall(
      "POST",
      `/conversations/${testConversationId}/messages`,
      { content: "   " },
      tokenCust
    );
    assert(emptyMsgRes.status === 400, "Empty message rejected with 400 Bad Request");

    // 9. IDOR: Stranger cannot send message
    const idorMsgRes = await apiCall(
      "POST",
      `/conversations/${testConversationId}/messages`,
      { content: "I am hacking into this chat" },
      tokenStranger
    );
    assert(idorMsgRes.status === 403, "IDOR: Stranger cannot post message to private conversation (403)");

    // 10. Customer sends valid message
    const clientMsgId = `client-${Date.now()}`;
    const sendRes = await apiCall(
      "POST",
      `/conversations/${testConversationId}/messages`,
      {
        content: "Hello Bob, please bring a 15A switch board.",
        clientMessageId: clientMsgId,
      },
      tokenCust
    );
    assert(sendRes.status === 201, "POST /conversations/:id/messages creates message with 201 Created");
    assert(sendRes.data?.data?.content === "Hello Bob, please bring a 15A switch board.", "Message content saved correctly");
    assert(sendRes.data?.data?.senderId === custUser.id, "Sender ID derived from authenticated JWT token");

    // 11. Idempotency test: resend message with same clientMessageId
    const retryMsgRes = await apiCall(
      "POST",
      `/conversations/${testConversationId}/messages`,
      {
        content: "Hello Bob, please bring a 15A switch board.",
        clientMessageId: clientMsgId,
      },
      tokenCust
    );
    assert(retryMsgRes.status === 200 || retryMsgRes.status === 201, "Idempotent retry acknowledged");
    assert(retryMsgRes.data?.data?.id === sendRes.data?.data?.id, "No duplicate message persisted on retry");

    // 12. Check notification generated for recipient (Worker)
    const workerNotifs = await apiCall("GET", "/notifications", null, tokenWorker);
    const msgNotif = workerNotifs.data?.data?.notifications?.find((n) => n.type === "NEW_MESSAGE");
    assert(msgNotif !== undefined, "Recipient received NEW_MESSAGE notification");

    // 13. Fetch paginated messages
    const msgsRes = await apiCall("GET", `/conversations/${testConversationId}/messages`, null, tokenWorker);
    assert(msgsRes.status === 200, "Recipient fetches message history with 200 OK");
    assert(msgsRes.data?.data?.messages?.length === 1, "Exactly 1 message returned");

    // 14. Mark messages as read
    const markReadRes = await apiCall("PATCH", `/conversations/${testConversationId}/read`, null, tokenWorker);
    assert(markReadRes.status === 200, "PATCH /conversations/:id/read returns 200 OK");
    assert(markReadRes.data?.data?.markedCount === 1, "1 message marked as read");

    // Verify message status in DB
    const updatedMsg = await prisma.message.findUnique({
      where: { id: sendRes.data?.data?.id },
    });
    assert(updatedMsg.isRead === true, "Database message isRead is true");
    assert(updatedMsg.status === "READ", "Database message status is READ");

    // 15. Direct 1-to-1 conversation without booking
    const directConvo = await apiCall(
      "POST",
      "/conversations",
      { targetUserId: workerUser.id },
      tokenCust
    );
    assert(directConvo.status === 200 || directConvo.status === 201, "Direct 1-to-1 conversation initiated");
    assert(directConvo.data?.data?.members?.length === 2, "Direct conversation has 2 members");

  } catch (err) {
    console.error("Test execution exception:", err);
    failed++;
  } finally {
    console.log("\nTearing down test artifacts...");
    try {
      if (testBooking?.id) {
        await prisma.booking.delete({ where: { id: testBooking.id } });
      }
      if (testConversationId) {
        await prisma.message.deleteMany({ where: { conversationId: testConversationId } });
        await prisma.conversationMember.deleteMany({ where: { conversationId: testConversationId } });
        await prisma.conversation.delete({ where: { id: testConversationId } });
      }
      if (custUser?.id) {
        await prisma.notification.deleteMany({ where: { userId: custUser.id } });
        await prisma.conversationMember.deleteMany({ where: { userId: custUser.id } });
        await prisma.user.delete({ where: { id: custUser.id } });
      }
      if (workerUser?.id) {
        await prisma.notification.deleteMany({ where: { userId: workerUser.id } });
        await prisma.conversationMember.deleteMany({ where: { userId: workerUser.id } });
        await prisma.user.delete({ where: { id: workerUser.id } });
      }
      if (strangerUser?.id) {
        await prisma.notification.deleteMany({ where: { userId: strangerUser.id } });
        await prisma.conversationMember.deleteMany({ where: { userId: strangerUser.id } });
        await prisma.user.delete({ where: { id: strangerUser.id } });
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

runChatTestSuite();


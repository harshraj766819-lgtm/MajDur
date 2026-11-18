/**
 * MajDur Phase 8 Stage 2: Socket.IO Real-Time Engine Integration Test Suite
 * Developer: Harsh Singh
 */
process.env.NODE_ENV = "test";
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { app, server } = require(path.resolve(__dirname, "../backend/dist/server.js"));
const { prisma } = require(path.resolve(__dirname, "../backend/dist/config/prisma.js"));
const { signAccessToken } = require(path.resolve(__dirname, "../backend/dist/utils/token.js"));
const { io: ioClient } = require(path.resolve(__dirname, "../backend/node_modules/socket.io-client"));

async function runSocketTestSuite() {
  const PORT = 5094;
  await new Promise((resolve) => server.listen(PORT, resolve));

  console.log(`\n======================================================`);
  console.log(`⚡ MajDur Phase 8 Stage 2: Socket.IO Real-Time Engine Test Suite`);
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

  const timestamp = Date.now();
  let userA, userB, userC;
  let tokenA, tokenB, tokenC;
  let testBooking;
  let testConversation;
  const activeSockets = [];

  function createSocket(token = null) {
    const opts = {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: false,
    };
    if (token) {
      opts.auth = { token };
    }
    const sock = ioClient(`http://localhost:${PORT}`, opts);
    activeSockets.push(sock);
    return sock;
  }

  try {
    // 1. Create test identities
    userA = await prisma.user.create({
      data: {
        name: `Customer Alice ${timestamp}`,
        phone: `9${timestamp.toString().slice(-9)}`,
        email: `alice.sock.${timestamp}@majdur.test`,
        password: "hashed_test_password",
        role: "CUSTOMER",
      },
    });

    userB = await prisma.user.create({
      data: {
        name: `Artisan Bob ${timestamp}`,
        phone: `9${(timestamp + 1).toString().slice(-9)}`,
        email: `bob.sock.${timestamp}@majdur.test`,
        password: "hashed_test_password",
        role: "WORKER",
      },
    });

    userC = await prisma.user.create({
      data: {
        name: `Stranger Charlie ${timestamp}`,
        phone: `9${(timestamp + 2).toString().slice(-9)}`,
        email: `charlie.sock.${timestamp}@majdur.test`,
        password: "hashed_test_password",
        role: "CUSTOMER",
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

    tokenC = signAccessToken({
      userId: userC.id,
      role: userC.role,
      name: userC.name,
      phone: userC.phone,
      email: userC.email,
    });

    testBooking = await prisma.booking.create({
      data: {
        bookingNumber: `MD-${new Date().getFullYear()}-${timestamp.toString().slice(-6)}`,
        customerId: userA.id,
        workerId: userB.id,
        serviceCategory: "Electrical",
        status: "CONFIRMED",
        startDate: new Date(),
        dailyRate: 900,
        totalDays: 2,
        totalAmount: 1800,
        address: "789 Realtime Ave",
        city: "Delhi",
      },
    });

    testConversation = await prisma.conversation.create({
      data: {
        bookingId: testBooking.id,
        title: `Booking ${testBooking.bookingNumber}`,
        members: {
          create: [{ userId: userA.id }, { userId: userB.id }],
        },
      },
    });

    console.log(`Initialized test conversation ${testConversation.id} for users A and B`);

    // ========================================================
    // TEST 1: Connection without Token is Rejected
    // ========================================================
    const unauthSocket = createSocket();
    await new Promise((resolve) => {
      unauthSocket.on("connect_error", (err) => {
        assert(
          err.message.includes("Authentication token required"),
          "Socket connection without JWT is rejected by handshake middleware"
        );
        unauthSocket.disconnect();
        resolve(null);
      });
    });

    // ========================================================
    // TEST 2: Connection with Invalid Token is Rejected
    // ========================================================
    const invalidSocket = createSocket("invalid.jwt.token");
    await new Promise((resolve) => {
      invalidSocket.on("connect_error", (err) => {
        assert(
          err.message.includes("Invalid or expired token"),
          "Socket connection with invalid JWT is rejected by handshake middleware"
        );
        invalidSocket.disconnect();
        resolve(null);
      });
    });

    // ========================================================
    // TEST 3: Connection with Valid Token Succeeds
    // ========================================================
    const socketA = createSocket(tokenA);
    await new Promise((resolve) => {
      socketA.on("connect", () => {
        assert(socketA.connected, "Socket A (Customer) connects successfully with valid JWT");
        resolve(null);
      });
    });

    const socketB = createSocket(tokenB);
    await new Promise((resolve) => {
      socketB.on("connect", () => {
        assert(socketB.connected, "Socket B (Worker) connects successfully with valid JWT");
        resolve(null);
      });
    });

    const socketC = createSocket(tokenC);
    await new Promise((resolve) => {
      socketC.on("connect", () => {
        assert(socketC.connected, "Socket C (Stranger) connects successfully with valid JWT");
        resolve(null);
      });
    });

    // ========================================================
    // TEST 4: Room Authorization Check (IDOR Protection)
    // ========================================================
    await new Promise((resolve) => {
      socketC.emit("conversation:join", { conversationId: testConversation.id });
      socketC.on("error", (err) => {
        assert(
          err.code === "UNAUTHORIZED_ROOM" || err.message?.includes("not an authorized participant"),
          "IDOR: Stranger (Socket C) denied access to private conversation room"
        );
        resolve(null);
      });
    });

    // Authorized participants join room
    await new Promise((resolve) => {
      socketA.emit("conversation:join", { conversationId: testConversation.id }, (res) => {
        assert(res?.success === true, "Socket A (Customer) authorized to join conversation room");
        resolve(null);
      });
    });

    await new Promise((resolve) => {
      socketB.emit("conversation:join", { conversationId: testConversation.id }, (res) => {
        assert(res?.success === true, "Socket B (Worker) authorized to join conversation room");
        resolve(null);
      });
    });

    // ========================================================
    // TEST 5: Real-time Message Send, Persistence & Broadcast
    // ========================================================
    const testMsgContent = "Hello Bob! We need you on site by 9 AM tomorrow.";
    const clientMsgId = `sock-test-${Date.now()}`;

    const messagePromise = new Promise((resolve) => {
      socketB.on("message:new", (data) => {
        assert(data.conversationId === testConversation.id, "Socket B receives message:new with matching conversationId");
        assert(data.message.content === testMsgContent, "Socket B receives message:new with exact content");
        assert(data.message.senderId === userA.id, "Message senderId matches Socket A");
        resolve(data.message);
      });
    });

    let ackData = null;
    await new Promise((resolve) => {
      socketA.emit(
        "message:send",
        {
          conversationId: testConversation.id,
          content: testMsgContent,
          clientMessageId: clientMsgId,
        },
        (res) => {
          ackData = res;
          assert(res.success === true, "Socket A receives ack with success: true");
          assert(res.message.id, "Ack includes persisted message ID");
          assert(res.message.content === testMsgContent, "Ack contains persisted content");
          resolve(null);
        }
      );
    });

    const receivedMsg = await messagePromise;

    // Verify database persistence
    const dbMsg = await prisma.message.findUnique({
      where: { id: ackData.message.id },
    });
    assert(dbMsg !== null, "Message record confirmed in MongoDB Atlas database");
    assert(dbMsg.content === testMsgContent, "MongoDB content matches sent message");

    // ========================================================
    // TEST 6: Typing Indicators (typing:start & typing:stop)
    // ========================================================
    const typingStartPromise = new Promise((resolve) => {
      socketB.on("typing:start", (data) => {
        assert(data.conversationId === testConversation.id, "Socket B receives typing:start event");
        assert(data.userId === userA.id, "typing:start identifies User A");
        resolve(null);
      });
    });

    socketA.emit("typing:start", { conversationId: testConversation.id });
    await typingStartPromise;

    const typingStopPromise = new Promise((resolve) => {
      socketB.on("typing:stop", (data) => {
        assert(data.conversationId === testConversation.id, "Socket B receives typing:stop event");
        assert(data.userId === userA.id, "typing:stop identifies User A");
        resolve(null);
      });
    });

    socketA.emit("typing:stop", { conversationId: testConversation.id });
    await typingStopPromise;

    // ========================================================
    // TEST 7: Read Receipt Event (message:read)
    // ========================================================
    const readReceiptPromise = new Promise((resolve) => {
      socketA.on("message:read", (data) => {
        assert(data.conversationId === testConversation.id, "Socket A receives message:read receipt");
        assert(data.readerId === userB.id, "message:read indicates User B has read the messages");
        resolve(null);
      });
    });

    socketB.emit("message:read", { conversationId: testConversation.id });
    await readReceiptPromise;

    // Verify DB update
    const dbMsgAfterRead = await prisma.message.findUnique({
      where: { id: ackData.message.id },
    });
    assert(dbMsgAfterRead.isRead === true, "Database message isRead is true after read receipt");
    assert(dbMsgAfterRead.status === "READ", "Database message status is READ after receipt");

    // ========================================================
    // TEST 8: Multi-Tab Presence Handling
    // ========================================================
    // Open second connection for User A (Tab 2)
    const socketA2 = createSocket(tokenA);
    await new Promise((resolve) => {
      socketA2.on("connect", () => {
        assert(socketA2.connected, "Socket A2 (User A, Tab 2) connects successfully");
        resolve(null);
      });
    });

    // Disconnect Tab 1 - User A should STILL be online
    socketA.disconnect();
    // Brief wait to ensure disconnect processed
    await new Promise((r) => setTimeout(r, 200));

    // Verify through presence helper (imported from server)
    const { isUserOnline } = require(path.resolve(__dirname, "../backend/dist/sockets/chatSocket.js"));
    assert(isUserOnline(userA.id) === true, "User A remains ONLINE when Tab 1 disconnects because Tab 2 is active");

    // Disconnect Tab 2 - User A should now go offline
    socketA2.disconnect();
    await new Promise((r) => setTimeout(r, 200));
    assert(isUserOnline(userA.id) === false, "User A goes OFFLINE only when ALL tabs are closed");

  } catch (err) {
    console.error("Test execution exception:", err);
    failed++;
  } finally {
    console.log("\nTearing down socket test artifacts...");
    activeSockets.forEach((s) => {
      if (s.connected) s.disconnect();
    });

    try {
      if (testBooking?.id) {
        await prisma.booking.delete({ where: { id: testBooking.id } });
      }
      if (testConversation?.id) {
        await prisma.message.deleteMany({ where: { conversationId: testConversation.id } });
        await prisma.conversationMember.deleteMany({ where: { conversationId: testConversation.id } });
        await prisma.conversation.delete({ where: { id: testConversation.id } });
      }
      if (userA?.id) {
        await prisma.notification.deleteMany({ where: { userId: userA.id } });
        await prisma.conversationMember.deleteMany({ where: { userId: userA.id } });
        await prisma.user.delete({ where: { id: userA.id } });
      }
      if (userB?.id) {
        await prisma.notification.deleteMany({ where: { userId: userB.id } });
        await prisma.conversationMember.deleteMany({ where: { userId: userB.id } });
        await prisma.user.delete({ where: { id: userB.id } });
      }
      if (userC?.id) {
        await prisma.notification.deleteMany({ where: { userId: userC.id } });
        await prisma.conversationMember.deleteMany({ where: { userId: userC.id } });
        await prisma.user.delete({ where: { id: userC.id } });
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

runSocketTestSuite();


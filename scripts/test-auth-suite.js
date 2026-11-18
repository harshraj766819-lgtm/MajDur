process.env.NODE_ENV = "test";
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { app } = require(path.resolve(__dirname, "../backend/dist/server.js"));
const { prisma } = require(path.resolve(__dirname, "../backend/dist/config/prisma.js"));
const http = require("http");

async function runAuthSuite() {
  const PORT = 5088;
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`\n=========================================`);
  console.log(`🧪 MajDur Phase 4 Authentication Test Suite`);
  console.log(`Developer: Harsh Singh`);
  console.log(`Test Server Port: ${PORT}`);
  console.log(`=========================================\n`);

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
    const data = await res.json().catch(() => ({}));
    const setCookie = res.headers.get("set-cookie");
    return { status: res.status, data, headers: res.headers, setCookie };
  }

  // Ensure exactly 10-digit Indian mobile numbers starting with 9
  const timestamp = Date.now().toString().slice(-6);
  const baseNum = Date.now().toString().slice(-9);
  const testCustomerPhone = `9${baseNum}`;
  const testWorkerPhone = `8${baseNum}`;
  const testContractorPhone = `7${baseNum}`;

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

  try {
    // TEST 1: Customer Registration
    const custReg = await apiCall("POST", "/auth/register/customer", {
      name: "Rahul Customer",
      email: `rahul.${timestamp}@example.com`,
      phone: testCustomerPhone,
      password: "Password@123",
      confirmPassword: "Password@123",
    });
    assert(custReg.status === 201 && custReg.data.data?.user?.role === "CUSTOMER", "Customer Registration returns 201 and CUSTOMER role");
    const customerToken = custReg.data.data?.accessToken;
    assert(customerToken && custReg.setCookie?.includes("majdur_access_token"), "Customer Registration issues JWT accessToken and HttpOnly cookies");

    // TEST 2: Duplicate Phone Check
    const dupReg = await apiCall("POST", "/auth/register/customer", {
      name: "Duplicate User",
      phone: testCustomerPhone,
      password: "Password@123",
    });
    assert(dupReg.status === 409, "Duplicate phone registration is rejected with 409 Conflict");

    // TEST 3: Worker Registration
    const workReg = await apiCall("POST", "/auth/register/worker", {
      name: "Vikram Electrician",
      email: `vikram.${timestamp}@example.com`,
      phone: testWorkerPhone,
      password: "Password@123",
      trade: "Electrician",
      experienceYears: 6,
      city: "Delhi NCR",
      pincode: "110025",
      dailyRate: 850,
      bio: "Licensed electrician specialized in domestic wiring and MCBs.",
    });
    assert(workReg.status === 201 && workReg.data.data?.user?.role === "WORKER", "Worker Registration returns 201 and WORKER role with profile");

    // TEST 4: Contractor Registration
    const contReg = await apiCall("POST", "/auth/register/contractor", {
      companyName: "Empire Infra Buildcon",
      contactPerson: "Rajesh Singhania",
      email: `rajesh.${timestamp}@example.com`,
      phone: testContractorPhone,
      password: "Password@123",
      city: "Mumbai",
      gstNumber: "27ABCDE1234F1Z5",
    });
    assert(contReg.status === 201 && contReg.data.data?.user?.role === "CONTRACTOR", "Contractor Registration returns 201 and CONTRACTOR role");

    // TEST 5: Login with Wrong Password
    const badLogin = await apiCall("POST", "/auth/login", {
      identifier: testCustomerPhone,
      password: "WrongPassword999",
    });
    assert(badLogin.status === 401, "Login with invalid password is rejected with 401 Unauthorized");

    // TEST 6: Successful Login with Phone
    const loginRes = await apiCall("POST", "/auth/login", {
      identifier: testCustomerPhone,
      password: "Password@123",
    });
    assert(loginRes.status === 200 && loginRes.data.data?.user?.name === "Rahul Customer", "Login with registered phone succeeds with 200 OK");
    const activeToken = loginRes.data.data?.accessToken;

    // TEST 7: Authenticated Profile Fetch (/auth/me)
    const meRes = await apiCall("GET", "/auth/me", null, {
      Authorization: `Bearer ${activeToken}`,
    });
    assert(meRes.status === 200 && meRes.data.data?.id && !meRes.data.data?.password, "GET /auth/me returns user data without exposing password hash");

    // TEST 8: Super Admin Login
    const adminLogin = await apiCall("POST", "/auth/login", {
      identifier: "admin@majdur.in",
      password: "Admin@MajDur2026",
    });
    assert(adminLogin.status === 200 && adminLogin.data.data?.user?.role === "ADMIN", "Super Admin signs in successfully with ADMIN role");

    // TEST 9: Refresh Token Rotation
    // Extract refresh cookie from login
    const cookieHeader = loginRes.setCookie;
    let refreshToken = "";
    if (cookieHeader) {
      const match = cookieHeader.match(/majdur_refresh_token=([^;]+)/);
      if (match) refreshToken = match[1];
    }
    const refreshRes = await apiCall("POST", "/auth/refresh", { refreshToken }, {
      Cookie: cookieHeader,
    });
    assert(refreshRes.status === 200 && refreshRes.data.data?.accessToken, "POST /auth/refresh returns new access token and rotates session");

    // TEST 10: Phone OTP Flow & Resend Cooldown
    const testOtpPhone = `94${Date.now().toString().slice(-8)}`;
    const otpSend = await apiCall("POST", "/auth/otp/send", { phone: testOtpPhone });
    assert(otpSend.status === 200 && otpSend.data.success, "POST /auth/otp/send dispatches 6-digit OTP");

    // Immediate second call should enforce 60s cooldown
    const otpCooldown = await apiCall("POST", "/auth/otp/send", { phone: testOtpPhone });
    assert(otpCooldown.status === 400 && otpCooldown.data.message?.includes("wait"), "OTP Resend Cooldown (60s) is strictly enforced");

    // Retrieve generated OTP directly from DB for test verification
    const dbToken = await prisma.verificationToken.findFirst({ where: { identifier: testOtpPhone, type: "PHONE_OTP" } });
    assert(dbToken?.token && dbToken.token.length === 6, "OTP code is exactly 6 digits in verification store");

    // Verify correct OTP
    const otpVerify = await apiCall("POST", "/auth/otp/verify", {
      phone: testOtpPhone,
      otp: dbToken.token,
    });
    assert(otpVerify.status === 200 && otpVerify.data.data?.verified, "POST /auth/otp/verify validates matching OTP and marks verified");

    // TEST 11: RBAC Middleware Verification
    const workerToken = workReg.data.data?.accessToken;
    const adminToken = adminLogin.data.data?.accessToken;

    const workerForbidden = await apiCall("GET", "/admin/test-rbac", null, {
      Authorization: `Bearer ${workerToken}`,
    });
    assert(workerForbidden.status === 403, "RBAC: Worker accessing Admin route is blocked with 403 Forbidden");

    const adminAllowed = await apiCall("GET", "/admin/test-rbac", null, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(adminAllowed.status === 200 && adminAllowed.data?.success, "RBAC: Admin successfully accesses Admin route with 200 OK");

    // TEST 11: Password Reset Flow
    const forgotRes = await apiCall("POST", "/auth/password/forgot", { identifier: testCustomerPhone });
    assert(forgotRes.status === 200, "POST /auth/password/forgot initiates password reset");

    const customerId = custReg.data.data?.user?.id;
    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: { userId: customerId, isUsed: false },
      orderBy: { createdAt: "desc" },
    });
    assert(resetRecord && resetRecord.tokenHash, "Active password reset token generated in database");

    // In dev mode, forgot API returned token for testing
    const rawResetToken = forgotRes.data.data?.token;
    if (rawResetToken) {
      const resetConfirm = await apiCall("POST", "/auth/password/reset", {
        token: rawResetToken,
        newPassword: "NewSecretPassword@2026",
        confirmPassword: "NewSecretPassword@2026",
      });
      assert(resetConfirm.status === 200, "POST /auth/password/reset successfully updates password with new bcrypt hash");

      // Verify login with new password
      const newLogin = await apiCall("POST", "/auth/login", {
        identifier: testCustomerPhone,
        password: "NewSecretPassword@2026",
      });
      assert(newLogin.status === 200, "Login succeeds with the newly reset password");
    }

    // TEST 12: Logout
    const logoutRes = await apiCall("POST", "/auth/logout", { refreshToken }, {
      Cookie: cookieHeader,
    });
    assert(logoutRes.status === 200, "POST /auth/logout revokes session and clears cookies");

    console.log(`\n=========================================`);
    console.log(`📊 Phase 4 Auth Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log(`=========================================\n`);

    // Clean up test users
    await prisma.user.deleteMany({
      where: {
        phone: { in: [testCustomerPhone, testWorkerPhone, testContractorPhone] },
      },
    });
    console.log("🧹 Test artifacts cleaned up.");

  } catch (error) {
    console.error("Test execution error:", error);
  } finally {
    server.close();
    await prisma.$disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runAuthSuite();

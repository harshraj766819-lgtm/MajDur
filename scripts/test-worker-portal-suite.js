process.env.NODE_ENV = "test";
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { app } = require(path.resolve(__dirname, "../backend/dist/server.js"));
const { prisma } = require(path.resolve(__dirname, "../backend/dist/config/prisma.js"));
const http = require("http");

async function runWorkerPortalSuite() {
  const PORT = 5091;
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`\n=========================================`);
  console.log(`🧪 MajDur Phase 6 Worker Portal Test Suite`);
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
  const worker1Phone = `9${baseNum}`;
  const worker2Phone = `8${baseNum}`;
  const customerPhone = `7${baseNum}`;

  try {
    // ----------------------------------------------------
    // SETUP: Register Worker 1, Worker 2, Customer
    // ----------------------------------------------------
    const regW1 = await apiCall("POST", "/auth/register/worker", {
      name: "Sanjay Kumar",
      phone: worker1Phone,
      email: `sanjay.${baseNum}@test.com`,
      password: "Password@123",
      trade: "Electrician",
      experience: 6,
      city: "Delhi NCR",
      pincode: "110001",
      dailyRate: 850,
    });
    assert(regW1.status === 201, "Setup: Worker 1 registered");
    const tokenW1 = regW1.data?.data?.accessToken;
    const authW1 = { Authorization: `Bearer ${tokenW1}` };

    const regW2 = await apiCall("POST", "/auth/register/worker", {
      name: "Mukesh Carpenter",
      phone: worker2Phone,
      email: `mukesh.${baseNum}@test.com`,
      password: "Password@123",
      trade: "Carpenter",
      experience: 8,
      city: "Noida",
      pincode: "201301",
      dailyRate: 900,
    });
    assert(regW2.status === 201, "Setup: Worker 2 registered");
    const tokenW2 = regW2.data?.data?.accessToken;
    const authW2 = { Authorization: `Bearer ${tokenW2}` };

    const regCust = await apiCall("POST", "/auth/register/customer", {
      name: "Anand Customer",
      phone: customerPhone,
      email: `anand.${baseNum}@test.com`,
      password: "Password@123",
    });
    assert(regCust.status === 201, "Setup: Customer registered");
    const tokenCust = regCust.data?.data?.accessToken;
    const authCust = { Authorization: `Bearer ${tokenCust}` };

    // ----------------------------------------------------
    // TEST 1: WORKER DASHBOARD
    // ----------------------------------------------------
    const dashRes = await apiCall("GET", "/worker/dashboard", null, authW1);
    assert(dashRes.status === 200, "GET /worker/dashboard returns 200 OK");
    assert(dashRes.data?.data?.stats?.totalEarnings === 0, "Initial worker earnings is 0");
    assert(dashRes.data?.data?.stats?.activeWorkCount === 0, "Initial active work count is 0");
    assert(Array.isArray(dashRes.data?.data?.matchingJobs), "Dashboard returns matchingJobs array");

    // ----------------------------------------------------
    // TEST 2: WORKER PROFILE VIEW & UPDATE
    // ----------------------------------------------------
    const profRes = await apiCall("GET", "/worker/profile", null, authW1);
    assert(profRes.status === 200, "GET /worker/profile returns 200 OK");
    assert(profRes.data?.data?.user?.name === "Sanjay Kumar", "Worker profile matches registered name");

    const updateProf = await apiCall("PUT", "/worker/profile", {
      bio: "Master Electrician with 6+ years experience in high voltage wiring, DB dressing, and industrial controls.",
      experienceYears: 7,
      serviceRadiusKm: 35,
    }, authW1);
    assert(updateProf.status === 200, "PUT /worker/profile updates profile details");
    assert(updateProf.data?.data?.profile?.experienceYears === 7, "Worker experience updated to 7 years");
    assert(updateProf.data?.data?.profile?.serviceRadiusKm === 35, "Service radius updated to 35 km");

    // ----------------------------------------------------
    // TEST 3: ONBOARDING WIZARD STEPS
    // ----------------------------------------------------
    const onbGet = await apiCall("GET", "/worker/onboarding", null, authW1);
    assert(onbGet.status === 200, "GET /worker/onboarding returns 200 OK");
    assert(typeof onbGet.data?.data?.currentStep === "number", "Onboarding returns currentStep number");

    // Save step 1 (Personal Info)
    const onbStep1 = await apiCall("POST", "/worker/onboarding", {
      step: 1,
      data: {
        name: "Sanjay Kumar Senior",
        city: "Gurugram",
        state: "Haryana",
        pincode: "122001",
        address: "DLF Phase 3, Cyber City",
      },
    }, authW1);
    assert(onbStep1.status === 200, "POST /worker/onboarding step 1 saved successfully");

    // Save step 2 (Professional Details & Skills)
    const onbStep2 = await apiCall("POST", "/worker/onboarding", {
      step: 2,
      data: {
        category: "Electrician",
        experienceYears: 7,
        bio: "Specialist in concealed conduit wiring and modular smart switchboards.",
        skills: ["Concealed House Wiring", "Distribution Box (DB) & MCB Dressing"],
      },
    }, authW1);
    assert(onbStep2.status === 200, "POST /worker/onboarding step 2 saved successfully");

    // Save step 3 (Service Preferences & Rates)
    const onbStep3 = await apiCall("POST", "/worker/onboarding", {
      step: 3,
      data: {
        dailyRate: 950,
        hourlyRate: 150,
        serviceRadiusKm: 40,
        serviceAreas: [
          { city: "Gurugram", pincode: "122001", areaName: "Cyber City", radiusKm: 30 },
          { city: "Delhi", pincode: "110001", areaName: "Connaught Place", radiusKm: 25 },
        ],
      },
    }, authW1);
    assert(onbStep3.status === 200, "POST /worker/onboarding step 3 saved successfully");

    // Save step 4 (Verification Document)
    const onbStep4 = await apiCall("POST", "/worker/onboarding", {
      step: 4,
      data: {
        idType: "Aadhaar",
        idNumber: "9876-5432-1098",
        documentUrl: "https://storage.majdur.in/kyc/sanjay_aadhaar.pdf",
      },
    }, authW1);
    assert(onbStep4.status === 200, "POST /worker/onboarding step 4 saved successfully");

    // Check onboarding completion
    const onbFinal = await apiCall("GET", "/worker/onboarding", null, authW1);
    assert(onbFinal.data?.data?.isCompleted === true, "Onboarding is marked completed (currentStep 5)");

    // ----------------------------------------------------
    // TEST 4: SKILLS MANAGEMENT CRUD
    // ----------------------------------------------------
    const skillsList = await apiCall("GET", "/worker/skills", null, authW1);
    assert(skillsList.status === 200, "GET /worker/skills returns 200 OK");
    assert(Array.isArray(skillsList.data?.data?.mySkills), "mySkills is returned as array");
    assert(Array.isArray(skillsList.data?.data?.availableSkills), "availableSkills is returned as array");

    // Add new skill
    const addSkill = await apiCall("POST", "/worker/skills", {
      skillName: "Inverter & Battery Wiring",
      yearsExperience: 4,
    }, authW1);
    assert(addSkill.status === 201, "POST /worker/skills adds new skill");
    const skillLinkId = addSkill.data?.data?.id;

    // Reject duplicate skill
    const dupSkill = await apiCall("POST", "/worker/skills", {
      skillName: "Inverter & Battery Wiring",
    }, authW1);
    assert(dupSkill.status === 409, "Adding duplicate skill rejected with 409 Conflict");

    // Update skill experience
    const updateSkill = await apiCall("PUT", `/worker/skills/${skillLinkId}`, {
      yearsExperience: 5,
    }, authW1);
    assert(updateSkill.status === 200, "PUT /worker/skills/:id updates experience");
    assert(updateSkill.data?.data?.yearsExperience === 5, "Updated skill experience verified as 5");

    // IDOR Check: Worker 2 cannot modify Worker 1's skill
    const idorSkill = await apiCall("PUT", `/worker/skills/${skillLinkId}`, {
      yearsExperience: 10,
    }, authW2);
    assert(idorSkill.status === 403, "IDOR: Worker 2 blocked from editing Worker 1's skill with 403");

    // Delete skill
    const delSkill = await apiCall("DELETE", `/worker/skills/${skillLinkId}`, null, authW1);
    assert(delSkill.status === 200, "DELETE /worker/skills/:id deletes skill");

    // ----------------------------------------------------
    // TEST 5: RATES MANAGEMENT & BOUNDARY VALIDATION
    // ----------------------------------------------------
    const ratesGet = await apiCall("GET", "/worker/rates", null, authW1);
    assert(ratesGet.status === 200, "GET /worker/rates returns 200 OK");
    assert(ratesGet.data?.data?.dailyRate >= 300, "Daily rate is above minimum threshold");

    // Reject invalid low rate (< 300)
    const badRate = await apiCall("PUT", "/worker/rates", { dailyRate: 150 }, authW1);
    assert(badRate.status === 400, "Rates < ₹300 rejected with 400 Bad Request");

    // Accept valid rates
    const goodRate = await apiCall("PUT", "/worker/rates", {
      dailyRate: 1100,
      hourlyRate: 160,
    }, authW1);
    assert(goodRate.status === 200, "Valid rates updated successfully");
    assert(goodRate.data?.data?.dailyRate === 1100, "Daily rate set to ₹1100");

    // ----------------------------------------------------
    // TEST 6: SERVICE AREAS CRUD & VALIDATION
    // ----------------------------------------------------
    const saGet = await apiCall("GET", "/worker/service-areas", null, authW1);
    assert(saGet.status === 200, "GET /worker/service-areas returns 200 OK");

    // Invalid PIN code rejection
    const badPIN = await apiCall("POST", "/worker/service-areas", {
      city: "Faridabad",
      pincode: "123", // invalid
    }, authW1);
    assert(badPIN.status === 400, "Invalid PIN code rejected with 400 Bad Request");

    // Add service area
    const addSA = await apiCall("POST", "/worker/service-areas", {
      city: "Faridabad",
      pincode: "121001",
      areaName: "Sector 15",
      radiusKm: 30,
    }, authW1);
    assert(addSA.status === 201, "POST /worker/service-areas adds valid area");
    const saId = addSA.data?.data?.id;

    // IDOR Check: Worker 2 cannot delete Worker 1's service area
    const idorSA = await apiCall("DELETE", `/worker/service-areas/${saId}`, null, authW2);
    assert(idorSA.status === 403, "IDOR: Worker 2 blocked from deleting Worker 1's service area with 403");

    // Delete service area
    const delSA = await apiCall("DELETE", `/worker/service-areas/${saId}`, null, authW1);
    assert(delSA.status === 200, "DELETE /worker/service-areas/:id deletes area");

    // ----------------------------------------------------
    // TEST 7: AVAILABILITY TOGGLE & STATUS
    // ----------------------------------------------------
    const availGet = await apiCall("GET", "/worker/availability", null, authW1);
    assert(availGet.status === 200, "GET /worker/availability returns 200 OK");

    const toggleAvail = await apiCall("PUT", "/worker/availability", {
      isAvailable: false,
    }, authW1);
    assert(toggleAvail.status === 200, "PUT /worker/availability toggled to false");
    assert(toggleAvail.data?.data?.isAvailable === false, "isAvailable verified as false");

    // Re-enable availability
    const reAvail = await apiCall("PUT", "/worker/availability", {
      isAvailable: true,
    }, authW1);
    assert(reAvail.data?.data?.isAvailable === true, "Worker availability re-enabled");

    // ----------------------------------------------------
    // TEST 8: JOB DISCOVERY FOR WORKERS
    // ----------------------------------------------------
    const jobsList = await apiCall("GET", "/worker/jobs", null, authW1);
    assert(jobsList.status === 200, "GET /worker/jobs returns 200 OK");
    assert(Array.isArray(jobsList.data?.data) && jobsList.data?.data?.length > 0, "Open jobs found in marketplace");

    const firstJob = jobsList.data?.data[0];
    const jobId = firstJob.id;

    // Filter by city
    const jobsCity = await apiCall("GET", `/worker/jobs?city=${encodeURIComponent(firstJob.city)}`, null, authW1);
    assert(jobsCity.status === 200, "Filtering jobs by city returns 200 OK");

    // Get single job details
    const singleJob = await apiCall("GET", `/worker/jobs/${jobId}`, null, authW1);
    assert(singleJob.status === 200, "GET /worker/jobs/:id returns 200 OK");
    assert(singleJob.data?.data?.title === firstJob.title, "Job title verified");

    // ----------------------------------------------------
    // TEST 9: JOB APPLICATIONS & PROPOSALS
    // ----------------------------------------------------
    const applyRes = await apiCall("POST", "/worker/applications", {
      jobId,
      proposedRate: 1050,
      coverNote: "I have 7 years of hands-on experience and can start immediately tomorrow.",
    }, authW1);
    assert(applyRes.status === 201, "POST /worker/applications submits proposal with 201");
    const applicationId = applyRes.data?.data?.id;

    // Prevent duplicate application
    const dupApply = await apiCall("POST", "/worker/applications", {
      jobId,
      proposedRate: 1100,
    }, authW1);
    assert(dupApply.status === 409, "Duplicate job application rejected with 409 Conflict");

    // List applications
    const myApps = await apiCall("GET", "/worker/applications", null, authW1);
    assert(myApps.status === 200, "GET /worker/applications returns 200 OK");
    assert(myApps.data?.data?.some((a) => a.id === applicationId), "Submitted application present in list");

    // Single application view
    const singleApp = await apiCall("GET", `/worker/applications/${applicationId}`, null, authW1);
    assert(singleApp.status === 200, "GET /worker/applications/:id returns 200 OK");

    // IDOR Check: Worker 2 cannot view or withdraw Worker 1's application
    const idorAppView = await apiCall("GET", `/worker/applications/${applicationId}`, null, authW2);
    assert(idorAppView.status === 403, "IDOR: Worker 2 blocked from viewing Worker 1's application with 403");

    const idorWithdraw = await apiCall("PATCH", `/worker/applications/${applicationId}/withdraw`, null, authW2);
    assert(idorWithdraw.status === 403, "IDOR: Worker 2 blocked from withdrawing Worker 1's application with 403");

    // Withdraw application
    const withdrawRes = await apiCall("PATCH", `/worker/applications/${applicationId}/withdraw`, null, authW1);
    assert(withdrawRes.status === 200, "PATCH /worker/applications/:id/withdraw succeeds");
    assert(withdrawRes.data?.data?.status === "WITHDRAWN", "Application status updated to WITHDRAWN");

    // ----------------------------------------------------
    // TEST 10: WORK LIFECYCLE & STATUS PROGRESSION
    // ----------------------------------------------------
    // Customer books Worker 1
    const createBooking = await apiCall("POST", "/bookings", {
      workerId: regW1.data?.data?.user?.id,
      serviceCategory: "Electrician",
      startDate: new Date().toISOString(),
      totalDays: 2,
      address: "102 Sector 44, Gurugram",
      city: "Gurugram",
      notes: "Replace switchboard and check main MCB line",
    }, authCust);
    assert(createBooking.status === 201, "Customer created booking request");
    const bookingId = createBooking.data?.data?.id;

    // Worker 1 views their work queue
    const workList = await apiCall("GET", "/worker/work", null, authW1);
    assert(workList.status === 200, "GET /worker/work returns 200 OK");
    assert(workList.data?.data?.some((b) => b.id === bookingId), "Booking appears in worker's work queue");

    // Worker 1 accepts booking -> ACCEPTED
    const acceptWork = await apiCall("PATCH", `/worker/work/${bookingId}/status`, {
      status: "ACCEPTED",
    }, authW1);
    assert(acceptWork.status === 200, "Worker accepts booking request -> status ACCEPTED");

    // Worker 1 starts work -> IN_PROGRESS
    const startWork = await apiCall("PATCH", `/worker/work/${bookingId}/status`, {
      status: "IN_PROGRESS",
    }, authW1);
    assert(startWork.status === 200, "Worker starts work -> status IN_PROGRESS");

    // Worker 1 completes work -> COMPLETED
    const completeWork = await apiCall("PATCH", `/worker/work/${bookingId}/status`, {
      status: "COMPLETED",
      completionNotes: "All switchboard modular fittings replaced and load verified.",
    }, authW1);
    assert(completeWork.status === 200, "Worker completes work -> status COMPLETED");
    assert(completeWork.data?.data?.status === "COMPLETED", "Booking status confirmed as COMPLETED");

    // ----------------------------------------------------
    // TEST 11: EARNINGS LEDGER & PDF STATEMENT
    // ----------------------------------------------------
    const earningsRes = await apiCall("GET", "/worker/earnings", null, authW1);
    assert(earningsRes.status === 200, "GET /worker/earnings returns 200 OK");
    assert(earningsRes.data?.data?.summary?.totalConfirmedEarnings > 0, "Confirmed earnings derived from completed work");
    assert(earningsRes.data?.data?.transactions?.length > 0, "Itemized transactions returned in ledger");

    // Download PDF statement
    const stmtRes = await apiCall("GET", "/worker/earnings/statement", null, authW1);
    assert(stmtRes.status === 200, "GET /worker/earnings/statement returns 200 OK");
    assert(stmtRes.headers.get("content-type")?.includes("application/pdf"), "Content-Type is application/pdf");
    const isPdfHeader = Buffer.isBuffer(stmtRes.data) && stmtRes.data.subarray(0, 4).toString() === "%PDF";
    assert(isPdfHeader, "Statement is a valid binary PDF with '%PDF-' header");

    // ----------------------------------------------------
    // TEST 12: VERIFICATION SUBMISSION & STATUS
    // ----------------------------------------------------
    const verifRes = await apiCall("POST", "/worker/verification", {
      idType: "Voter ID",
      idNumber: "VTR-DL-882200",
      documentUrl: "https://storage.majdur.in/kyc/voter_card_sanjay.pdf",
    }, authW1);
    assert(verifRes.status === 201, "POST /worker/verification submits KYC with 201");

    const verifStatus = await apiCall("GET", "/worker/verification", null, authW1);
    assert(verifStatus.status === 200, "GET /worker/verification returns 200 OK");
    assert(verifStatus.data?.data?.latestRequest?.idNumber === "VTR-DL-882200", "Verification request recorded in DB");

    // ----------------------------------------------------
    // FINAL DASHBOARD VERIFICATION
    // ----------------------------------------------------
    const finalDash = await apiCall("GET", "/worker/dashboard", null, authW1);
    assert(finalDash.status === 200, "Final dashboard returns 200 OK");
    assert(finalDash.data?.data?.stats?.completedWorkCount >= 1, "Completed work count incremented");
    assert(finalDash.data?.data?.stats?.totalEarnings > 0, "Final totalEarnings > 0 confirmed");

  } catch (err) {
    console.error("Test Suite Uncaught Error:", err);
    failed++;
  } finally {
    server.close();
    await prisma.$disconnect();
    console.log(`\n=========================================`);
    console.log(`📊 Phase 6 Worker Portal Results: ${passed} PASSED, ${failed} FAILED`);
    console.log(`=========================================\n`);
    if (failed > 0) process.exit(1);
  }
}

runWorkerPortalSuite();


process.env.NODE_ENV = "test";
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { app } = require(path.resolve(__dirname, "../backend/dist/server.js"));
const { prisma } = require(path.resolve(__dirname, "../backend/dist/config/prisma.js"));
const http = require("http");

async function runContractorPortalSuite() {
  const PORT = 5092;
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`\n=========================================`);
  console.log(`🧪 MajDur Phase 7 Contractor B2B Portal Test Suite`);
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
  const contractor1Phone = `9${baseNum}`;
  const contractor2Phone = `8${baseNum}`;
  const worker1Phone = `7${baseNum}`;
  const worker2Phone = `6${baseNum}`;

  try {
    // ----------------------------------------------------
    // TEST 1: Register Contractor A & Contractor B
    // ----------------------------------------------------
    console.log(`\n--- Test 1: Contractor Registration & Auth ---`);
    const regResA = await apiCall("POST", "/auth/register/contractor", {
      companyName: "Harsh Infrastructure Projects Ltd",
      contactPerson: "Harsh Singh",
      phone: contractor1Phone,
      email: `contractorA_${baseNum}@majdur.test`,
      password: "ContractorPass123!",
      city: "New Delhi",
    });

    assert(regResA.status === 201, `Contractor A registered successfully (Status: ${regResA.status})`);
    const contractorAToken = regResA.data?.data?.accessToken;
    const contractorAId = regResA.data?.data?.user?.id;
    assert(Boolean(contractorAToken), `Contractor A received JWT token`);

    const authHeaderA = { Authorization: `Bearer ${contractorAToken}` };

    const regResB = await apiCall("POST", "/auth/register/contractor", {
      companyName: "Apex Buildtech Corp",
      contactPerson: "Vikram Malhotra",
      phone: contractor2Phone,
      email: `contractorB_${baseNum}@majdur.test`,
      password: "ContractorPass123!",
      city: "Mumbai",
    });

    assert(regResB.status === 201, `Contractor B registered successfully (Status: ${regResB.status})`);
    const contractorBToken = regResB.data?.data?.accessToken;
    const authHeaderB = { Authorization: `Bearer ${contractorBToken}` };

    // Register Workers for Recruitment tests
    const regWorker1 = await apiCall("POST", "/auth/register/worker", {
      name: "Ramesh Sharma Mason",
      phone: worker1Phone,
      email: `ramesh_${baseNum}@majdur.test`,
      password: "WorkerPass123!",
      trade: "Mason",
      city: "New Delhi",
    });
    assert(regWorker1.status === 201, `Worker 1 (Mason) registered`);
    const worker1Id = regWorker1.data?.data?.user?.id;

    const regWorker2 = await apiCall("POST", "/auth/register/worker", {
      name: "Suresh Verma Electrician",
      phone: worker2Phone,
      email: `suresh_${baseNum}@majdur.test`,
      password: "WorkerPass123!",
      trade: "Electrician",
      city: "New Delhi",
    });
    assert(regWorker2.status === 201, `Worker 2 (Electrician) registered`);
    const worker2Id = regWorker2.data?.data?.user?.id;

    // ----------------------------------------------------
    // TEST 2: Contractor Business Profile Management
    // ----------------------------------------------------
    console.log(`\n--- Test 2: Contractor Business Profile & GSTIN ---`);
    const profileUpdateRes = await apiCall(
      "PUT",
      "/contractor/profile",
      {
        companyName: "Harsh Mega Infrastructure Ltd",
        ownerName: "Harsh Singh",
        businessEmail: "b2b@harshinfra.com",
        businessPhone: contractor1Phone,
        gstin: "07AAAAA0000A1Z5", // Delhi GSTIN (07)
        panNumber: "AAAAA0000A",
        businessAddress: "101, Connaught Place, Barakhamba Road",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        businessType: "Private Limited",
      },
      authHeaderA
    );

    assert(profileUpdateRes.status === 200, `Contractor profile updated (Status: ${profileUpdateRes.status})`);
    assert(
      profileUpdateRes.data?.data?.gstin === "07AAAAA0000A1Z5",
      `Profile holds valid GSTIN: ${profileUpdateRes.data?.data?.gstin}`
    );

    const getProfileRes = await apiCall("GET", "/contractor/profile", null, authHeaderA);
    assert(getProfileRes.status === 200, `Contractor profile retrieved successfully`);
    const contractorAProfileId = getProfileRes.data?.data?.id;

    // ----------------------------------------------------
    // TEST 3: Commercial Project Creation & Multi-Site Auto-Creation
    // ----------------------------------------------------
    console.log(`\n--- Test 3: Commercial Project Creation & Multi-Site Management ---`);
    const createProjectRes = await apiCall(
      "POST",
      "/contractor/projects",
      {
        name: "Connaught Metro Tower Commercial Complex",
        description: "32-Floor commercial high-rise tower with twin basements and retail atrium.",
        category: "COMMERCIAL",
        clientName: "Delhi Metro Rail Corporation (DMRC)",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        address: "Barakhamba Road, Connaught Place",
        startDate: "2026-12-01",
        endDate: "2028-06-30",
        budget: 45000000,
        requiredTrades: ["Mason", "Electrician", "Construction Labour", "Welder", "Painter"],
        totalWorkforceNeeded: 120,
      },
      authHeaderA
    );

    assert(createProjectRes.status === 201, `Project created successfully (Status: ${createProjectRes.status})`);
    const project = createProjectRes.data?.data;
    const projectId = project?.id;
    assert(Boolean(projectId), `Project ID generated: ${projectId}`);
    assert(project?.projectCode?.startsWith("PRJ-"), `Project Code generated: ${project?.projectCode}`);

    // Verify auto-created Site 1
    const sitesRes = await apiCall("GET", `/contractor/projects/${projectId}/sites`, null, authHeaderA);
    assert(sitesRes.status === 200, `Sites retrieved for project`);
    assert(sitesRes.data?.data?.length === 1, `Auto-created Site-01 exists for newly created project`);
    const site1 = sitesRes.data?.data?.[0];
    const site1Id = site1?.id;

    // Create Site 2 for Multi-Site testing
    const createSite2Res = await apiCall(
      "POST",
      `/contractor/projects/${projectId}/sites`,
      {
        siteCode: "SITE-02",
        name: "North Retail Plaza & Atrium",
        address: "Gate 4, Metro Interchange",
        city: "New Delhi",
        pincode: "110001",
        siteManager: "Er. Amit Saxena",
      },
      authHeaderA
    );
    assert(createSite2Res.status === 201, `Second site created: SITE-02`);
    const site2Id = createSite2Res.data?.data?.id;

    // ----------------------------------------------------
    // TEST 4: Bulk Worker Recruitment (10-100+ Workers)
    // ----------------------------------------------------
    console.log(`\n--- Test 4: Bulk Worker Recruitment (100 Workers Drive) ---`);
    const bulkRecruitmentRes = await apiCall(
      "POST",
      `/contractor/projects/${projectId}/recruitment`,
      {
        title: "Bulk Masonry and Civil Workforce Drive (100 Workers)",
        totalWorkersNeeded: 100,
        dailyRate: 950,
        shiftType: "DAY",
        workingHours: 9,
        requiredExperienceYears: 3,
        recruitmentDeadline: "2026-12-15",
        notes: "Safety gear and daily lunch provided at site.",
        tradeRequirements: [
          { trade: "Mason", count: 30, dailyRate: 950 },
          { trade: "Construction Labour", count: 50, dailyRate: 750 },
          { trade: "Electrician", count: 20, dailyRate: 1100 },
        ],
      },
      authHeaderA
    );

    assert(bulkRecruitmentRes.status === 201, `Bulk recruitment drive launched (Status: ${bulkRecruitmentRes.status})`);
    const recruitmentDrive = bulkRecruitmentRes.data?.data;
    const recruitmentId = recruitmentDrive?.id;
    assert(recruitmentDrive?.requestNumber?.startsWith("BR-"), `Request Number assigned: ${recruitmentDrive?.requestNumber}`);

    // Add Worker 1 Application to Bulk Drive
    const applyWorker1 = await apiCall(
      "POST",
      `/contractor/recruitment/${recruitmentId}/applications`,
      {
        workerId: worker1Id,
        trade: "Mason",
        proposedRate: 950,
        notes: "Experienced in stone and brick masonry for 6 years.",
      },
      authHeaderA
    );
    assert(applyWorker1.status === 201, `Worker 1 applied to bulk recruitment drive`);
    const application1Id = applyWorker1.data?.data?.id;

    // Test Duplicate Application Prevention (409 Conflict)
    const duplicateApply = await apiCall(
      "POST",
      `/contractor/recruitment/${recruitmentId}/applications`,
      {
        workerId: worker1Id,
        trade: "Mason",
        proposedRate: 950,
      },
      authHeaderA
    );
    assert(duplicateApply.status === 409, `Duplicate recruitment application blocked with 409 Conflict`);

    // Add Worker 2 Application
    const applyWorker2 = await apiCall(
      "POST",
      `/contractor/recruitment/${recruitmentId}/applications`,
      {
        workerId: worker2Id,
        trade: "Electrician",
        proposedRate: 1100,
        notes: "Certified industrial electrician.",
      },
      authHeaderA
    );
    assert(applyWorker2.status === 201, `Worker 2 applied to bulk recruitment drive`);
    const application2Id = applyWorker2.data?.data?.id;

    // Update Application Status (SHORTLIST -> ACCEPT)
    const shortlistRes = await apiCall(
      "PATCH",
      `/contractor/recruitment/applications/${application1Id}/status`,
      { status: "SHORTLISTED" },
      authHeaderA
    );
    assert(shortlistRes.status === 200, `Worker 1 application shortlisted`);

    const acceptRes = await apiCall(
      "PATCH",
      `/contractor/recruitment/applications/${application1Id}/status`,
      { status: "ACCEPTED" },
      authHeaderA
    );
    assert(acceptRes.status === 200, `Worker 1 application accepted for project`);

    // Check Recruitment Metrics
    const getRecruitmentList = await apiCall("GET", `/contractor/projects/${projectId}/recruitment`, null, authHeaderA);
    const driveEnriched = getRecruitmentList.data?.data?.[0];
    assert(
      driveEnriched?.metrics?.totalWorkersNeeded === 100 &&
      driveEnriched?.metrics?.workersAccepted === 1 &&
      driveEnriched?.metrics?.remainingVacancies === 99,
      `Recruitment metrics calculated accurately (Total: 100, Accepted: 1, Vacancies: 99)`
    );

    // ----------------------------------------------------
    // TEST 5: Site Teams & Worker Allocation & Transfers
    // ----------------------------------------------------
    console.log(`\n--- Test 5: Teams, Workforce Allocation & Site Transfers ---`);
    // Create Team on Site 1
    const createTeamRes = await apiCall(
      "POST",
      `/contractor/sites/${site1Id}/teams`,
      {
        teamName: "Alpha Civil & Masonry Squad",
        trade: "Mason",
        leadName: "Master Mason Vikram",
      },
      authHeaderA
    );
    assert(createTeamRes.status === 201, `Team created on Site 1`);
    const teamId = createTeamRes.data?.data?.id;

    // Allocate Worker 1 to Site 1
    const allocateRes = await apiCall(
      "POST",
      `/contractor/sites/${site1Id}/assignments`,
      {
        workerId: worker1Id,
        teamId,
        trade: "Mason",
        dailyWage: 950,
        startDate: "2026-12-01",
      },
      authHeaderA
    );
    assert(allocateRes.status === 201, `Worker 1 allocated to Site 1 (Status: ${allocateRes.status})`);
    const assignment1Id = allocateRes.data?.data?.id;

    // Prevent duplicate active allocation
    const duplicateAllocate = await apiCall(
      "POST",
      `/contractor/sites/${site1Id}/assignments`,
      {
        workerId: worker1Id,
        trade: "Mason",
        dailyWage: 950,
      },
      authHeaderA
    );
    assert(duplicateAllocate.status === 409, `Duplicate worker active assignment blocked with 409 Conflict`);

    // Transfer Worker 1 to Site 2
    const transferRes = await apiCall(
      "POST",
      `/contractor/assignments/${assignment1Id}/transfer`,
      {
        targetSiteId: site2Id,
        reason: "Urgent masonry reinforcement needed at Retail Plaza.",
      },
      authHeaderA
    );
    assert(transferRes.status === 200, `Worker 1 transferred to Site 2 successfully`);
    const newAssignmentId = transferRes.data?.data?.id;

    // Verify Worker 1 is now on Site 2
    const site2Workers = await apiCall("GET", `/contractor/sites/${site2Id}/workers`, null, authHeaderA);
    assert(
      site2Workers.data?.data?.some((w) => w.workerId === worker1Id && w.status === "ACTIVE"),
      `Worker 1 successfully active on Site 2 after transfer`
    );

    // ----------------------------------------------------
    // TEST 6: Supervisors & Site Assignments
    // ----------------------------------------------------
    console.log(`\n--- Test 6: Supervisor Management & Site Assignment ---`);
    const createSupRes = await apiCall(
      "POST",
      "/contractor/supervisors",
      {
        name: "Er. Rajesh Kulkarni",
        phone: `91${Date.now().toString().slice(-8)}`,
        email: `sup_${baseNum}@majdur.test`,
        role: "SITE_ENGINEER",
        responsibilities: "Structural quality assurance and daily reporting",
      },
      authHeaderA
    );
    assert(createSupRes.status === 201, `Supervisor created: Er. Rajesh Kulkarni`);
    const supervisorId = createSupRes.data?.data?.id;

    const assignSupRes = await apiCall(
      "POST",
      `/contractor/sites/${site2Id}/supervisors`,
      {
        supervisorId,
        role: "LEAD_SUPERVISOR",
      },
      authHeaderA
    );
    assert(assignSupRes.status === 201, `Supervisor assigned to Site 2`);

    // ----------------------------------------------------
    // TEST 7: Daily Attendance & Daily Work Progress Reports
    // ----------------------------------------------------
    console.log(`\n--- Test 7: Daily Attendance & Progress Reports ---`);
    const today = new Date().toISOString().split("T")[0];

    const markAttendanceRes = await apiCall(
      "POST",
      `/contractor/sites/${site2Id}/attendance`,
      {
        date: today,
        shift: "DAY",
        records: [
          {
            workerId: worker1Id,
            status: "PRESENT",
            inTime: "08:30",
            outTime: "17:30",
            overtimeHours: 1.5,
            notes: "On-time, performed excellent brickwork alignment.",
          },
        ],
      },
      authHeaderA
    );
    assert(markAttendanceRes.status === 200, `Attendance marked successfully for Site 2`);
    assert(markAttendanceRes.data?.data?.count >= 1, `Attendance record persisted`);

    // Submit Daily Work Progress Report
    const reportRes = await apiCall(
      "POST",
      `/contractor/sites/${site2Id}/reports`,
      {
        date: today,
        progressPercentage: 14.5,
        workforcePresent: 28,
        completedWork: "Completed footing concrete pour for columns C1-C12. Plastering on level 1 progressing.",
        issuesEncountered: "Minor cement delay of 30 mins during morning shift.",
        weatherCondition: "CLEAR",
        photos: ["https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=600&q=80"],
      },
      authHeaderA
    );
    assert(reportRes.status === 201, `Daily progress report created for Site 2`);
    assert(reportRes.data?.data?.progressPercentage === 14.5, `Progress percentage recorded: 14.5%`);

    // ----------------------------------------------------
    // TEST 8: B2B GST Invoicing & Tax Engine Verification
    // ----------------------------------------------------
    console.log(`\n--- Test 8: B2B GST Invoicing & Dynamic Tax Engine ---`);
    // Intra-State: Delhi Contractor (07) billing Delhi Client (07)
    // Taxable: Rs 100,000 @ 18% GST -> CGST 9% (Rs 9,000) + SGST 9% (Rs 9,000), IGST 0, Grand Total = Rs 118,000
    const intraStateInvoiceRes = await apiCall(
      "POST",
      "/contractor/invoices",
      {
        projectId,
        recipientName: "Delhi Metro Rail Corporation Ltd",
        recipientGstin: "07AAACD1234D1Z8",
        recipientAddress: "Metro Bhawan, Fire Brigade Lane, Barakhamba Road, New Delhi",
        recipientState: "Delhi",
        taxableAmount: 100000,
        gstRate: 18,
        items: [
          { description: "Skilled Masonry Workforce Services - Level 2", hsnCode: "9985", quantity: 30, unitRate: 2000, amount: 60000 },
          { description: "General Civil Site Operations & Safety Supervision", hsnCode: "9985", quantity: 20, unitRate: 2000, amount: 40000 },
        ],
        notes: "Payment due within 15 days of invoice date.",
      },
      authHeaderA
    );

    assert(intraStateInvoiceRes.status === 201, `Intra-state GST invoice created (Status: ${intraStateInvoiceRes.status})`);
    const intraInvoice = intraStateInvoiceRes.data?.data;
    const intraInvoiceId = intraInvoice?.id;
    assert(intraInvoice?.taxType === "INTRA_STATE", `Tax Type correctly classified as INTRA_STATE`);
    assert(intraInvoice?.cgstRate === 9 && intraInvoice?.cgstAmount === 9000, `CGST 9% calculated correctly: Rs ${intraInvoice?.cgstAmount}`);
    assert(intraInvoice?.sgstRate === 9 && intraInvoice?.sgstAmount === 9000, `SGST 9% calculated correctly: Rs ${intraInvoice?.sgstAmount}`);
    assert(intraInvoice?.igstAmount === 0, `IGST is 0 for Intra-state transaction`);
    assert(intraInvoice?.grandTotal === 118000, `Grand total is Rs 118,000 (Taxable + CGST + SGST)`);

    // Inter-State: Delhi Contractor (07) billing Mumbai Client (Maharashtra 27)
    // Taxable: Rs 200,000 @ 18% GST -> CGST 0, SGST 0, IGST 18% (Rs 36,000), Grand Total = Rs 236,000
    const interStateInvoiceRes = await apiCall(
      "POST",
      "/contractor/invoices",
      {
        projectId,
        recipientName: "Mumbai Metropolitan Infrastructure Ltd",
        recipientGstin: "27BBBBM9999M1Z2",
        recipientAddress: "BKC Commercial Hub, Bandra East, Mumbai",
        recipientState: "Maharashtra",
        taxableAmount: 200000,
        gstRate: 18,
        items: [
          { description: "Structural Steel Welding & Fabrication Team", hsnCode: "9985", quantity: 1, unitRate: 200000, amount: 200000 },
        ],
      },
      authHeaderA
    );

    assert(interStateInvoiceRes.status === 201, `Inter-state GST invoice created (Status: ${interStateInvoiceRes.status})`);
    const interInvoice = interStateInvoiceRes.data?.data;
    assert(interInvoice?.taxType === "INTER_STATE", `Tax Type correctly classified as INTER_STATE`);
    assert(interInvoice?.cgstAmount === 0 && interInvoice?.sgstAmount === 0, `CGST & SGST are 0 for Inter-state`);
    assert(interInvoice?.igstRate === 18 && interInvoice?.igstAmount === 36000, `IGST 18% calculated correctly: Rs ${interInvoice?.igstAmount}`);
    assert(interInvoice?.grandTotal === 236000, `Grand total is Rs 236,000 (Taxable + IGST)`);

    // ----------------------------------------------------
    // TEST 9: Binary PDF Invoice Generation (`%PDF-`)
    // ----------------------------------------------------
    console.log(`\n--- Test 9: PDF Invoice Streaming & Header Validation ---`);
    const pdfRes = await apiCall("GET", `/contractor/invoices/${intraInvoiceId}/pdf`, null, authHeaderA);
    assert(pdfRes.status === 200, `PDF invoice requested successfully (Status: ${pdfRes.status})`);
    const pdfBuffer = pdfRes.data;
    const isBuffer = Buffer.isBuffer(pdfBuffer);
    assert(isBuffer, `Response received as binary Buffer`);
    const pdfHeader = isBuffer ? pdfBuffer.subarray(0, 5).toString() : "";
    assert(pdfHeader.startsWith("%PDF"), `Valid PDF magic header present (${pdfHeader})`);
    assert(pdfBuffer.length > 1000, `PDF size is realistic (${pdfBuffer.length} bytes)`);

    // ----------------------------------------------------
    // TEST 10: Security & IDOR Access Control (Contractor B vs Contractor A)
    // ----------------------------------------------------
    console.log(`\n--- Test 10: Security & IDOR Enforcement ---`);
    // Contractor B trying to access Contractor A's project
    const idorProjectRes = await apiCall("GET", `/contractor/projects/${projectId}`, null, authHeaderB);
    assert(idorProjectRes.status === 403, `IDOR Blocked: Contractor B cannot access Contractor A's project (Status: 403)`);

    // Contractor B trying to update Contractor A's project
    const idorUpdateRes = await apiCall(
      "PUT",
      `/contractor/projects/${projectId}`,
      { name: "Hacked Project" },
      authHeaderB
    );
    assert(idorUpdateRes.status === 403, `IDOR Blocked: Contractor B cannot update Contractor A's project (Status: 403)`);

    // Contractor B trying to view Contractor A's PDF invoice
    const idorInvoicePdfRes = await apiCall("GET", `/contractor/invoices/${intraInvoiceId}/pdf`, null, authHeaderB);
    assert(idorInvoicePdfRes.status === 403, `IDOR Blocked: Contractor B cannot download Contractor A's invoice (Status: 403)`);

    // ----------------------------------------------------
    // TEST 11: Real Contractor Dashboard Metrics
    // ----------------------------------------------------
    console.log(`\n--- Test 11: Enterprise Contractor Dashboard Metrics ---`);
    const dashboardRes = await apiCall("GET", "/contractor/dashboard", null, authHeaderA);
    assert(dashboardRes.status === 200, `Contractor Dashboard fetched successfully`);
    const dash = dashboardRes.data?.data;
    assert(dash?.metrics?.totalProjects >= 1, `Dashboard metrics: totalProjects >= 1`);
    assert(dash?.metrics?.totalSites >= 2, `Dashboard metrics: totalSites >= 2`);
    assert(dash?.metrics?.totalSupervisors >= 1, `Dashboard metrics: totalSupervisors >= 1`);
    assert(dash?.metrics?.totalInvoices >= 2, `Dashboard metrics: totalInvoices >= 2`);
    assert(dash?.metrics?.totalInvoicedAmount >= 354000, `Dashboard metrics: accurate total invoiced amount`);

  } catch (err) {
    console.error("❌ Unexpected Test Runner Failure:", err);
    failed++;
  } finally {
    server.close();
    await prisma.$disconnect();
    console.log(`\n=========================================`);
    console.log(`Contractor Portal Test Suite Complete!`);
    console.log(`Passed: ${passed} | Failed: ${failed}`);
    console.log(`=========================================\n`);
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runContractorPortalSuite();

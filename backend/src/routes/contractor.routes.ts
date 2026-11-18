import { Router, Request, Response, NextFunction } from "express";
import PDFDocument from "pdfkit";
import { prisma } from "../config/prisma";
import { authenticateUser, requireRole } from "../middleware/auth";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

// Protect all contractor routes with authentication and CONTRACTOR or ADMIN role
router.use("/contractor", authenticateUser, requireRole("CONTRACTOR", "ADMIN"));

// Helper: Get or initialize contractor profile
async function getOrCreateContractorProfile(userId: string) {
  let profile = await prisma.contractorProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: { id: true, name: true, phone: true, email: true, avatar: true },
      },
    },
  });

  if (!profile) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    profile = await prisma.contractorProfile.create({
      data: {
        userId,
        companyName: user?.name ? `${user.name} Contracting` : "Contracting Enterprise",
        city: "Delhi NCR",
        state: "Delhi",
        pincode: "110001",
        businessType: "Private Limited",
        isVerified: false,
      },
      include: {
        user: {
          select: { id: true, name: true, phone: true, email: true, avatar: true },
        },
      },
    });
  }

  return profile;
}

// ========================================================
// 1. CONTRACTOR DASHBOARD & PROFILE
// ========================================================

// GET /api/contractor/dashboard
router.get("/contractor/dashboard", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contractor = await getOrCreateContractorProfile(req.user!.id);

    const [
      totalProjects,
      activeProjects,
      sites,
      workforceAssignments,
      supervisorsCount,
      invoices,
      recentProjects,
      recentReports,
      recentInvoices,
    ] = await Promise.all([
      prisma.project.count({ where: { contractorId: contractor.id } }),
      prisma.project.count({
        where: {
          contractorId: contractor.id,
          status: { in: ["PUBLISHED", "RECRUITMENT_OPEN", "IN_PROGRESS"] },
        },
      }),
      prisma.site.findMany({
        where: { project: { contractorId: contractor.id } },
        select: { id: true, status: true },
      }),
      prisma.workerAssignment.findMany({
        where: { site: { project: { contractorId: contractor.id } }, status: "ACTIVE" },
        select: { id: true },
      }),
      prisma.supervisor.count({
        where: { contractorId: contractor.id, status: "ACTIVE" },
      }),
      prisma.gstInvoice.findMany({
        where: { contractorId: contractor.id },
        select: { grandTotal: true, paidAmount: true, paymentStatus: true },
      }),
      prisma.project.findMany({
        where: { contractorId: contractor.id },
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: {
          _count: { select: { sites: true, recruitmentRequests: true } },
        },
      }),
      prisma.dailyWorkReport.findMany({
        where: { site: { project: { contractorId: contractor.id } } },
        take: 5,
        orderBy: { reportDate: "desc" },
        include: { site: { select: { name: true, siteCode: true } } },
      }),
      prisma.gstInvoice.findMany({
        where: { contractorId: contractor.id },
        take: 5,
        orderBy: { invoiceDate: "desc" },
      }),
    ]);

    const totalSites = sites.length;
    const activeSites = sites.filter((s) => s.status === "ACTIVE").length;
    const allocatedWorkers = workforceAssignments.length;

    // Financial calculations
    const pendingInvoices = invoices.filter((i) => i.paymentStatus !== "PAID");
    const outstandingAmount = pendingInvoices.reduce(
      (sum, i) => sum + Math.max(0, i.grandTotal - (i.paidAmount || 0)),
      0
    );
    const totalInvoiced = invoices.reduce((sum, i) => sum + i.grandTotal, 0);

    const stats = {
      totalProjects,
      activeProjects,
      totalSites,
      activeSites,
      allocatedWorkers,
      activeSupervisors: supervisorsCount,
      totalSupervisors: supervisorsCount,
      totalInvoices: invoices.length,
      totalInvoiced,
      totalInvoicedAmount: totalInvoiced,
      outstandingAmount,
      pendingInvoicesCount: pendingInvoices.length,
    };

    return sendSuccess(
      res,
      {
        contractor,
        stats,
        metrics: stats,
        recentProjects,
        recentReports,
        recentInvoices,
      },
      "Contractor dashboard retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
});

// GET /api/contractor/profile
router.get("/contractor/profile", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contractor = await getOrCreateContractorProfile(req.user!.id);
    return sendSuccess(res, contractor, "Contractor profile retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// PUT /api/contractor/profile
router.put("/contractor/profile", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contractor = await getOrCreateContractorProfile(req.user!.id);
    const {
      companyName,
      companyBio,
      gstNumber,
      licenseNumber,
      ownerName,
      businessEmail,
      businessPhone,
      businessAddress,
      businessType,
      panNumber,
      companyLogo,
      city,
      state,
      pincode,
    } = req.body;

    const rawGst = req.body.gstNumber || req.body.gstin;
    const updated = await prisma.contractorProfile.update({
      where: { id: contractor.id },
      data: {
        ...(companyName ? { companyName: companyName.trim() } : {}),
        ...(companyBio !== undefined ? { companyBio: companyBio.trim() } : {}),
        ...(rawGst !== undefined ? { gstNumber: rawGst.trim().toUpperCase() } : {}),
        ...(licenseNumber !== undefined ? { licenseNumber: licenseNumber.trim() } : {}),
        ...(ownerName !== undefined ? { ownerName: ownerName.trim() } : {}),
        ...(businessEmail !== undefined ? { businessEmail: businessEmail.trim().toLowerCase() } : {}),
        ...(businessPhone !== undefined ? { businessPhone: businessPhone.trim() } : {}),
        ...(businessAddress !== undefined ? { businessAddress: businessAddress.trim() } : {}),
        ...(businessType !== undefined ? { businessType: businessType.trim() } : {}),
        ...(panNumber !== undefined ? { panNumber: panNumber.trim().toUpperCase() } : {}),
        ...(companyLogo !== undefined ? { companyLogo: companyLogo.trim() } : {}),
        ...(city ? { city: city.trim() } : {}),
        ...(state ? { state: state.trim() } : {}),
        ...(pincode ? { pincode: pincode.trim() } : {}),
      },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true, avatar: true } },
      },
    });

    const responseData = {
      ...updated,
      gstin: updated.gstNumber,
    };

    return sendSuccess(res, responseData, "Contractor business profile updated successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 2. COMMERCIAL PROJECT CREATION & MANAGEMENT
// ========================================================

// POST /api/contractor/projects
router.post("/contractor/projects", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contractor = await getOrCreateContractorProfile(req.user!.id);
    const {
      name,
      description,
      category,
      clientName,
      city,
      state,
      pincode,
      address,
      startDate,
      endDate,
      budget,
      status,
      requiredTrades,
      totalWorkforceNeeded,
    } = req.body;

    if (!name || !description || !clientName || !city || budget === undefined) {
      return sendError(res, "Name, description, client name, city, and budget are required", 400);
    }

    // Generate unique project code
    const year = new Date().getFullYear();
    const count = await prisma.project.count();
    const projectCode = `PRJ-${year}-${String(count + 1).padStart(4, "0")}-${Math.floor(100 + Math.random() * 900)}`;

    const project = await prisma.project.create({
      data: {
        contractorId: contractor.id,
        projectCode,
        name: name.trim(),
        description: description.trim(),
        category: category || "Commercial Construction",
        clientName: clientName.trim(),
        city: city.trim(),
        state: state || contractor.state || "Delhi",
        pincode: pincode || contractor.pincode || "110001",
        address: address || `${city}, India`,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        budget: Number(budget) || 0,
        status: status || "PUBLISHED",
        requiredTrades: Array.isArray(requiredTrades) ? requiredTrades : [],
        totalWorkforceNeeded: Number(totalWorkforceNeeded) || 10,
      },
    });

    // Auto-create initial Site 1 under this project
    await prisma.site.create({
      data: {
        projectId: project.id,
        siteCode: "SITE-01",
        name: `${project.name} - Main Site`,
        address: project.address,
        city: project.city,
        pincode: project.pincode,
        status: "ACTIVE",
      },
    });

    return sendSuccess(res, project, "Commercial project created successfully", 201);
  } catch (error) {
    next(error);
  }
});

// GET /api/contractor/projects
router.get("/contractor/projects", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contractor = await getOrCreateContractorProfile(req.user!.id);
    const { status, category, search } = req.query;

    const where: any = { contractorId: contractor.id };
    if (status && status !== "ALL") where.status = status;
    if (category && category !== "ALL") where.category = category;
    if (search && typeof search === "string") {
      where.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { projectCode: { contains: search.trim(), mode: "insensitive" } },
        { clientName: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            sites: true,
            recruitmentRequests: true,
            gstInvoices: true,
          },
        },
      },
    });

    return sendSuccess(res, projects, "Projects retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// GET /api/contractor/projects/:id
router.get("/contractor/projects/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contractor = await getOrCreateContractorProfile(req.user!.id);
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        sites: {
          include: {
            _count: {
              select: {
                workerAssignments: true,
                teams: true,
                dailyReports: true,
              },
            },
          },
        },
        recruitmentRequests: {
          include: {
            _count: { select: { applications: true } },
          },
        },
        gstInvoices: {
          orderBy: { invoiceDate: "desc" },
          take: 5,
        },
      },
    });

    if (!project) return sendError(res, "Project not found", 404);
    if (project.contractorId !== contractor.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Unauthorized access to this project", 403);
    }

    return sendSuccess(res, project, "Project details retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// PUT /api/contractor/projects/:id
router.put("/contractor/projects/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contractor = await getOrCreateContractorProfile(req.user!.id);
    const { id } = req.params;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) return sendError(res, "Project not found", 404);
    if (existing.contractorId !== contractor.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Unauthorized", 403);
    }

    const {
      name,
      description,
      category,
      clientName,
      city,
      state,
      pincode,
      address,
      startDate,
      endDate,
      budget,
      status,
      requiredTrades,
      totalWorkforceNeeded,
    } = req.body;

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(description ? { description: description.trim() } : {}),
        ...(category ? { category } : {}),
        ...(clientName ? { clientName: clientName.trim() } : {}),
        ...(city ? { city: city.trim() } : {}),
        ...(state ? { state: state.trim() } : {}),
        ...(pincode ? { pincode: pincode.trim() } : {}),
        ...(address ? { address: address.trim() } : {}),
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(endDate ? { endDate: new Date(endDate) } : {}),
        ...(budget !== undefined ? { budget: Number(budget) } : {}),
        ...(status ? { status } : {}),
        ...(Array.isArray(requiredTrades) ? { requiredTrades } : {}),
        ...(totalWorkforceNeeded !== undefined ? { totalWorkforceNeeded: Number(totalWorkforceNeeded) } : {}),
      },
    });

    return sendSuccess(res, updated, "Project updated successfully");
  } catch (error) {
    next(error);
  }
});

// DELETE /api/contractor/projects/:id
router.delete("/contractor/projects/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contractor = await getOrCreateContractorProfile(req.user!.id);
    const { id } = req.params;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) return sendError(res, "Project not found", 404);
    if (existing.contractorId !== contractor.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Unauthorized", 403);
    }

    await prisma.project.delete({ where: { id } });
    return sendSuccess(res, { id }, "Project deleted successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 3. BULK WORKER RECRUITMENT (10-100+ WORKERS)
// ========================================================

// POST /api/contractor/projects/:id/recruitment
router.post("/contractor/projects/:id/recruitment", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contractor = await getOrCreateContractorProfile(req.user!.id);
    const { id: projectId } = req.params;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return sendError(res, "Project not found", 404);
    if (project.contractorId !== contractor.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Unauthorized", 403);
    }

    const {
      title,
      totalWorkersNeeded,
      dailyRate,
      shiftType,
      workingHours,
      requiredExperienceYears,
      recruitmentDeadline,
      notes,
      tradeRequirements,
    } = req.body;

    if (!title || !totalWorkersNeeded || !dailyRate) {
      return sendError(res, "Title, total workers count, and daily rate are required", 400);
    }

    const year = new Date().getFullYear();
    const count = await prisma.recruitmentRequest.count();
    const requestNumber = `BR-${year}-${String(count + 1).padStart(4, "0")}-${Math.floor(100 + Math.random() * 900)}`;

    const recruitment = await prisma.recruitmentRequest.create({
      data: {
        projectId,
        requestNumber,
        title: title.trim(),
        totalWorkersNeeded: Math.max(1, Number(totalWorkersNeeded)),
        dailyRate: Number(dailyRate),
        shiftType: shiftType || "DAY",
        workingHours: Number(workingHours) || 8,
        requiredExperienceYears: Number(requiredExperienceYears) || 2,
        recruitmentDeadline: recruitmentDeadline ? new Date(recruitmentDeadline) : null,
        notes: notes ? notes.trim() : null,
        tradeRequirements: Array.isArray(tradeRequirements) ? tradeRequirements : null,
        status: "OPEN",
      },
    });

    // Update project status to RECRUITMENT_OPEN
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "RECRUITMENT_OPEN" },
    });

    return sendSuccess(res, recruitment, "Bulk recruitment request launched successfully", 201);
  } catch (error) {
    next(error);
  }
});

// GET /api/contractor/projects/:id/recruitment
router.get("/contractor/projects/:id/recruitment", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contractor = await getOrCreateContractorProfile(req.user!.id);
    const { id: projectId } = req.params;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return sendError(res, "Project not found", 404);
    if (project.contractorId !== contractor.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Unauthorized", 403);
    }

    const requests = await prisma.recruitmentRequest.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        applications: {
          include: {
            worker: {
              select: { id: true, name: true, phone: true, avatar: true },
            },
          },
        },
      },
    });

    // Enrich with recruitment metrics
    const enriched = requests.map((r) => {
      const total = r.totalWorkersNeeded;
      const applied = r.applications.length;
      const shortlisted = r.applications.filter((a) => a.status === "SHORTLISTED").length;
      const accepted = r.applications.filter((a) => a.status === "ACCEPTED").length;
      const remainingVacancies = Math.max(0, total - accepted);
      const completionPercentage = Math.min(100, Math.round((accepted / total) * 100));

      return {
        ...r,
        metrics: {
          totalWorkersNeeded: total,
          applicationsReceived: applied,
          workersShortlisted: shortlisted,
          workersAccepted: accepted,
          remainingVacancies,
          completionPercentage,
        },
      };
    });

    return sendSuccess(res, enriched, "Recruitment requests retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// POST /api/contractor/recruitment/:id/applications (Apply or allocate worker to bulk request)
router.post("/contractor/recruitment/:id/applications", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: recruitmentRequestId } = req.params;
    const { workerId, trade, proposedRate, notes, status = "PENDING" } = req.body;

    if (!workerId || !trade || proposedRate === undefined) {
      return sendError(res, "Worker ID, trade, and proposed rate are required", 400);
    }

    const reqRecord = await prisma.recruitmentRequest.findUnique({
      where: { id: recruitmentRequestId },
    });
    if (!reqRecord) return sendError(res, "Recruitment request not found", 404);

    // Prevent duplicate application
    const existing = await prisma.recruitmentApplication.findUnique({
      where: {
        recruitmentRequestId_workerId: {
          recruitmentRequestId,
          workerId,
        },
      },
    });

    if (existing) {
      return sendError(res, "Worker has already applied / been added to this recruitment drive", 409);
    }

    const application = await prisma.recruitmentApplication.create({
      data: {
        recruitmentRequestId,
        workerId,
        trade: trade.trim(),
        proposedRate: Number(proposedRate),
        notes: notes ? notes.trim() : null,
        status,
      },
      include: {
        worker: { select: { id: true, name: true, phone: true } },
      },
    });

    return sendSuccess(res, application, "Application added to recruitment drive", 201);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/contractor/recruitment/applications/:appId/status
router.patch("/contractor/recruitment/applications/:appId/status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appId } = req.params;
    const { status } = req.body;

    if (!status || !["PENDING", "SHORTLISTED", "ACCEPTED", "REJECTED", "WITHDRAWN"].includes(status)) {
      return sendError(res, "Valid status is required", 400);
    }

    const application = await prisma.recruitmentApplication.findUnique({
      where: { id: appId },
      include: { recruitmentRequest: { include: { project: true } } },
    });

    if (!application) return sendError(res, "Application not found", 404);

    const contractor = await getOrCreateContractorProfile(req.user!.id);
    if (application.recruitmentRequest.project.contractorId !== contractor.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Unauthorized", 403);
    }

    const updated = await prisma.recruitmentApplication.update({
      where: { id: appId },
      data: { status },
    });

    return sendSuccess(res, updated, `Application status updated to ${status}`);
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 4. MULTI-SITE MANAGEMENT
// ========================================================

// POST /api/contractor/projects/:id/sites
router.post("/contractor/projects/:id/sites", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contractor = await getOrCreateContractorProfile(req.user!.id);
    const { id: projectId } = req.params;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return sendError(res, "Project not found", 404);
    if (project.contractorId !== contractor.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Unauthorized", 403);
    }

    const { name, address, city, pincode, siteManager, siteCode } = req.body;
    if (!name || !address || !city) {
      return sendError(res, "Site name, address, and city are required", 400);
    }

    const siteCount = await prisma.site.count({ where: { projectId } });
    const code = siteCode || `SITE-${String(siteCount + 1).padStart(2, "0")}`;

    const site = await prisma.site.create({
      data: {
        projectId,
        siteCode: code,
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        pincode: pincode || project.pincode,
        siteManager: siteManager ? siteManager.trim() : null,
        status: "ACTIVE",
      },
    });

    return sendSuccess(res, site, "Site created successfully", 201);
  } catch (error) {
    next(error);
  }
});

// GET /api/contractor/projects/:id/sites
router.get("/contractor/projects/:id/sites", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contractor = await getOrCreateContractorProfile(req.user!.id);
    const { id: projectId } = req.params;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return sendError(res, "Project not found", 404);
    if (project.contractorId !== contractor.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Unauthorized", 403);
    }

    const sites = await prisma.site.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      include: {
        teams: true,
        supervisorAssignments: {
          include: { supervisor: true },
        },
        _count: {
          select: { workerAssignments: true, attendanceRecords: true, dailyReports: true },
        },
      },
    });

    return sendSuccess(res, sites, "Sites retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 5. TEAMS MANAGEMENT
// ========================================================

// POST /api/contractor/sites/:id/teams
router.post("/contractor/sites/:id/teams", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: siteId } = req.params;
    const { name, teamName, trade, teamLeaderName, leadName, teamLeaderPhone, shift } = req.body;
    const finalName = (name || teamName || "").trim();
    const finalLead = (teamLeaderName || leadName || "").trim();

    if (!finalName || !trade) {
      return sendError(res, "Team name and trade category are required", 400);
    }

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: { project: true },
    });
    if (!site) return sendError(res, "Site not found", 404);

    const contractor = await getOrCreateContractorProfile(req.user!.id);
    if (site.project.contractorId !== contractor.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Unauthorized", 403);
    }

    const team = await prisma.siteTeam.create({
      data: {
        siteId,
        name: finalName,
        trade: trade.trim(),
        teamLeaderName: finalLead || null,
        teamLeaderPhone: teamLeaderPhone ? teamLeaderPhone.trim() : null,
        shift: shift || "MORNING",
      },
    });

    return sendSuccess(res, team, "Site team created successfully", 201);
  } catch (error) {
    next(error);
  }
});

// GET /api/contractor/sites/:id/teams
router.get("/contractor/sites/:id/teams", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: siteId } = req.params;

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: { project: true },
    });
    if (!site) return sendError(res, "Site not found", 404);

    const teams = await prisma.siteTeam.findMany({
      where: { siteId },
      include: {
        assignments: {
          include: { worker: { select: { id: true, name: true, phone: true } } },
        },
      },
    });

    return sendSuccess(res, teams, "Site teams retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 6. WORKFORCE ALLOCATION & WORKER ASSIGNMENT
// ========================================================

// POST /api/contractor/sites/:id/assignments (Assign worker to site)
router.post("/contractor/sites/:id/assignments", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: siteId } = req.params;
    const { workerId, trade, dailyWage, teamId } = req.body;

    if (!workerId || !trade || dailyWage === undefined) {
      return sendError(res, "Worker ID, trade, and daily wage are required", 400);
    }

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: { project: true },
    });
    if (!site) return sendError(res, "Site not found", 404);

    const contractor = await getOrCreateContractorProfile(req.user!.id);
    if (site.project.contractorId !== contractor.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Unauthorized", 403);
    }

    // Check if worker already has active assignment on this site
    const existing = await prisma.workerAssignment.findFirst({
      where: { siteId, workerId, status: "ACTIVE" },
    });

    if (existing) {
      return sendError(res, "Worker is already actively assigned to this site", 409);
    }

    const assignment = await prisma.workerAssignment.create({
      data: {
        siteId,
        workerId,
        trade: trade.trim(),
        dailyWage: Number(dailyWage),
        teamId: teamId || null,
        status: "ACTIVE",
      },
      include: {
        worker: { select: { id: true, name: true, phone: true } },
        site: { select: { name: true, siteCode: true } },
      },
    });

    return sendSuccess(res, assignment, "Worker allocated to site successfully", 201);
  } catch (error) {
    next(error);
  }
});

// GET /api/contractor/sites/:id/workers
router.get("/contractor/sites/:id/workers", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: siteId } = req.params;

    const workers = await prisma.workerAssignment.findMany({
      where: { siteId },
      orderBy: { createdAt: "desc" },
      include: {
        worker: { select: { id: true, name: true, phone: true, avatar: true } },
        team: true,
      },
    });

    return sendSuccess(res, workers, "Site workforce retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// POST /api/contractor/assignments/:id/transfer (Transfer worker to another site)
router.post("/contractor/assignments/:id/transfer", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { targetSiteId } = req.body;

    if (!targetSiteId) {
      return sendError(res, "Target site ID is required", 400);
    }

    const currentAssignment = await prisma.workerAssignment.findUnique({
      where: { id },
      include: { site: { include: { project: true } } },
    });

    if (!currentAssignment) return sendError(res, "Assignment not found", 404);

    const contractor = await getOrCreateContractorProfile(req.user!.id);
    if (currentAssignment.site.project.contractorId !== contractor.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Unauthorized", 403);
    }

    // Mark old assignment as TRANSFERRED
    await prisma.workerAssignment.update({
      where: { id },
      data: { status: "TRANSFERRED", endDate: new Date() },
    });

    // Create new assignment at target site
    const newAssignment = await prisma.workerAssignment.create({
      data: {
        siteId: targetSiteId,
        workerId: currentAssignment.workerId,
        trade: currentAssignment.trade,
        dailyWage: currentAssignment.dailyWage,
        status: "ACTIVE",
      },
      include: {
        worker: { select: { id: true, name: true, phone: true } },
        site: { select: { name: true, siteCode: true } },
      },
    });

    return sendSuccess(res, newAssignment, "Worker transferred to new site successfully");
  } catch (error) {
    next(error);
  }
});

// GET /api/contractor/workforce (All assigned workers across all contractor projects)
router.get("/contractor/workforce", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contractor = await getOrCreateContractorProfile(req.user!.id);

    const workforce = await prisma.workerAssignment.findMany({
      where: { site: { project: { contractorId: contractor.id } } },
      orderBy: { createdAt: "desc" },
      include: {
        worker: { select: { id: true, name: true, phone: true, avatar: true } },
        site: {
          select: {
            id: true,
            name: true,
            siteCode: true,
            project: { select: { id: true, name: true, projectCode: true } },
          },
        },
        team: true,
      },
    });

    return sendSuccess(res, workforce, "Contractor workforce retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 7. SUPERVISOR MANAGEMENT
// ========================================================

// GET /api/contractor/supervisors
router.get("/contractor/supervisors", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contractor = await getOrCreateContractorProfile(req.user!.id);

    const supervisors = await prisma.supervisor.findMany({
      where: { contractorId: contractor.id },
      include: {
        assignments: {
          where: { status: "ACTIVE" },
          include: { site: { select: { id: true, name: true, siteCode: true } } },
        },
      },
    });

    return sendSuccess(res, supervisors, "Supervisors retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// POST /api/contractor/supervisors
router.post("/contractor/supervisors", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contractor = await getOrCreateContractorProfile(req.user!.id);
    const { name, phone, email, specialization } = req.body;

    if (!name || !phone) {
      return sendError(res, "Supervisor name and phone number are required", 400);
    }

    const supervisor = await prisma.supervisor.create({
      data: {
        contractorId: contractor.id,
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim().toLowerCase() : null,
        specialization: specialization ? specialization.trim() : null,
        status: "ACTIVE",
      },
    });

    return sendSuccess(res, supervisor, "Supervisor registered successfully", 201);
  } catch (error) {
    next(error);
  }
});

// POST /api/contractor/sites/:id/supervisors (Assign supervisor to site)
router.post("/contractor/sites/:id/supervisors", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: siteId } = req.params;
    const { supervisorId, assignedRole } = req.body;

    if (!supervisorId) return sendError(res, "Supervisor ID is required", 400);

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: { project: true },
    });
    if (!site) return sendError(res, "Site not found", 404);

    const assignment = await prisma.supervisorAssignment.create({
      data: {
        supervisorId,
        siteId,
        assignedRole: assignedRole || "Site In-Charge",
        status: "ACTIVE",
      },
      include: { supervisor: true, site: true },
    });

    return sendSuccess(res, assignment, "Supervisor assigned to site successfully", 201);
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 8. ATTENDANCE & SHIFT MANAGEMENT
// ========================================================

// POST /api/contractor/sites/:id/attendance (Mark daily attendance)
router.post("/contractor/sites/:id/attendance", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: siteId } = req.params;
    const { date, records, markedBy } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return sendError(res, "Attendance records array is required", 400);
    }

    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) return sendError(res, "Site not found", 404);

    // Normalize date to midnight UTC
    const targetDate = date ? new Date(new Date(date).setUTCHours(0, 0, 0, 0)) : new Date(new Date().setUTCHours(0, 0, 0, 0));

    const results = [];
    for (const r of records) {
      if (!r.workerId || !r.status) continue;

      const record = await prisma.attendanceRecord.upsert({
        where: {
          siteId_workerId_date: {
            siteId,
            workerId: r.workerId,
            date: targetDate,
          },
        },
        update: {
          status: r.status,
          hoursWorked: r.hoursWorked !== undefined ? Number(r.hoursWorked) : 8,
          overtimeHours: r.overtimeHours !== undefined ? Number(r.overtimeHours) : 0,
          markedBy: markedBy || req.user!.name,
          notes: r.notes || null,
        },
        create: {
          siteId,
          workerId: r.workerId,
          date: targetDate,
          status: r.status,
          shift: r.shift || "DAY",
          hoursWorked: r.hoursWorked !== undefined ? Number(r.hoursWorked) : 8,
          overtimeHours: r.overtimeHours !== undefined ? Number(r.overtimeHours) : 0,
          markedBy: markedBy || req.user!.name,
          notes: r.notes || null,
        },
      });
      results.push(record);
    }

    return sendSuccess(
      res,
      { count: results.length, records: results },
      `Marked attendance for ${results.length} workers successfully`
    );
  } catch (error) {
    next(error);
  }
});

// GET /api/contractor/sites/:id/attendance
router.get("/contractor/sites/:id/attendance", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: siteId } = req.params;
    const { date } = req.query;

    const where: any = { siteId };
    if (date) {
      const d = new Date(new Date(date as string).setUTCHours(0, 0, 0, 0));
      where.date = d;
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        worker: { select: { id: true, name: true, phone: true } },
      },
    });

    return sendSuccess(res, records, "Site attendance records retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 9. DAILY WORK PROGRESS REPORTS
// ========================================================

// POST /api/contractor/sites/:id/reports
router.post("/contractor/sites/:id/reports", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: siteId } = req.params;
    const {
      reportDate,
      supervisorName,
      completedWork,
      progressPercentage,
      workforcePresent,
      pendingActivities,
      issuesOrDelays,
      photos,
    } = req.body;

    if (!completedWork || progressPercentage === undefined || workforcePresent === undefined) {
      return sendError(res, "Work description, progress percentage, and workforce count are required", 400);
    }

    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) return sendError(res, "Site not found", 404);

    const report = await prisma.dailyWorkReport.create({
      data: {
        siteId,
        reportDate: reportDate ? new Date(reportDate) : new Date(),
        supervisorName: supervisorName || req.user!.name,
        completedWork: completedWork.trim(),
        progressPercentage: Math.max(0, Math.min(100, Number(progressPercentage))),
        workforcePresent: Number(workforcePresent),
        pendingActivities: pendingActivities ? pendingActivities.trim() : null,
        issuesOrDelays: issuesOrDelays ? issuesOrDelays.trim() : null,
        photos: Array.isArray(photos) ? photos : [],
      },
    });

    return sendSuccess(res, report, "Daily work progress report submitted successfully", 201);
  } catch (error) {
    next(error);
  }
});

// GET /api/contractor/sites/:id/reports
router.get("/contractor/sites/:id/reports", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: siteId } = req.params;

    const reports = await prisma.dailyWorkReport.findMany({
      where: { siteId },
      orderBy: { reportDate: "desc" },
    });

    return sendSuccess(res, reports, "Daily work reports retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 10. B2B GST INVOICING & PDF GENERATION
// ========================================================

// Helper: Calculate GST tax amounts dynamically
export function calculateGstTaxes(
  taxableAmount: number,
  supplierState: string,
  recipientState: string,
  gstRate: number = 18 // Configurable GST rate (e.g. 5, 12, 18, 28)
) {
  const isIntraState = supplierState.trim().toLowerCase() === recipientState.trim().toLowerCase();

  let taxType = "INTRA_STATE";
  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (isIntraState) {
    taxType = "INTRA_STATE";
    cgstRate = gstRate / 2;
    sgstRate = gstRate / 2;
    cgstAmount = Math.round(((taxableAmount * cgstRate) / 100) * 100) / 100;
    sgstAmount = Math.round(((taxableAmount * sgstRate) / 100) * 100) / 100;
  } else {
    taxType = "INTER_STATE";
    igstRate = gstRate;
    igstAmount = Math.round(((taxableAmount * igstRate) / 100) * 100) / 100;
  }

  const totalTaxAmount = cgstAmount + sgstAmount + igstAmount;
  const grandTotal = Math.round((taxableAmount + totalTaxAmount) * 100) / 100;

  return {
    taxType,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    totalTaxAmount,
    grandTotal,
  };
}

// POST /api/contractor/invoices (Create B2B GST Invoice)
router.post("/contractor/invoices", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contractor = await getOrCreateContractorProfile(req.user!.id);
    const {
      projectId,
      recipientName,
      recipientGstin,
      recipientAddress,
      recipientState,
      placeOfSupply,
      sacCode = "995411",
      taxableAmount,
      gstRate = 18,
      items,
      dueDate,
      notes,
    } = req.body;

    if (!recipientName || !recipientAddress || !recipientState || taxableAmount === undefined) {
      return sendError(res, "Recipient name, address, state, and taxable amount are required", 400);
    }

    const supplierState = contractor.state || "Delhi";
    const taxes = calculateGstTaxes(
      Number(taxableAmount),
      supplierState,
      recipientState,
      Number(gstRate) || 18
    );

    const year = new Date().getFullYear();
    const count = await prisma.gstInvoice.count();
    const invoiceNumber = `MD-GST-${year}-${String(count + 1).padStart(4, "0")}-${Math.floor(100 + Math.random() * 900)}`;

    const invoice = await prisma.gstInvoice.create({
      data: {
        contractorId: contractor.id,
        projectId: projectId || null,
        invoiceNumber,
        placeOfSupply: placeOfSupply || recipientState,
        supplierName: contractor.companyName,
        supplierGstin: contractor.gstNumber,
        supplierAddress: contractor.businessAddress || `${contractor.city}, ${contractor.state}`,
        supplierState,
        recipientName: recipientName.trim(),
        recipientGstin: recipientGstin ? recipientGstin.trim().toUpperCase() : null,
        recipientAddress: recipientAddress.trim(),
        recipientState: recipientState.trim(),
        sacCode,
        taxableAmount: Number(taxableAmount),
        taxType: taxes.taxType,
        cgstRate: taxes.cgstRate,
        cgstAmount: taxes.cgstAmount,
        sgstRate: taxes.sgstRate,
        sgstAmount: taxes.sgstAmount,
        igstRate: taxes.igstRate,
        igstAmount: taxes.igstAmount,
        totalTaxAmount: taxes.totalTaxAmount,
        grandTotal: taxes.grandTotal,
        paymentStatus: "UNPAID",
        dueDate: dueDate ? new Date(dueDate) : null,
        items: Array.isArray(items) ? items : [{ description: "Commercial Site Construction & Workforce Services", quantity: 1, unitRate: taxableAmount, amount: taxableAmount }],
        notes: notes ? notes.trim() : null,
      },
    });

    return sendSuccess(res, invoice, "B2B GST Tax Invoice generated successfully", 201);
  } catch (error) {
    next(error);
  }
});

// GET /api/contractor/invoices
router.get("/contractor/invoices", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contractor = await getOrCreateContractorProfile(req.user!.id);
    const { paymentStatus } = req.query;

    const where: any = { contractorId: contractor.id };
    if (paymentStatus && paymentStatus !== "ALL") where.paymentStatus = paymentStatus;

    const invoices = await prisma.gstInvoice.findMany({
      where,
      orderBy: { invoiceDate: "desc" },
      include: {
        project: { select: { id: true, name: true, projectCode: true } },
      },
    });

    return sendSuccess(res, invoices, "GST Invoices retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// GET /api/contractor/invoices/:id
router.get("/contractor/invoices/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contractor = await getOrCreateContractorProfile(req.user!.id);
    const { id } = req.params;

    const invoice = await prisma.gstInvoice.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, projectCode: true, address: true } },
      },
    });

    if (!invoice) return sendError(res, "Invoice not found", 404);
    if (invoice.contractorId !== contractor.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Unauthorized", 403);
    }

    return sendSuccess(res, invoice, "GST Invoice retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// PATCH /api/contractor/invoices/:id/payment-status
router.patch("/contractor/invoices/:id/payment-status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contractor = await getOrCreateContractorProfile(req.user!.id);
    const { id } = req.params;
    const { paymentStatus, paidAmount } = req.body;

    const invoice = await prisma.gstInvoice.findUnique({ where: { id } });
    if (!invoice) return sendError(res, "Invoice not found", 404);
    if (invoice.contractorId !== contractor.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Unauthorized", 403);
    }

    const updated = await prisma.gstInvoice.update({
      where: { id },
      data: {
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(paidAmount !== undefined ? { paidAmount: Number(paidAmount) } : {}),
      },
    });

    return sendSuccess(res, updated, `Payment status updated to ${paymentStatus}`);
  } catch (error) {
    next(error);
  }
});

// GET /api/contractor/invoices/:id/pdf (Download binary PDF GST invoice)
router.get("/contractor/invoices/:id/pdf", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contractor = await getOrCreateContractorProfile(req.user!.id);
    const { id } = req.params;

    const invoice = await prisma.gstInvoice.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!invoice) return sendError(res, "Invoice not found", 404);
    if (invoice.contractorId !== contractor.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Unauthorized", 403);
    }

    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${invoice.invoiceNumber}.pdf"`
    );

    doc.pipe(res);

    // Header Branding
    doc.fillColor("#1A1A1A").fontSize(20).font("Helvetica-Bold").text("MAJDUR B2B TAX INVOICE", 40, 40);
    doc.fontSize(9).font("Helvetica").fillColor("#666666").text("India's Premier Workforce & Construction Contracting Platform", 40, 64);
    doc.text("Developer: Harsh Singh | Platform: MajDur Enterprise", 40, 76);

    // Invoice Meta Banner
    doc.rect(40, 95, 515, 28).fill("#1E293B");
    doc.fillColor("#FFFFFF").fontSize(10).font("Helvetica-Bold");
    doc.text(`INVOICE NO: ${invoice.invoiceNumber}`, 50, 104);
    doc.text(`DATE: ${invoice.invoiceDate.toISOString().split("T")[0]}`, 380, 104);

    // Two Column Supplier & Recipient Box
    const topY = 135;
    doc.rect(40, topY, 250, 105).fill("#F9FAFB").stroke("#E5E7EB");
    doc.rect(305, topY, 250, 105).fill("#F9FAFB").stroke("#E5E7EB");

    doc.fillColor("#111827").fontSize(9).font("Helvetica-Bold").text("SUPPLIER (CONTRACTOR):", 50, topY + 10);
    doc.font("Helvetica").fontSize(9).fillColor("#374151");
    doc.text(invoice.supplierName, 50, topY + 25);
    doc.text(invoice.supplierAddress, 50, topY + 38, { width: 230 });
    doc.text(`GSTIN: ${invoice.supplierGstin || "Not Provided"}`, 50, topY + 68);
    doc.text(`State: ${invoice.supplierState}`, 50, topY + 80);

    doc.fillColor("#111827").fontSize(9).font("Helvetica-Bold").text("RECIPIENT (CLIENT):", 315, topY + 10);
    doc.font("Helvetica").fontSize(9).fillColor("#374151");
    doc.text(invoice.recipientName, 315, topY + 25);
    doc.text(invoice.recipientAddress, 315, topY + 38, { width: 230 });
    doc.text(`GSTIN: ${invoice.recipientGstin || "Unregistered"}`, 315, topY + 68);
    doc.text(`Place of Supply: ${invoice.placeOfSupply}`, 315, topY + 80);

    // Items Table Header
    const tableTop = 260;
    doc.rect(40, tableTop, 515, 20).fill("#1E293B");
    doc.fillColor("#FFFFFF").fontSize(8).font("Helvetica-Bold");
    doc.text("SN", 45, tableTop + 5);
    doc.text("Description of Services", 75, tableTop + 5);
    doc.text("SAC Code", 300, tableTop + 5);
    doc.text("Qty", 370, tableTop + 5);
    doc.text("Rate (₹)", 420, tableTop + 5);
    doc.text("Amount (₹)", 480, tableTop + 5);

    // Items Rows
    let itemY = tableTop + 22;
    doc.font("Helvetica").fontSize(8).fillColor("#1F2937");

    const items = (invoice.items as any[]) || [];
    items.forEach((item, idx) => {
      doc.rect(40, itemY, 515, 20).fill(idx % 2 === 0 ? "#FFFFFF" : "#F9FAFB");
      doc.fillColor("#374151");
      doc.text(String(idx + 1), 45, itemY + 5);
      doc.text(String(item.description || "Contracting Work").substring(0, 38), 75, itemY + 5);
      doc.text(String(item.sacCode || invoice.sacCode), 300, itemY + 5);
      doc.text(String(item.quantity || 1), 370, itemY + 5);
      doc.text(String(item.unitRate || invoice.taxableAmount), 420, itemY + 5);
      doc.text(String(item.amount || invoice.taxableAmount), 480, itemY + 5);
      itemY += 20;
    });

    // GST Breakdown Box
    const taxBoxTop = itemY + 15;
    doc.rect(320, taxBoxTop, 235, 115).fill("#FEF3C7").stroke("#F59E0B");
    doc.fillColor("#92400E").fontSize(9).font("Helvetica");

    doc.text("Taxable Value:", 330, taxBoxTop + 10);
    doc.text(`₹ ${invoice.taxableAmount.toLocaleString("en-IN")}`, 450, taxBoxTop + 10, { align: "right", width: 95 });

    if (invoice.taxType === "INTRA_STATE") {
      doc.text(`CGST (${invoice.cgstRate}%):`, 330, taxBoxTop + 26);
      doc.text(`₹ ${invoice.cgstAmount.toLocaleString("en-IN")}`, 450, taxBoxTop + 26, { align: "right", width: 95 });
      doc.text(`SGST (${invoice.sgstRate}%):`, 330, taxBoxTop + 42);
      doc.text(`₹ ${invoice.sgstAmount.toLocaleString("en-IN")}`, 450, taxBoxTop + 42, { align: "right", width: 95 });
    } else {
      doc.text(`IGST (${invoice.igstRate}%):`, 330, taxBoxTop + 34);
      doc.text(`₹ ${invoice.igstAmount.toLocaleString("en-IN")}`, 450, taxBoxTop + 34, { align: "right", width: 95 });
    }

    doc.text("Total Tax Amount:", 330, taxBoxTop + 60);
    doc.text(`₹ ${invoice.totalTaxAmount.toLocaleString("en-IN")}`, 450, taxBoxTop + 60, { align: "right", width: 95 });

    doc.rect(325, taxBoxTop + 78, 225, 1).fill("#D97706");
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#78350F");
    doc.text("Grand Total:", 330, taxBoxTop + 88);
    doc.text(`₹ ${invoice.grandTotal.toLocaleString("en-IN")}`, 450, taxBoxTop + 88, { align: "right", width: 95 });

    // Payment Status Stamp
    doc.rect(40, taxBoxTop, 260, 45).fill("#F3F4F6");
    doc.fillColor("#374151").fontSize(9).font("Helvetica-Bold");
    doc.text("PAYMENT STATUS:", 50, taxBoxTop + 10);
    doc.fillColor(invoice.paymentStatus === "PAID" ? "#059669" : "#DC2626");
    doc.fontSize(12).text(invoice.paymentStatus, 50, taxBoxTop + 24);

    // Footer
    const footerY = 740;
    doc.rect(40, footerY, 515, 1).fill("#E5E7EB");
    doc.fillColor("#6B7280").fontSize(8).font("Helvetica");
    doc.text("This is an electronically generated B2B GST tax invoice issued via MajDur Contractor Portal.", 40, footerY + 8);
    doc.text("Developer: Harsh Singh | Subject to local tax compliance jurisdiction.", 40, footerY + 18);

    doc.end();
  } catch (error) {
    next(error);
  }
});

export default router;
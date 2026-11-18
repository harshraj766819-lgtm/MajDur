import { Router, Request, Response, NextFunction } from "express";
import PDFDocument from "pdfkit";
import { prisma } from "../config/prisma";
import { authenticateUser, requireRole } from "../middleware/auth";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

// Protect all worker routes with authentication and WORKER or ADMIN role
router.use("/worker", authenticateUser, requireRole("WORKER", "ADMIN"));

// Helper: Get or initialize worker profile
async function getOrCreateWorkerProfile(userId: string) {
  let profile = await prisma.workerProfile.findUnique({
    where: { userId },
    include: {
      categoryRef: true,
      workerSkills: {
        include: { skill: true },
      },
      serviceAreas: true,
    },
  });

  if (!profile) {
    profile = await prisma.workerProfile.create({
      data: {
        userId,
        category: "Construction Labour",
        locationCity: "Delhi NCR",
        locationState: "Delhi",
        locationPincode: "110001",
        dailyRate: 600,
        hourlyRate: 80,
        experienceYears: 1,
        isAvailable: true,
        isVerified: false,
      },
      include: {
        categoryRef: true,
        workerSkills: {
          include: { skill: true },
        },
        serviceAreas: true,
      },
    });
  }

  return profile;
}

// ========================================================
// 1. GET /api/worker/dashboard - Summary stats and feeds
// ========================================================
router.get("/worker/dashboard", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerUserId = req.user!.id;
    const workerProfile = await getOrCreateWorkerProfile(workerUserId);

    const user = await prisma.user.findUnique({
      where: { id: workerUserId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        avatar: true,
        role: true,
        isPhoneVerified: true,
        isEmailVerified: true,
      },
    });

    // Counts
    const [
      activeWorkCount,
      pendingRequestsCount,
      completedWorkCount,
      totalApplicationsCount,
      pendingApplicationsCount,
      acceptedApplicationsCount,
      completedBookingsList,
      pendingBookingsList,
      recentBookings,
      recentApplications,
      recentNotifications,
      matchingJobs,
    ] = await Promise.all([
      prisma.booking.count({
        where: {
          workerId: workerUserId,
          status: { in: ["ACCEPTED", "CONFIRMED", "IN_PROGRESS"] },
        },
      }),
      prisma.booking.count({
        where: {
          workerId: workerUserId,
          status: "REQUESTED",
        },
      }),
      prisma.booking.count({
        where: {
          workerId: workerUserId,
          status: "COMPLETED",
        },
      }),
      prisma.jobApplication.count({
        where: { workerId: workerUserId },
      }),
      prisma.jobApplication.count({
        where: { workerId: workerUserId, status: "PENDING" },
      }),
      prisma.jobApplication.count({
        where: { workerId: workerUserId, status: "ACCEPTED" },
      }),
      // For total confirmed earnings (sum of completed bookings)
      prisma.booking.findMany({
        where: { workerId: workerUserId, status: "COMPLETED" },
        select: { totalAmount: true },
      }),
      // For pending earnings (sum of accepted / in-progress bookings)
      prisma.booking.findMany({
        where: {
          workerId: workerUserId,
          status: { in: ["ACCEPTED", "CONFIRMED", "IN_PROGRESS"] },
        },
        select: { totalAmount: true },
      }),
      // Recent bookings
      prisma.booking.findMany({
        where: { workerId: workerUserId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: { id: true, name: true, phone: true, avatar: true },
          },
        },
      }),
      // Recent applications
      prisma.jobApplication.findMany({
        where: { workerId: workerUserId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              categoryName: true,
              city: true,
              budget: true,
              budgetType: true,
              status: true,
            },
          },
        },
      }),
      // Recent notifications
      prisma.notification.findMany({
        where: { userId: workerUserId },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      // Matching open jobs (by category or city)
      prisma.job.findMany({
        where: {
          status: "OPEN",
          OR: [
            { categoryName: workerProfile.category },
            { city: workerProfile.locationCity },
          ],
        },
        take: 4,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalEarnings = completedBookingsList.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const pendingEarnings = pendingBookingsList.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    return sendSuccess(res, {
      user,
      profile: workerProfile,
      stats: {
        activeWorkCount,
        pendingRequestsCount,
        completedWorkCount,
        totalEarnings,
        pendingEarnings,
        totalApplicationsCount,
        pendingApplicationsCount,
        acceptedApplicationsCount,
        rating: workerProfile.rating,
        totalReviews: workerProfile.totalReviews,
        isAvailable: workerProfile.isAvailable,
        isVerified: workerProfile.isVerified,
      },
      recentBookings,
      recentApplications,
      recentNotifications,
      matchingJobs,
    }, "Worker dashboard data retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 2. GET /api/worker/profile - Get profile & related data
// ========================================================
router.get("/worker/profile", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerUserId = req.user!.id;
    const workerProfile = await getOrCreateWorkerProfile(workerUserId);

    const user = await prisma.user.findUnique({
      where: { id: workerUserId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        avatar: true,
        role: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        createdAt: true,
        verificationRequests: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return sendSuccess(res, {
      user,
      profile: workerProfile,
    }, "Worker profile retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 3. PUT /api/worker/profile - Update personal & professional profile
// ========================================================
router.put("/worker/profile", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerUserId = req.user!.id;
    const {
      name,
      email,
      avatar,
      bio,
      experienceYears,
      category,
      categoryId,
      locationCity,
      locationState,
      locationPincode,
      serviceRadiusKm,
      dailyRate,
      hourlyRate,
      isAvailable,
    } = req.body;

    // 1. Update User personal fields
    const userUpdateData: any = {};
    if (name && typeof name === "string") userUpdateData.name = name.trim();
    if (email && typeof email === "string") userUpdateData.email = email.trim().toLowerCase();
    if (avatar && typeof avatar === "string") userUpdateData.avatar = avatar.trim();

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: workerUserId },
        data: userUpdateData,
      });
    }

    // 2. Update WorkerProfile fields
    const profileUpdateData: any = {};
    if (bio !== undefined) profileUpdateData.bio = typeof bio === "string" ? bio.trim() : "";
    if (experienceYears !== undefined && !isNaN(Number(experienceYears))) {
      profileUpdateData.experienceYears = Math.max(0, Math.min(60, Number(experienceYears)));
    }
    if (category && typeof category === "string") profileUpdateData.category = category.trim();
    if (categoryId && typeof categoryId === "string") profileUpdateData.categoryId = categoryId;
    if (locationCity && typeof locationCity === "string") profileUpdateData.locationCity = locationCity.trim();
    if (locationState && typeof locationState === "string") profileUpdateData.locationState = locationState.trim();
    if (locationPincode && typeof locationPincode === "string") profileUpdateData.locationPincode = locationPincode.trim();
    if (serviceRadiusKm !== undefined && !isNaN(Number(serviceRadiusKm))) {
      profileUpdateData.serviceRadiusKm = Math.max(1, Math.min(200, Number(serviceRadiusKm)));
    }
    if (dailyRate !== undefined && !isNaN(Number(dailyRate))) {
      profileUpdateData.dailyRate = Math.max(300, Math.min(30000, Number(dailyRate)));
    }
    if (hourlyRate !== undefined && !isNaN(Number(hourlyRate))) {
      profileUpdateData.hourlyRate = Math.max(40, Math.min(5000, Number(hourlyRate)));
    }
    if (isAvailable !== undefined) {
      profileUpdateData.isAvailable = Boolean(isAvailable);
    }

    const updatedProfile = await prisma.workerProfile.upsert({
      where: { userId: workerUserId },
      update: profileUpdateData,
      create: {
        userId: workerUserId,
        category: category || "Construction Labour",
        locationCity: locationCity || "Delhi NCR",
        locationState: locationState || "Delhi",
        locationPincode: locationPincode || "110001",
        ...profileUpdateData,
      },
      include: {
        categoryRef: true,
        workerSkills: { include: { skill: true } },
        serviceAreas: true,
      },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: workerUserId },
      select: { id: true, name: true, phone: true, email: true, avatar: true },
    });

    return sendSuccess(res, { user: updatedUser, profile: updatedProfile }, "Worker profile updated successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 4. GET /api/worker/onboarding - Get onboarding progress
// ========================================================
router.get("/worker/onboarding", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerUserId = req.user!.id;
    const workerProfile = await getOrCreateWorkerProfile(workerUserId);

    const user = await prisma.user.findUnique({
      where: { id: workerUserId },
      include: {
        verificationRequests: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // Compute progress
    const step1Complete = Boolean(user?.name && workerProfile.locationCity && workerProfile.locationPincode);
    const step2Complete = Boolean(workerProfile.category && workerProfile.experienceYears >= 0 && (workerProfile.bio || workerProfile.workerSkills.length > 0));
    const step3Complete = Boolean(workerProfile.dailyRate && workerProfile.dailyRate >= 300);
    const step4Complete = Boolean(workerProfile.isVerified || (user?.verificationRequests && user.verificationRequests.length > 0));

    let currentStep = 1;
    if (step1Complete) currentStep = 2;
    if (step1Complete && step2Complete) currentStep = 3;
    if (step1Complete && step2Complete && step3Complete) currentStep = 4;
    if (step1Complete && step2Complete && step3Complete && step4Complete) currentStep = 5;

    return sendSuccess(res, {
      currentStep,
      isCompleted: currentStep === 5,
      steps: {
        step1: { completed: step1Complete, name: "Personal Information" },
        step2: { completed: step2Complete, name: "Professional Details & Skills" },
        step3: { completed: step3Complete, name: "Service Preferences & Rates" },
        step4: { completed: step4Complete, name: "Identity Verification" },
      },
      user,
      profile: workerProfile,
    }, "Onboarding status retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 5. POST /api/worker/onboarding - Save onboarding step data
// ========================================================
router.post("/worker/onboarding", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerUserId = req.user!.id;
    const { step, data } = req.body;

    if (!step || !data) {
      return sendError(res, "Step number and data are required", 400);
    }

    const workerProfile = await getOrCreateWorkerProfile(workerUserId);

    if (step === 1) {
      // Step 1: Personal Info
      const { name, email, avatar, city, state, pincode, address } = data;
      if (name) {
        await prisma.user.update({
          where: { id: workerUserId },
          data: {
            name: name.trim(),
            ...(email ? { email: email.trim().toLowerCase() } : {}),
            ...(avatar ? { avatar: avatar.trim() } : {}),
          },
        });
      }

      await prisma.workerProfile.update({
        where: { id: workerProfile.id },
        data: {
          locationCity: city ? city.trim() : workerProfile.locationCity,
          locationState: state ? state.trim() : workerProfile.locationState,
          locationPincode: pincode ? pincode.trim() : workerProfile.locationPincode,
        },
      });

      if (address) {
        await prisma.address.create({
          data: {
            userId: workerUserId,
            title: "Primary Base",
            line1: address,
            city: city || workerProfile.locationCity,
            state: state || workerProfile.locationState,
            pincode: pincode || workerProfile.locationPincode,
            isDefault: true,
          },
        });
      }
    } else if (step === 2) {
      // Step 2: Professional Details & Skills
      const { category, experienceYears, bio, skills } = data;
      let categoryId = workerProfile.categoryId;
      if (category) {
        const cat = await prisma.category.findFirst({
          where: { name: { equals: category.trim(), mode: "insensitive" } },
        });
        if (cat) categoryId = cat.id;
      }

      await prisma.workerProfile.update({
        where: { id: workerProfile.id },
        data: {
          category: category ? category.trim() : workerProfile.category,
          categoryId,
          experienceYears: experienceYears ? Number(experienceYears) : workerProfile.experienceYears,
          bio: bio ? bio.trim() : workerProfile.bio,
        },
      });

      // Add skills if provided
      if (Array.isArray(skills) && skills.length > 0) {
        for (const s of skills) {
          const sName = typeof s === "string" ? s : s.name;
          const exp = typeof s === "object" && s.yearsExperience ? Number(s.yearsExperience) : 1;
          if (sName) {
            let skillRecord = await prisma.skill.findUnique({ where: { name: sName.trim() } });
            if (!skillRecord) {
              skillRecord = await prisma.skill.create({
                data: {
                  name: sName.trim(),
                  categoryId: categoryId || (await prisma.category.findFirst())!.id,
                },
              });
            }

            const existingLink = await prisma.workerSkill.findUnique({
              where: {
                workerProfileId_skillId: {
                  workerProfileId: workerProfile.id,
                  skillId: skillRecord.id,
                },
              },
            });

            if (!existingLink) {
              await prisma.workerSkill.create({
                data: {
                  workerProfileId: workerProfile.id,
                  skillId: skillRecord.id,
                  yearsExperience: exp,
                },
              });
            }
          }
        }
      }
    } else if (step === 3) {
      // Step 3: Service Preferences & Rates
      const { dailyRate, hourlyRate, serviceRadiusKm, serviceAreas } = data;
      await prisma.workerProfile.update({
        where: { id: workerProfile.id },
        data: {
          dailyRate: dailyRate ? Math.max(300, Number(dailyRate)) : workerProfile.dailyRate,
          hourlyRate: hourlyRate ? Math.max(40, Number(hourlyRate)) : workerProfile.hourlyRate,
          serviceRadiusKm: serviceRadiusKm ? Number(serviceRadiusKm) : workerProfile.serviceRadiusKm,
        },
      });

      if (Array.isArray(serviceAreas) && serviceAreas.length > 0) {
        for (const area of serviceAreas) {
          if (area.city) {
            await prisma.serviceArea.create({
              data: {
                workerProfileId: workerProfile.id,
                city: area.city.trim(),
                areaName: area.areaName ? area.areaName.trim() : null,
                pincode: area.pincode ? area.pincode.trim() : null,
                radiusKm: area.radiusKm ? Number(area.radiusKm) : 25,
              },
            });
          }
        }
      }
    } else if (step === 4) {
      // Step 4: Verification
      const { idType, idNumber, documentUrl } = data;
      if (!idType || !documentUrl) {
        return sendError(res, "ID document type and document URL are required", 400);
      }

      await prisma.verificationRequest.create({
        data: {
          userId: workerUserId,
          idType: idType.trim(),
          idNumber: idNumber ? idNumber.trim() : null,
          documentUrl: documentUrl.trim(),
          status: "PENDING",
        },
      });

      await prisma.workerProfile.update({
        where: { id: workerProfile.id },
        data: {
          idProofType: idType.trim(),
          idProofUrl: documentUrl.trim(),
        },
      });
    }

    const updatedProfile = await getOrCreateWorkerProfile(workerUserId);
    return sendSuccess(res, updatedProfile, `Onboarding step ${step} saved successfully`);
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 6. SKILLS CRUD (/api/worker/skills)
// ========================================================

// GET /api/worker/skills - List worker skills + available category skills
router.get("/worker/skills", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerUserId = req.user!.id;
    const workerProfile = await getOrCreateWorkerProfile(workerUserId);

    const mySkills = await prisma.workerSkill.findMany({
      where: { workerProfileId: workerProfile.id },
      include: {
        skill: {
          include: { category: true },
        },
      },
    });

    // Available skills in the database
    const availableSkills = await prisma.skill.findMany({
      where: workerProfile.categoryId ? { categoryId: workerProfile.categoryId } : {},
      include: { category: true },
      take: 50,
    });

    const mySkillIds = new Set(mySkills.map((s) => s.skillId));

    const enrichedAvailableSkills = availableSkills.map((s) => ({
      ...s,
      isAdded: mySkillIds.has(s.id),
    }));

    return sendSuccess(res, {
      mySkills,
      availableSkills: enrichedAvailableSkills,
    }, "Worker skills retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// POST /api/worker/skills - Add skill to worker profile
router.post("/worker/skills", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerUserId = req.user!.id;
    const workerProfile = await getOrCreateWorkerProfile(workerUserId);
    const { skillId, skillName, yearsExperience, categoryId } = req.body;

    let targetSkillId = skillId;

    if (!targetSkillId && skillName) {
      // Find or create skill
      let skill = await prisma.skill.findUnique({
        where: { name: skillName.trim() },
      });

      if (!skill) {
        const catId = categoryId || workerProfile.categoryId;
        if (!catId) {
          const defaultCat = await prisma.category.findFirst();
          if (!defaultCat) return sendError(res, "No categories available", 400);
          skill = await prisma.skill.create({
            data: { name: skillName.trim(), categoryId: defaultCat.id },
          });
        } else {
          skill = await prisma.skill.create({
            data: { name: skillName.trim(), categoryId: catId },
          });
        }
      }
      targetSkillId = skill.id;
    }

    if (!targetSkillId) {
      return sendError(res, "Please provide skillId or skillName", 400);
    }

    // Check if already added
    const existing = await prisma.workerSkill.findUnique({
      where: {
        workerProfileId_skillId: {
          workerProfileId: workerProfile.id,
          skillId: targetSkillId,
        },
      },
    });

    if (existing) {
      return sendError(res, "This skill is already in your profile", 409);
    }

    const workerSkill = await prisma.workerSkill.create({
      data: {
        workerProfileId: workerProfile.id,
        skillId: targetSkillId,
        yearsExperience: yearsExperience ? Math.max(1, Number(yearsExperience)) : 1,
      },
      include: {
        skill: {
          include: { category: true },
        },
      },
    });

    return sendSuccess(res, workerSkill, "Skill added to worker profile successfully", 201);
  } catch (error) {
    next(error);
  }
});

// PUT /api/worker/skills/:id - Update years of experience for a skill
router.put("/worker/skills/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const workerUserId = req.user!.id;
    const { yearsExperience } = req.body;

    const workerSkill = await prisma.workerSkill.findUnique({
      where: { id },
      include: { workerProfile: true },
    });

    if (!workerSkill) {
      return sendError(res, "Worker skill not found", 404);
    }

    if (workerSkill.workerProfile.userId !== workerUserId && req.user!.role !== "ADMIN") {
      return sendError(res, "Unauthorized to modify this skill", 403);
    }

    const updated = await prisma.workerSkill.update({
      where: { id },
      data: {
        yearsExperience: Math.max(1, Number(yearsExperience) || 1),
      },
      include: { skill: true },
    });

    return sendSuccess(res, updated, "Skill experience updated successfully");
  } catch (error) {
    next(error);
  }
});

// DELETE /api/worker/skills/:id - Remove skill from profile
router.delete("/worker/skills/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const workerUserId = req.user!.id;

    const workerSkill = await prisma.workerSkill.findUnique({
      where: { id },
      include: { workerProfile: true },
    });

    if (!workerSkill) {
      return sendError(res, "Worker skill not found", 404);
    }

    if (workerSkill.workerProfile.userId !== workerUserId && req.user!.role !== "ADMIN") {
      return sendError(res, "Unauthorized to delete this skill", 403);
    }

    await prisma.workerSkill.delete({ where: { id } });

    return sendSuccess(res, { id }, "Skill removed from profile successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 7. RATES MANAGEMENT (/api/worker/rates)
// ========================================================
router.get("/worker/rates", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerUserId = req.user!.id;
    const workerProfile = await getOrCreateWorkerProfile(workerUserId);

    let baseDailyRate = 800;
    if (workerProfile.categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: workerProfile.categoryId } });
      if (cat?.baseDailyRate) baseDailyRate = cat.baseDailyRate;
    }

    return sendSuccess(res, {
      dailyRate: workerProfile.dailyRate || baseDailyRate,
      hourlyRate: workerProfile.hourlyRate || Math.round(baseDailyRate / 8),
      recommendedDailyRate: baseDailyRate,
      category: workerProfile.category,
    }, "Worker rates retrieved successfully");
  } catch (error) {
    next(error);
  }
});

router.put("/worker/rates", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerUserId = req.user!.id;
    const { dailyRate, hourlyRate } = req.body;

    if (dailyRate === undefined && hourlyRate === undefined) {
      return sendError(res, "Please provide dailyRate or hourlyRate to update", 400);
    }

    const updateData: any = {};
    if (dailyRate !== undefined) {
      const rate = Number(dailyRate);
      if (isNaN(rate) || rate < 300 || rate > 30000) {
        return sendError(res, "Daily rate must be between ₹300 and ₹30,000", 400);
      }
      updateData.dailyRate = rate;
    }

    if (hourlyRate !== undefined) {
      const rate = Number(hourlyRate);
      if (isNaN(rate) || rate < 40 || rate > 5000) {
        return sendError(res, "Hourly rate must be between ₹40 and ₹5,000", 400);
      }
      updateData.hourlyRate = rate;
    }

    const workerProfile = await getOrCreateWorkerProfile(workerUserId);
    const updated = await prisma.workerProfile.update({
      where: { id: workerProfile.id },
      data: updateData,
    });

    return sendSuccess(res, {
      dailyRate: updated.dailyRate,
      hourlyRate: updated.hourlyRate,
    }, "Worker rates updated successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 8. SERVICE AREAS (/api/worker/service-areas)
// ========================================================
router.get("/worker/service-areas", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerUserId = req.user!.id;
    const workerProfile = await getOrCreateWorkerProfile(workerUserId);

    const serviceAreas = await prisma.serviceArea.findMany({
      where: { workerProfileId: workerProfile.id },
      orderBy: { city: "asc" },
    });

    return sendSuccess(res, {
      primaryLocation: {
        city: workerProfile.locationCity,
        state: workerProfile.locationState,
        pincode: workerProfile.locationPincode,
        serviceRadiusKm: workerProfile.serviceRadiusKm,
      },
      additionalAreas: serviceAreas,
    }, "Service areas retrieved successfully");
  } catch (error) {
    next(error);
  }
});

router.post("/worker/service-areas", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerUserId = req.user!.id;
    const workerProfile = await getOrCreateWorkerProfile(workerUserId);
    const { city, pincode, areaName, radiusKm } = req.body;

    if (!city || typeof city !== "string" || !city.trim()) {
      return sendError(res, "City is required", 400);
    }

    if (pincode && !/^\d{6}$/.test(pincode.trim())) {
      return sendError(res, "Invalid PIN code. Must be a 6-digit Indian PIN code", 400);
    }

    const serviceArea = await prisma.serviceArea.create({
      data: {
        workerProfileId: workerProfile.id,
        city: city.trim(),
        pincode: pincode ? pincode.trim() : null,
        areaName: areaName ? areaName.trim() : null,
        radiusKm: radiusKm ? Math.max(5, Math.min(150, Number(radiusKm))) : 25,
      },
    });

    return sendSuccess(res, serviceArea, "Service area added successfully", 201);
  } catch (error) {
    next(error);
  }
});

router.delete("/worker/service-areas/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const workerUserId = req.user!.id;

    const serviceArea = await prisma.serviceArea.findUnique({
      where: { id },
      include: { workerProfile: true },
    });

    if (!serviceArea) {
      return sendError(res, "Service area record not found", 404);
    }

    if (serviceArea.workerProfile.userId !== workerUserId && req.user!.role !== "ADMIN") {
      return sendError(res, "Unauthorized to delete this service area", 403);
    }

    await prisma.serviceArea.delete({ where: { id } });

    return sendSuccess(res, { id }, "Service area deleted successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 9. AVAILABILITY MANAGEMENT (/api/worker/availability)
// ========================================================
router.get("/worker/availability", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerUserId = req.user!.id;
    const workerProfile = await getOrCreateWorkerProfile(workerUserId);

    // Fetch upcoming bookings schedule
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        workerId: workerUserId,
        status: { in: ["ACCEPTED", "CONFIRMED", "IN_PROGRESS"] },
      },
      select: {
        id: true,
        bookingNumber: true,
        startDate: true,
        endDate: true,
        status: true,
        serviceCategory: true,
        customer: { select: { name: true, phone: true } },
      },
      orderBy: { startDate: "asc" },
    });

    return sendSuccess(res, {
      isAvailable: workerProfile.isAvailable,
      upcomingBookings,
    }, "Worker availability retrieved successfully");
  } catch (error) {
    next(error);
  }
});

router.put("/worker/availability", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerUserId = req.user!.id;
    const { isAvailable } = req.body;

    if (isAvailable === undefined) {
      return sendError(res, "isAvailable boolean is required", 400);
    }

    const workerProfile = await getOrCreateWorkerProfile(workerUserId);
    const updated = await prisma.workerProfile.update({
      where: { id: workerProfile.id },
      data: { isAvailable: Boolean(isAvailable) },
    });

    return sendSuccess(res, {
      isAvailable: updated.isAvailable,
    }, `Worker status set to ${updated.isAvailable ? "Available for Work" : "Temporarily Unavailable"}`);
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 10. JOB DISCOVERY FOR WORKERS (/api/worker/jobs)
// ========================================================
router.get("/worker/jobs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerUserId = req.user!.id;
    const {
      category,
      trade,
      city,
      pincode,
      jobType,
      budgetType,
      minBudget,
      maxBudget,
      search,
      status = "OPEN",
    } = req.query;

    const where: any = {
      status: (status as string).toUpperCase(),
    };

    const targetCategory = category || trade;
    if (targetCategory && typeof targetCategory === "string") {
      where.categoryName = {
        equals: targetCategory.trim(),
        mode: "insensitive",
      };
    }

    if (city && typeof city === "string") {
      where.city = {
        contains: city.trim(),
        mode: "insensitive",
      };
    }

    if (pincode && typeof pincode === "string") {
      where.pincode = pincode.trim();
    }

    if (jobType && typeof jobType === "string") {
      where.jobType = jobType.toUpperCase();
    }

    if (budgetType && typeof budgetType === "string") {
      where.budgetType = budgetType.toUpperCase();
    }

    if (minBudget || maxBudget) {
      where.budget = {};
      if (minBudget) where.budget.gte = Number(minBudget);
      if (maxBudget) where.budget.lte = Number(maxBudget);
    }

    if (search && typeof search === "string") {
      where.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
        { area: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        poster: {
          select: { id: true, name: true, role: true },
        },
        skills: {
          include: { skill: true },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    // Check which jobs this worker has already applied for
    const workerApplications = await prisma.jobApplication.findMany({
      where: {
        workerId: workerUserId,
        jobId: { in: jobs.map((j) => j.id) },
      },
      select: { id: true, jobId: true, status: true, proposedRate: true },
    });

    const applicationMap = new Map(workerApplications.map((a) => [a.jobId, a]));

    const enrichedJobs = jobs.map((job) => {
      const myApp = applicationMap.get(job.id);
      return {
        ...job,
        hasApplied: Boolean(myApp),
        myApplication: myApp || null,
      };
    });

    return sendSuccess(res, enrichedJobs, "Marketplace jobs retrieved successfully");
  } catch (error) {
    next(error);
  }
});

router.get("/worker/jobs/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const workerUserId = req.user!.id;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        poster: {
          select: { id: true, name: true, role: true, phone: true },
        },
        skills: {
          include: { skill: true },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) {
      return sendError(res, "Job post not found", 404);
    }

    const myApplication = await prisma.jobApplication.findUnique({
      where: {
        jobId_workerId: {
          jobId: id,
          workerId: workerUserId,
        },
      },
    });

    return sendSuccess(res, {
      ...job,
      hasApplied: Boolean(myApplication),
      myApplication,
    }, "Job details retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 11. JOB APPLICATIONS (/api/worker/applications)
// ========================================================

// POST /api/worker/applications - Apply for an open job
router.post("/worker/applications", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerUserId = req.user!.id;
    const { jobId, proposedRate, coverNote } = req.body;

    if (!jobId) {
      return sendError(res, "Job ID is required", 400);
    }

    if (!proposedRate || isNaN(Number(proposedRate)) || Number(proposedRate) <= 0) {
      return sendError(res, "A valid proposed rate greater than zero is required", 400);
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return sendError(res, "Job not found", 404);
    }

    if (job.status !== "OPEN") {
      return sendError(res, "This job is no longer accepting applications", 400);
    }

    if (job.posterId === workerUserId) {
      return sendError(res, "You cannot apply to your own job", 400);
    }

    // Check duplicate application
    const existing = await prisma.jobApplication.findUnique({
      where: {
        jobId_workerId: {
          jobId,
          workerId: workerUserId,
        },
      },
    });

    if (existing) {
      return sendError(res, "You have already applied for this job", 409);
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        workerId: workerUserId,
        proposedRate: Number(proposedRate),
        coverNote: coverNote ? coverNote.trim() : null,
        status: "PENDING",
      },
      include: {
        job: true,
      },
    });

    // Notify job poster
    await prisma.notification.create({
      data: {
        userId: job.posterId,
        title: "New Job Application Received",
        message: `A skilled worker applied for your job "${job.title}" with a proposed rate of ₹${proposedRate}.`,
        type: "JOB_APPLICATION",
        link: `/dashboard/contractor`,
      },
    });

    return sendSuccess(res, application, "Job application submitted successfully", 201);
  } catch (error) {
    next(error);
  }
});

// GET /api/worker/applications - List worker's job applications
router.get("/worker/applications", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerUserId = req.user!.id;
    const { status } = req.query;

    const where: any = { workerId: workerUserId };
    if (status && typeof status === "string") {
      where.status = status.toUpperCase();
    }

    const applications = await prisma.jobApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          include: {
            poster: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    return sendSuccess(res, applications, "Worker job applications retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// GET /api/worker/applications/:id - Single application details (IDOR Protected)
router.get("/worker/applications/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const workerUserId = req.user!.id;

    const application = await prisma.jobApplication.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            poster: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    if (!application) {
      return sendError(res, "Job application not found", 404);
    }

    if (application.workerId !== workerUserId && application.job.posterId !== workerUserId && req.user!.role !== "ADMIN") {
      return sendError(res, "Unauthorized to view this job application", 403);
    }

    return sendSuccess(res, application, "Job application details retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// PATCH /api/worker/applications/:id/withdraw - Withdraw pending application
router.patch("/worker/applications/:id/withdraw", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const workerUserId = req.user!.id;

    const application = await prisma.jobApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return sendError(res, "Job application not found", 404);
    }

    if (application.workerId !== workerUserId && req.user!.role !== "ADMIN") {
      return sendError(res, "Unauthorized to withdraw this application", 403);
    }

    if (!["PENDING", "SHORTLISTED"].includes(application.status)) {
      return sendError(res, `Cannot withdraw an application with status ${application.status}`, 400);
    }

    const updated = await prisma.jobApplication.update({
      where: { id },
      data: { status: "WITHDRAWN" },
    });

    return sendSuccess(res, updated, "Job application withdrawn successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 12. WORK & BOOKINGS MANAGEMENT (/api/worker/work)
// ========================================================

// GET /api/worker/work - List worker's assigned bookings
router.get("/worker/work", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerUserId = req.user!.id;
    const { status } = req.query;

    const where: any = { workerId: workerUserId };
    if (status && typeof status === "string") {
      where.status = status.toUpperCase();
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
        reviews: true,
        invoices: true,
        payments: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    });

    return sendSuccess(res, bookings, "Worker assignments retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// PATCH /api/worker/work/:id/status - Update work/booking status
router.patch("/worker/work/:id/status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const workerUserId = req.user!.id;
    const { status, completionNotes, note } = req.body;

    if (!status) {
      return sendError(res, "Status is required", 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!booking) {
      return sendError(res, "Booking assignment not found", 404);
    }

    if (booking.workerId !== workerUserId && req.user!.role !== "ADMIN") {
      return sendError(res, "Unauthorized to update this booking", 403);
    }

    const targetStatus = status.toUpperCase();
    const currentStatus = booking.status;

    // Validate transitions
    const validTransitions: Record<string, string[]> = {
      REQUESTED: ["ACCEPTED", "REJECTED"],
      ACCEPTED: ["IN_PROGRESS", "CANCELLED", "COMPLETED"],
      CONFIRMED: ["IN_PROGRESS", "CANCELLED", "COMPLETED"],
      IN_PROGRESS: ["COMPLETED"],
    };

    if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(targetStatus)) {
      return sendError(
        res,
        `Invalid status transition from ${currentStatus} to ${targetStatus}`,
        400
      );
    }

    const updateData: any = { status: targetStatus };

    if (targetStatus === "COMPLETED") {
      updateData.completedAt = new Date();
      if (completionNotes) updateData.completionNotes = completionNotes.trim();

      // Increment completed jobs on WorkerProfile
      await prisma.workerProfile.updateMany({
        where: { userId: workerUserId },
        data: { completedJobs: { increment: 1 } },
      });

      // Auto-generate invoice if not exists
      const existingInvoice = await prisma.invoice.findFirst({
        where: { bookingId: booking.id },
      });

      if (!existingInvoice) {
        const year = new Date().getFullYear();
        const rand = Math.floor(100000 + Math.random() * 900000);
        const invoiceNumber = `INV-${year}-${rand}`;
        const taxAmount = Math.round(booking.totalAmount * 0.18);
        const grandTotal = booking.totalAmount + taxAmount;

        await prisma.invoice.create({
          data: {
            invoiceNumber,
            bookingId: booking.id,
            amount: booking.totalAmount,
            taxAmount,
            totalAmount: grandTotal,
          },
        });
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
    });

    // Record audit trail
    await prisma.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        status: targetStatus as any,
        note: note || completionNotes || `Worker updated status to ${targetStatus}`,
        changedBy: `WORKER:${workerUserId}`,
      },
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: booking.customerId,
        title: `Booking ${targetStatus.replace("_", " ")}`,
        message: `Your booking #${booking.bookingNumber} has been updated to ${targetStatus} by the service professional.`,
        type: "BOOKING_UPDATE",
        link: `/dashboard/customer/bookings/${booking.id}`,
      },
    });

    return sendSuccess(res, updatedBooking, `Work status updated to ${targetStatus}`);
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 13. EARNINGS LEDGER & PDF STATEMENT (/api/worker/earnings)
// ========================================================

// GET /api/worker/earnings - Real derived earnings ledger
router.get("/worker/earnings", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerUserId = req.user!.id;

    // Completed bookings represent confirmed earnings
    const completedBookings = await prisma.booking.findMany({
      where: {
        workerId: workerUserId,
        status: "COMPLETED",
      },
      orderBy: { completedAt: "desc" },
      include: {
        customer: { select: { name: true, phone: true } },
        invoices: true,
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Active bookings represent pending earnings
    const pendingBookings = await prisma.booking.findMany({
      where: {
        workerId: workerUserId,
        status: { in: ["ACCEPTED", "CONFIRMED", "IN_PROGRESS"] },
      },
      select: { totalAmount: true, paymentStatus: true, paidAmount: true },
    });

    // Verified online payments for this worker
    const verifiedPayments = await prisma.payment.findMany({
      where: {
        workerId: workerUserId,
        status: "SUCCESS",
      },
      select: { amount: true },
    });

    const totalConfirmedEarnings = completedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const pendingEarnings = pendingBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const verifiedOnlinePaymentsTotal = verifiedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const transactions = completedBookings.map((b) => {
      const successPayment = b.payments.find((p) => p.status === "SUCCESS");
      return {
        id: b.id,
        bookingNumber: b.bookingNumber,
        serviceCategory: b.serviceCategory,
        customerName: b.customer?.name || "Customer",
        date: b.completedAt || b.createdAt,
        dailyRate: b.dailyRate,
        totalDays: b.totalDays,
        grossAmount: b.totalAmount,
        platformFee: 0, // Direct peer-to-peer or 0% deduction
        netPayout: b.totalAmount,
        status: successPayment ? "PAID_ONLINE" : "PAID",
        paymentStatus: b.paymentStatus || (successPayment ? "PAID" : "UNPAID"),
        paymentMethod: successPayment?.paymentMethod || "DIRECT",
        razorpayPaymentId: successPayment?.razorpayPaymentId || null,
        invoiceNumber: b.invoices[0]?.invoiceNumber || null,
      };
    });

    return sendSuccess(res, {
      summary: {
        totalConfirmedEarnings,
        pendingEarnings,
        verifiedOnlinePaymentsTotal,
        verifiedOnlinePaymentsCount: verifiedPayments.length,
        completedJobsCount: completedBookings.length,
        currency: "INR",
        currencySymbol: "₹",
      },
      transactions,
    }, "Worker earnings ledger retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// GET /api/worker/earnings/statement - Download binary PDF earnings statement
router.get("/worker/earnings/statement", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerUserId = req.user!.id;

    const [user, completedBookings] = await Promise.all([
      prisma.user.findUnique({
        where: { id: workerUserId },
        include: { workerProfile: true },
      }),
      prisma.booking.findMany({
        where: {
          workerId: workerUserId,
          status: "COMPLETED",
        },
        orderBy: { completedAt: "desc" },
        include: {
          customer: { select: { name: true } },
          invoices: true,
        },
      }),
    ]);

    if (!user) {
      return sendError(res, "Worker not found", 404);
    }

    const totalConfirmed = completedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    // Initialize PDFKit
    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="MajDur-Worker-Statement-${user.name.replace(/\s+/g, "_")}.pdf"`
    );

    doc.pipe(res);

    // Header Branding
    doc.fillColor("#1A1A1A").fontSize(22).font("Helvetica-Bold").text("MAJDUR (मजदूर)", 40, 40);
    doc.fontSize(10).font("Helvetica").fillColor("#666666").text("India's Premier Workforce & Skilled Services Marketplace", 40, 66);
    doc.text("Find Work. Hire Workers. Build Your Future.", 40, 78);
    doc.text("Developer: Harsh Singh | Platform: MajDur India", 40, 90);

    // Statement Banner
    doc.rect(40, 110, 515, 30).fill("#F3F4F6");
    doc.fillColor("#111827").fontSize(12).font("Helvetica-Bold").text("OFFICIAL WORKER EARNINGS STATEMENT", 50, 119);

    // Worker Details
    const topY = 155;
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#374151").text("Worker Details:", 40, topY);
    doc.font("Helvetica").text(`Name: ${user.name}`, 40, topY + 15);
    doc.text(`Phone: ${user.phone}`, 40, topY + 28);
    doc.text(`Trade: ${user.workerProfile?.category || "Professional"}`, 40, topY + 41);
    doc.text(`City: ${user.workerProfile?.locationCity || "India"}`, 40, topY + 54);

    // Summary Box
    doc.rect(340, topY, 215, 70).fill("#FEF3C7");
    doc.fillColor("#92400E").fontSize(11).font("Helvetica-Bold").text("Lifetime Earnings", 355, topY + 12);
    doc.fontSize(18).text(`₹ ${totalConfirmed.toLocaleString("en-IN")}`, 355, topY + 28);
    doc.fontSize(9).font("Helvetica").text(`Total Completed Jobs: ${completedBookings.length}`, 355, topY + 50);

    // Transactions Table Header
    const tableTop = 240;
    doc.rect(40, tableTop, 515, 22).fill("#1E293B");
    doc.fillColor("#FFFFFF").fontSize(9).font("Helvetica-Bold");
    doc.text("Date", 48, tableTop + 6);
    doc.text("Booking ID", 120, tableTop + 6);
    doc.text("Category", 230, tableTop + 6);
    doc.text("Customer", 340, tableTop + 6);
    doc.text("Net Payout (₹)", 460, tableTop + 6);

    // Transactions Rows
    let rowY = tableTop + 24;
    doc.font("Helvetica").fontSize(9).fillColor("#1F2937");

    if (completedBookings.length === 0) {
      doc.text("No completed earnings records found.", 48, rowY + 10);
    } else {
      completedBookings.slice(0, 18).forEach((b, index) => {
        const bg = index % 2 === 0 ? "#FFFFFF" : "#F9FAFB";
        doc.rect(40, rowY, 515, 20).fill(bg);
        doc.fillColor("#374151");

        const dateStr = (b.completedAt || b.createdAt).toISOString().split("T")[0];
        doc.text(dateStr, 48, rowY + 5);
        doc.text(b.bookingNumber, 120, rowY + 5);
        doc.text(b.serviceCategory.substring(0, 18), 230, rowY + 5);
        doc.text((b.customer?.name || "Customer").substring(0, 18), 340, rowY + 5);
        doc.font("Helvetica-Bold").text(`₹ ${b.totalAmount}`, 460, rowY + 5);
        doc.font("Helvetica");

        rowY += 20;
      });
    }

    // Footer
    const footerY = 740;
    doc.rect(40, footerY, 515, 1).fill("#E5E7EB");
    doc.fillColor("#6B7280").fontSize(8).font("Helvetica");
    doc.text("This document is an electronically generated statement verified by MajDur Workforce Systems.", 40, footerY + 8);
    doc.text("Developed by Harsh Singh. All rights reserved.", 40, footerY + 18);

    doc.end();
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 14. VERIFICATION SUBMISSION (/api/worker/verification)
// ========================================================
router.get("/worker/verification", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerUserId = req.user!.id;
    const workerProfile = await getOrCreateWorkerProfile(workerUserId);

    const latestRequest = await prisma.verificationRequest.findFirst({
      where: { userId: workerUserId },
      orderBy: { createdAt: "desc" },
    });

    return sendSuccess(res, {
      isVerified: workerProfile.isVerified,
      idProofType: workerProfile.idProofType,
      idProofUrl: workerProfile.idProofUrl,
      latestRequest,
    }, "Verification status retrieved successfully");
  } catch (error) {
    next(error);
  }
});

router.post("/worker/verification", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerUserId = req.user!.id;
    const { idType, idNumber, documentUrl } = req.body;

    if (!idType || typeof idType !== "string") {
      return sendError(res, "ID document type is required (Aadhaar, Voter ID, PAN, Trade License)", 400);
    }

    if (!documentUrl || typeof documentUrl !== "string") {
      return sendError(res, "Document URL or scanned image path is required", 400);
    }

    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        userId: workerUserId,
        idType: idType.trim(),
        idNumber: idNumber ? idNumber.trim() : null,
        documentUrl: documentUrl.trim(),
        status: "PENDING",
      },
    });

    await prisma.workerProfile.updateMany({
      where: { userId: workerUserId },
      data: {
        idProofType: idType.trim(),
        idProofUrl: documentUrl.trim(),
      },
    });

    return sendSuccess(res, verificationRequest, "Verification documents submitted for admin review successfully", 201);
  } catch (error) {
    next(error);
  }
});

export default router;


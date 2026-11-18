import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { sendSuccess } from "../utils/response";

const router = Router();

// GET /api/stats/platform - Fetch real database counts for homepage statistics
router.get("/stats/platform", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [registeredWorkers, completedJobs, activeContractors, totalCategories] = await Promise.all([
      prisma.workerProfile.count(),
      prisma.job.count({ where: { status: "COMPLETED" } }),
      prisma.contractorProfile.count(),
      prisma.category.count({ where: { isActive: true } }),
    ]);

    const stats = {
      registeredWorkers,
      completedJobs,
      activeContractors,
      totalCategories,
      generatedAt: new Date().toISOString(),
    };

    return sendSuccess(res, stats, "Platform statistics retrieved successfully");
  } catch (error) {
    next(error);
  }
});

export default router;


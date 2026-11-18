import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

// GET /api/categories - List all active categories with optional search
router.get("/categories", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;

    const whereClause: any = { isActive: true };

    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { hindiName: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      orderBy: { displayOrder: "asc" },
      include: {
        _count: {
          select: { workerProfiles: true, jobs: true },
        },
      },
    });

    return sendSuccess(res, categories, "Categories retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// GET /api/categories/:slug - Single category detail
router.get("/categories/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        skills: true,
        _count: {
          select: { workerProfiles: true, jobs: true },
        },
      },
    });

    if (!category) {
      return sendError(res, "Category not found", 404);
    }

    return sendSuccess(res, category, "Category details retrieved successfully");
  } catch (error) {
    next(error);
  }
});

export default router;

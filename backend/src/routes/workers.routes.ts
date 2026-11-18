import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

// GET /api/workers/featured - Fetch verified and available workers for the homepage
router.get("/workers/featured", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workers = await prisma.workerProfile.findMany({
      where: {
        isVerified: true,
        isAvailable: true,
      },
      take: 8,
      orderBy: [
        { rating: "desc" },
        { completedJobs: "desc" },
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
          },
        },
        categoryRef: {
          select: {
            name: true,
            hindiName: true,
            slug: true,
            icon: true,
          },
        },
      },
    });

    return sendSuccess(res, workers, "Featured workers retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// Shared worker search & filter logic for both /api/workers and /api/workers/search
async function handleWorkerSearch(req: Request, res: Response, next: NextFunction) {
  try {
    const { 
      category, 
      trade,
      skill,
      city, 
      area, 
      pincode, 
      search, 
      minExperience, 
      maxExperience,
      minRate,
      maxRate,
      isAvailable,
      isVerified,
      minRating,
      sortBy = "rating",
      sortOrder = "desc",
      page = "1", 
      limit = "10" 
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * pageSize;

    const andConditions: any[] = [];

    // Category / Trade filter (match category name or slug)
    const categoryQuery = (category || trade) as string;
    if (categoryQuery && typeof categoryQuery === "string" && categoryQuery.trim() && categoryQuery !== "ALL") {
      const cat = categoryQuery.trim();
      andConditions.push({
        OR: [
          { category: { contains: cat, mode: "insensitive" } },
          { categoryRef: { slug: cat } },
          { categoryRef: { name: { contains: cat, mode: "insensitive" } } },
        ],
      });
    }

    // Skill filter
    if (skill && typeof skill === "string" && skill.trim()) {
      const s = skill.trim();
      andConditions.push({
        workerSkills: {
          some: {
            skill: {
              name: { contains: s, mode: "insensitive" },
            },
          },
        },
      });
    }

    // City filter (checks home city or operational service areas)
    if (city && typeof city === "string" && city.trim() && city !== "All India") {
      const c = city.trim();
      andConditions.push({
        OR: [
          { locationCity: { contains: c, mode: "insensitive" } },
          { serviceAreas: { some: { city: { contains: c, mode: "insensitive" } } } },
        ],
      });
    }

    // Area filter (checks state or specific service area names)
    if (area && typeof area === "string" && area.trim()) {
      const a = area.trim();
      andConditions.push({
        OR: [
          { locationState: { contains: a, mode: "insensitive" } },
          { serviceAreas: { some: { areaName: { contains: a, mode: "insensitive" } } } },
        ],
      });
    }

    // PIN code filter (checks home PIN or service area PINs)
    if (pincode && typeof pincode === "string" && pincode.trim()) {
      const p = pincode.trim();
      andConditions.push({
        OR: [
          { locationPincode: { contains: p } },
          { serviceAreas: { some: { pincode: { contains: p } } } },
        ],
      });
    }

    // Experience filters
    if (minExperience !== undefined && minExperience !== "") {
      andConditions.push({
        experienceYears: { gte: parseInt(minExperience as string, 10) || 0 },
      });
    }
    if (maxExperience !== undefined && maxExperience !== "") {
      andConditions.push({
        experienceYears: { lte: parseInt(maxExperience as string, 10) || 100 },
      });
    }

    // Daily Rate filters
    if (minRate !== undefined && minRate !== "") {
      andConditions.push({
        dailyRate: { gte: parseFloat(minRate as string) || 0 },
      });
    }
    if (maxRate !== undefined && maxRate !== "") {
      andConditions.push({
        dailyRate: { lte: parseFloat(maxRate as string) || 100000 },
      });
    }

    // Availability filter
    if (isAvailable !== undefined && isAvailable !== "") {
      andConditions.push({
        isAvailable: String(isAvailable) === "true",
      });
    }

    // Verification filter
    if (isVerified !== undefined && isVerified !== "") {
      andConditions.push({
        isVerified: String(isVerified) === "true",
      });
    }

    // Minimum rating filter
    if (minRating !== undefined && minRating !== "") {
      andConditions.push({
        rating: { gte: parseFloat(minRating as string) || 0 },
      });
    }

    // Keyword search (searches worker name, category, bio, or skill names)
    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim();
      andConditions.push({
        OR: [
          { category: { contains: q, mode: "insensitive" } },
          { bio: { contains: q, mode: "insensitive" } },
          { user: { name: { contains: q, mode: "insensitive" } } },
          { workerSkills: { some: { skill: { name: { contains: q, mode: "insensitive" } } } } },
        ],
      });
    }

    const whereClause = andConditions.length > 0 ? { AND: andConditions } : {};

    // Sort order definition
    const orderDirection = sortOrder === "asc" ? "asc" : "desc";
    let orderBy: any[] = [];

    switch (sortBy) {
      case "price_asc":
      case "rate_asc":
        orderBy = [{ dailyRate: "asc" }];
        break;
      case "price_desc":
      case "rate_desc":
        orderBy = [{ dailyRate: "desc" }];
        break;
      case "experience":
        orderBy = [{ experienceYears: orderDirection }, { rating: "desc" }];
        break;
      case "rate":
        orderBy = [{ dailyRate: orderDirection }];
        break;
      case "completedJobs":
        orderBy = [{ completedJobs: orderDirection }, { rating: "desc" }];
        break;
      case "newest":
        orderBy = [{ createdAt: "desc" }];
        break;
      case "rating":
      default:
        orderBy = [{ isVerified: "desc" }, { rating: orderDirection }, { completedJobs: "desc" }];
        break;
    }

    const [total, workers] = await Promise.all([
      prisma.workerProfile.count({ where: whereClause }),
      prisma.workerProfile.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              phone: true,
            },
          },
          categoryRef: {
            select: {
              name: true,
              hindiName: true,
              slug: true,
              icon: true,
            },
          },
          workerSkills: {
            include: {
              skill: true,
            },
          },
          serviceAreas: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return sendSuccess(
      res,
      {
        workers,
        pagination: {
          currentPage: pageNum,
          totalPages,
          pageSize,
          totalResults: total,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
      "Workers search results retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
}

// Support both /api/workers and /api/workers/search
router.get("/workers", handleWorkerSearch);
router.get("/workers/search", handleWorkerSearch);

// GET /api/workers/:id - Single worker profile details with genuine customer reviews
router.get("/workers/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Support lookup by workerProfile.id OR user.id
    const worker = await prisma.workerProfile.findFirst({
      where: {
        OR: [
          { id },
          { userId: id },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
            createdAt: true,
          },
        },
        categoryRef: true,
        workerSkills: {
          include: {
            skill: true,
          },
        },
        serviceAreas: true,
      },
    });

    if (!worker) {
      return sendError(res, "Worker profile not found", 404);
    }

    // Fetch genuine customer reviews received by this worker
    const reviews = await prisma.review.findMany({
      where: { targetUserId: worker.userId },
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        booking: {
          select: {
            serviceCategory: true,
            completedAt: true,
          },
        },
      },
    });

    return sendSuccess(
      res, 
      { ...worker, reviews }, 
      "Worker profile retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
});

export default router;

import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { sendSuccess } from "../utils/response";

const router = Router();

// Fallback initial categories if database is not yet migrated
const DEFAULT_CATEGORIES = [
  // Construction and Labour
  { name: "General Labour", hindiName: "सामान्य मजदूर", slug: "general-labour", baseDailyRate: 550, icon: "Users" },
  { name: "Construction Helper", hindiName: "कंस्ट्रक्शन हेल्पर", slug: "construction-helper", baseDailyRate: 600, icon: "HardHat" },
  { name: "Mason", hindiName: "राज मिस्त्री", slug: "mason", baseDailyRate: 950, icon: "Layers" },
  { name: "Bricklayer", hindiName: "ईंट जोड़ने वाला", slug: "bricklayer", baseDailyRate: 900, icon: "Layers" },
  { name: "Carpenter", hindiName: "बढ़ई", slug: "carpenter", baseDailyRate: 900, icon: "Hammer" },
  { name: "Electrician", hindiName: "इलेक्ट्रीशियन", slug: "electrician", baseDailyRate: 850, icon: "Zap" },
  { name: "Plumber", hindiName: "प्लम्बर", slug: "plumber", baseDailyRate: 800, icon: "Wrench" },
  { name: "Painter", hindiName: "पेंटर", slug: "painter", baseDailyRate: 750, icon: "Paintbrush" },
  { name: "Welder", hindiName: "वेल्डर", slug: "welder", baseDailyRate: 900, icon: "Flame" },
  { name: "Tile Worker", hindiName: "टाइल कारीगर", slug: "tile-worker", baseDailyRate: 1000, icon: "Layers" },
  { name: "Shuttering Worker", hindiName: "शटरिंग मिस्त्री", slug: "shuttering-worker", baseDailyRate: 950, icon: "Hammer" },
  { name: "Steel Fixer", hindiName: "सरिया बांधने वाला", slug: "steel-fixer", baseDailyRate: 900, icon: "Flame" },
  { name: "Roofing Worker", hindiName: "छत कारीगर", slug: "roofing-worker", baseDailyRate: 900, icon: "HardHat" },
  { name: "Civil Technician", hindiName: "सिविल तकनीशियन", slug: "civil-technician", baseDailyRate: 1200, icon: "Briefcase" },
  { name: "Flooring Worker", hindiName: "फ्लोरिंग कारीगर", slug: "flooring-worker", baseDailyRate: 950, icon: "Layers" },
  { name: "Site Supervisor", hindiName: "साइट सुपरवाइजर", slug: "site-supervisor", baseDailyRate: 1400, icon: "HardHat" },

  // Home Services
  { name: "House Cleaning", hindiName: "घर की सफाई", slug: "house-cleaning", baseDailyRate: 600, icon: "Sparkles" },
  { name: "Deep Cleaning", hindiName: "गहरी सफाई", slug: "deep-cleaning", baseDailyRate: 800, icon: "Sparkles" },
  { name: "AC Repair", hindiName: "एसी रिपेयर", slug: "ac-repair", baseDailyRate: 900, icon: "Wrench" },
  { name: "Refrigerator Repair", hindiName: "फ्रिज रिपेयर", slug: "refrigerator-repair", baseDailyRate: 800, icon: "Wrench" },
  { name: "Washing Machine Repair", hindiName: "वाशिंग मशीन रिपेयर", slug: "washing-machine-repair", baseDailyRate: 800, icon: "Wrench" },
  { name: "Gardening", hindiName: "माली / बागवानी", slug: "gardening", baseDailyRate: 600, icon: "Scissors" },
  { name: "Pest Control", hindiName: "पेस्ट कंट्रोल", slug: "pest-control", baseDailyRate: 900, icon: "Shield" },

  // Transport and Logistics
  { name: "Driver", hindiName: "ड्राइवर", slug: "driver", baseDailyRate: 800, icon: "Truck" },
  { name: "Delivery Worker", hindiName: "डिलीवरी वर्कर", slug: "delivery-worker", baseDailyRate: 600, icon: "Package" },
  { name: "Warehouse Worker", hindiName: "गोदाम सहायक", slug: "warehouse-worker", baseDailyRate: 650, icon: "Archive" },
  { name: "Loading and Unloading", hindiName: "लोडिंग व अनलोडिंग", slug: "loading-unloading", baseDailyRate: 600, icon: "ArrowUpDown" },
];

router.get("/categories", async (req: Request, res: Response, next: NextFunction) => {
  try {
    let categories;
    try {
      categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      });
    } catch {
      // If DB is offline, return fallback
      categories = DEFAULT_CATEGORIES;
    }

    if (!categories || categories.length === 0) {
      categories = DEFAULT_CATEGORIES;
    }

    return sendSuccess(res, categories, "Categories retrieved successfully");
  } catch (error) {
    next(error);
  }
});

export default router;


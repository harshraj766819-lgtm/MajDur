import { Router, Request, Response, NextFunction } from "express";
import PDFDocument from "pdfkit";
import { prisma } from "../config/prisma";
import { authenticateUser } from "../middleware/auth";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

router.use(authenticateUser);

// ========================================================
// 1. GET /api/invoices - List invoices for authenticated user
// ========================================================
router.get("/invoices", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const whereClause: any = {};

    if (userRole === "CUSTOMER") {
      whereClause.booking = { customerId: userId };
    } else if (userRole === "WORKER") {
      whereClause.booking = { workerId: userId };
    } else if (userRole !== "ADMIN") {
      whereClause.booking = { customerId: userId };
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      orderBy: { issuedAt: "desc" },
      include: {
        booking: {
          include: {
            worker: {
              select: {
                id: true,
                name: true,
                phone: true,
                avatar: true,
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return sendSuccess(res, invoices, "Invoices retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 2. GET /api/invoices/:id - Single invoice detail (IDOR Protected)
// ========================================================
router.get("/invoices/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            worker: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                avatar: true,
                workerProfile: true,
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                customerProfile: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return sendError(res, "Invoice not found.", 404);
    }

    // IDOR Protection: only customer, worker, or admin
    if (
      invoice.booking.customerId !== userId &&
      invoice.booking.workerId !== userId &&
      userRole !== "ADMIN"
    ) {
      return sendError(res, "Unauthorized. You do not have permission to view this invoice.", 403);
    }

    return sendSuccess(res, invoice, "Invoice details retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 3. GET /api/invoices/:id/download - Stream PDF Invoice
// ========================================================
router.get("/invoices/:id/download", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            worker: {
              select: {
                name: true,
                phone: true,
                email: true,
                workerProfile: true,
              },
            },
            customer: {
              select: {
                name: true,
                phone: true,
                email: true,
                customerProfile: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return sendError(res, "Invoice not found.", 404);
    }

    // IDOR Check
    if (
      invoice.booking.customerId !== userId &&
      invoice.booking.workerId !== userId &&
      userRole !== "ADMIN"
    ) {
      return sendError(res, "Unauthorized to download this invoice.", 403);
    }

    // Initialize PDF Document
    const doc = new PDFDocument({ margin: 50 });

    // Set Response Headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${invoice.invoiceNumber}.pdf"`
    );

    doc.pipe(res);

    // Header Branding
    doc
      .fontSize(24)
      .fillColor("#D4AF37")
      .text("MajDur (मजदूर)", 50, 45)
      .fontSize(10)
      .fillColor("#555555")
      .text("India's Premier Labour & Skilled Services Marketplace", 50, 75)
      .text("Platform Developer: Harsh Singh | Support: support@majdur.in", 50, 90);

    // Invoice Title & Status
    doc
      .fontSize(16)
      .fillColor("#111111")
      .text("TAX INVOICE / SERVICE RECEIPT", 320, 45, { align: "right" })
      .fontSize(10)
      .fillColor("#228822")
      .text(`STATUS: ${invoice.paidAt ? "PAID" : "COMPLETED"}`, 320, 68, { align: "right" });

    // Divider
    doc
      .strokeColor("#D4AF37")
      .lineWidth(2)
      .moveTo(50, 115)
      .lineTo(550, 115)
      .stroke();

    // Invoice Metadata
    doc
      .fontSize(10)
      .fillColor("#333333")
      .text(`Invoice Number: ${invoice.invoiceNumber}`, 50, 130)
      .text(`Booking Reference: ${invoice.booking.bookingNumber}`, 50, 145)
      .text(`Invoice Date: ${new Date(invoice.issuedAt).toLocaleDateString("en-IN")}`, 50, 160)
      .text(`Place of Supply: ${invoice.booking.city}, India`, 50, 175);

    if (invoice.razorpayPaymentId) {
      doc
        .fontSize(9)
        .fillColor("#228822")
        .text(`Razorpay Ref: ${invoice.razorpayPaymentId}`, 320, 130, { align: "right" })
        .fillColor("#444444")
        .text(`Method: ${invoice.paymentMethod || "ONLINE"} (TEST MODE)`, 320, 145, { align: "right" })
        .text(
          `Paid On: ${invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString("en-IN") : "Verified"}`,
          320,
          160,
          { align: "right" }
        );
    }

    // Bill To & Service Provider Columns
    const colY = 205;
    doc
      .fontSize(11)
      .fillColor("#111111")
      .text("BILL TO (CUSTOMER):", 50, colY)
      .fontSize(10)
      .fillColor("#444444")
      .text(`Name: ${invoice.booking.customer.name}`, 50, colY + 18)
      .text(`Phone: +91 ${invoice.booking.customer.phone}`, 50, colY + 32)
      .text(`Site: ${invoice.booking.address}, ${invoice.booking.city}`, 50, colY + 46);

    doc
      .fontSize(11)
      .fillColor("#111111")
      .text("SERVICE PROVIDER (ARTISAN):", 320, colY)
      .fontSize(10)
      .fillColor("#444444")
      .text(`Name: ${invoice.booking.worker.name}`, 320, colY + 18)
      .text(`Trade: ${invoice.booking.serviceCategory}`, 320, colY + 32)
      .text(`Phone: +91 ${invoice.booking.worker.phone}`, 320, colY + 46);

    // Table Header
    const tableTop = 295;
    doc
      .rect(50, tableTop, 500, 24)
      .fill("#1a1a1a");

    doc
      .fontSize(10)
      .fillColor("#D4AF37")
      .text("DESCRIPTION / SERVICE", 60, tableTop + 7)
      .text("DAYS", 330, tableTop + 7)
      .text("RATE (INR)", 400, tableTop + 7)
      .text("AMOUNT (INR)", 470, tableTop + 7, { align: "right" });

    // Table Row
    const rowY = tableTop + 35;
    doc
      .fontSize(10)
      .fillColor("#222222")
      .text(`Skilled Services: ${invoice.booking.serviceCategory}`, 60, rowY)
      .text(`${invoice.booking.totalDays}`, 330, rowY)
      .text(`₹${invoice.booking.dailyRate}`, 400, rowY)
      .text(`₹${invoice.amount.toFixed(2)}`, 470, rowY, { align: "right" });

    // Table Bottom Line
    doc
      .strokeColor("#E0E0E0")
      .lineWidth(1)
      .moveTo(50, rowY + 25)
      .lineTo(550, rowY + 25)
      .stroke();

    // Summary Totals
    const sumY = rowY + 40;
    doc
      .fontSize(10)
      .fillColor("#555555")
      .text("Subtotal:", 350, sumY)
      .text(`₹${invoice.amount.toFixed(2)}`, 470, sumY, { align: "right" })
      .text("GST / Platform Fee:", 350, sumY + 18)
      .text(`₹${(invoice.taxAmount || 0).toFixed(2)}`, 470, sumY + 18, { align: "right" })
      .fontSize(12)
      .fillColor("#111111")
      .text("Total Paid:", 350, sumY + 40)
      .text(`₹${invoice.totalAmount.toFixed(2)}`, 470, sumY + 40, { align: "right" });

    // Footer
    doc
      .fontSize(9)
      .fillColor("#777777")
      .text(
        "This is a digitally generated invoice authenticated by the MajDur Platform. No physical signature is required.",
        50,
        680,
        { align: "center", width: 500 }
      )
      .text("Developed by Harsh Singh • MajDur Technologies India", 50, 695, {
        align: "center",
        width: 500,
      });

    doc.end();
  } catch (error) {
    next(error);
  }
});

export default router;


# MajDur Database Data Dictionary

**Author:** Harsh Singh  
**ORM:** Prisma v5.22.0  
**RDBMS:** PostgreSQL 16

---

## 1. Schema Summary

The database is composed of 24 normalized relational models:

| Model | Purpose | Key Indexes / Constraints |
|---|---|---|
| `User` | Core identity & auth credentials | Unique: `email`, `phone`; Index: `role`, `phone` |
| `CustomerProfile` | Customer specific location & contact | Unique: `userId` |
| `WorkerProfile` | Tradesman skills, rates, availability | Unique: `userId`; Index: `category`, `locationCity`, `isVerified` |
| `ContractorProfile` | Commercial builder & company details | Unique: `userId`, `gstNumber` |
| `Category` | Managed trade groups (Electrician, Plumber, etc.) | Unique: `name`, `slug` |
| `Skill` | Granular skills per category | Unique: `name` |
| `WorkerSkill` | Worker-skill join with experience | Unique: `[workerProfileId, skillId]` |
| `Address` | Multiple delivery/service locations | Foreign Key: `userId` |
| `ServiceArea` | Cities/PIN codes covered by a worker | Index: `city`, `pincode` |
| `Job` | Requirements posted by clients/contractors | Index: `city`, `status`, `categoryName` |
| `JobSkill` | Required skills for a job | Unique: `[jobId, skillId]` |
| `JobApplication` | Worker applications for posted jobs | Unique: `[jobId, workerId]` |
| `Booking` | Direct customer-worker contracts | Unique: `bookingNumber`; Index: `status`, `customerId`, `workerId` |
| `BookingStatusHistory` | Audit trail of booking state changes | Index: `bookingId` |
| `Payment` | Razorpay transaction records | Unique: `razorpayOrderId`, `razorpayPaymentId` |
| `Invoice` | Official billing documents | Unique: `invoiceNumber` |
| `Review` | Verified customer reviews on completed bookings | Unique: `[bookingId, reviewerId]` |
| `Notification` | In-app alerts | Index: `[userId, isRead]` |
| `Conversation` | Direct chat thread container | Auto cuid |
| `ConversationMember` | Chat participants | Unique: `[conversationId, userId]` |
| `Message` | Chat messages with read state | Index: `conversationId` |
| `Complaint` | Dispute resolution tickets | Unique: `ticketNumber` |
| `VerificationRequest` | KYC document submissions | Index: `status`, `userId` |
| `AdminAuditLog` | Critical administrative action trail | Index: `adminId`, `action` |

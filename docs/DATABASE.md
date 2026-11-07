# MajDur Database Data Dictionary (MongoDB)

**Author:** Harsh Singh  
**Platform:** MajDur (India's Premier Workforce & Skilled Services Marketplace)  
**Database:** MongoDB (Database: `majdur`)  
**ORM:** Prisma v5.22.0 (`provider = "mongodb"`)

---

## 1. Schema & Collections Summary

The database uses MongoDB with 24 normalized collections. Every document utilizes `@id @default(auto()) @map("_id") @db.ObjectId`.

| Collection | Description | Identifiers & Indexes |
|---|---|---|
| `User` | Core authentication & profiles | `_id`, Unique: `email`, `phone`, Index: `role` |
| `CustomerProfile` | Customer delivery & contact info | `_id`, Unique: `userId` (`@db.ObjectId`) |
| `WorkerProfile` | Tradesman skills, rates, availability | `_id`, Unique: `userId`, Indexes: `category`, `locationCity`, `isVerified`, `isAvailable` |
| `ContractorProfile` | Commercial builder details & GST | `_id`, Unique: `userId`, `gstNumber` |
| `Category` | Managed trade groups (Electrician, Plumber, etc.) | `_id`, Unique: `name`, `slug`, Index: `isActive` |
| `Skill` | Granular skills per category | `_id`, Unique: `name`, Relation: `categoryId` |
| `WorkerSkill` | Worker-skill join with experience | `_id`, Unique: `[workerProfileId, skillId]` |
| `Address` | Multiple service addresses | `_id`, Relation: `userId` |
| `ServiceArea` | Cities/PIN codes covered by a worker | `_id`, Indexes: `city`, `pincode` |
| `Job` | Requirements posted by clients/contractors | `_id`, Indexes: `city`, `status`, `categoryName` |
| `JobSkill` | Required skills for a job | `_id`, Unique: `[jobId, skillId]` |
| `JobApplication` | Worker applications with proposed rates | `_id`, Unique: `[jobId, workerId]`, Index: `status` |
| `Booking` | Direct customer-worker contracts | `_id`, Unique: `bookingNumber`, Indexes: `status`, `customerId`, `workerId` |
| `BookingStatusHistory` | Audit trail of booking state changes | `_id`, Index: `bookingId` |
| `Payment` | Razorpay transaction records | `_id`, Unique: `razorpayOrderId`, `razorpayPaymentId`, Indexes: `status`, `userId` |
| `Invoice` | Official billing documents | `_id`, Unique: `invoiceNumber`, Index: `bookingId` |
| `Review` | Verified customer reviews on completed bookings | `_id`, Unique: `[bookingId, reviewerId]`, Index: `targetUserId` |
| `Notification` | In-app alerts | `_id`, Index: `[userId, isRead]` |
| `Conversation` | Direct chat thread container | `_id` |
| `ConversationMember` | Chat participants | `_id`, Unique: `[conversationId, userId]` |
| `Message` | Chat messages with read state | `_id`, Index: `conversationId` |
| `Complaint` | Dispute resolution tickets | `_id`, Unique: `ticketNumber`, Indexes: `status`, `filedById` |
| `VerificationRequest` | KYC document submissions | `_id`, Indexes: `status`, `userId` |
| `AdminAuditLog` | Critical administrative action trail | `_id`, Indexes: `adminId`, `action` |

---

## 2. MongoDB Prisma Synchronization Workflow

MongoDB does not use SQL migrations (`prisma migrate dev`). Instead, Prisma uses schema push to synchronize indexes and collections:

```powershell
# Synchronize collections and indexes
npm run prisma:push

# Generate typed Prisma client
npm run prisma:generate

# Seed 32 default trade categories & Admin user
npm run prisma:seed

# Verify database connection and document counts
npm run db:test

# Launch visual database browser (Prisma Studio)
npm run prisma:studio
```

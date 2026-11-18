/**
 * MajDur Frontend API Client
 * Developer: Harsh Singh
 * Platform: MajDur (India's Premier Workforce & Skilled Services Marketplace)
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface Category {
  id: string;
  name: string;
  hindiName: string | null;
  slug: string;
  description: string | null;
  icon: string | null;
  baseDailyRate: number | null;
  isActive: boolean;
  displayOrder: number;
  _count?: {
    workerProfiles?: number;
    jobs?: number;
  };
}

export interface PlatformStats {
  registeredWorkers: number;
  completedJobs: number;
  activeContractors: number;
  totalCategories: number;
  generatedAt?: string;
}

export interface WorkerItem {
  id: string;
  userId: string;
  category: string;
  bio: string | null;
  dailyRate: number | null;
  hourlyRate: number | null;
  experienceYears: number;
  locationCity: string;
  locationState: string;
  locationPincode: string;
  isAvailable: boolean;
  isVerified: boolean;
  rating: number;
  totalReviews: number;
  completedJobs: number;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    phone: string;
  };
  categoryRef?: {
    name: string;
    hindiName: string | null;
    slug: string;
    icon: string | null;
  } | null;
}

export interface WorkerSearchResponse {
  workers: WorkerItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalResults: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// 1. Fetch 32 Categories
export async function fetchCategories(search?: string): Promise<Category[]> {
  try {
    const url = new URL(`${API_BASE_URL}/categories`);
    if (search?.trim()) {
      url.searchParams.set("search", search.trim());
    }

    const res = await fetch(url.toString(), {
      next: { revalidate: 60 }, // ISR cache 60s
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch categories: ${res.statusText}`);
    }

    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("fetchCategories error:", error);
    return [];
  }
}

// 2. Fetch Platform Statistics (Real values from MongoDB)
export async function fetchPlatformStats(): Promise<PlatformStats> {
  try {
    const res = await fetch(`${API_BASE_URL}/stats/platform`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch stats: ${res.statusText}`);
    }

    const data = await res.json();
    return data.data || {
      registeredWorkers: 0,
      completedJobs: 0,
      activeContractors: 0,
      totalCategories: 32,
    };
  } catch (error) {
    console.error("fetchPlatformStats error:", error);
    return {
      registeredWorkers: 0,
      completedJobs: 0,
      activeContractors: 0,
      totalCategories: 32,
    };
  }
}

// 3. Fetch Featured Workers
export async function fetchFeaturedWorkers(): Promise<WorkerItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/workers/featured`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch featured workers: ${res.statusText}`);
    }

    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("fetchFeaturedWorkers error:", error);
    return [];
  }
}

// 4. Search Workers
export async function searchWorkers(params: {
  category?: string;
  city?: string;
  area?: string;
  pincode?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<WorkerSearchResponse> {
  try {
    const url = new URL(`${API_BASE_URL}/workers/search`);
    if (params.category) url.searchParams.set("category", params.category);
    if (params.city && params.city !== "All India") url.searchParams.set("city", params.city);
    if (params.area) url.searchParams.set("area", params.area);
    if (params.pincode) url.searchParams.set("pincode", params.pincode);
    if (params.search) url.searchParams.set("search", params.search);
    if (params.page) url.searchParams.set("page", String(params.page));
    if (params.limit) url.searchParams.set("limit", String(params.limit));

    const res = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to search workers: ${res.statusText}`);
    }

    const data = await res.json();
    return (
      data.data || {
        workers: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          pageSize: 10,
          totalResults: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      }
    );
  } catch (error) {
    console.error("searchWorkers error:", error);
    return {
      workers: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        pageSize: 10,
        totalResults: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }
}



// ==========================================
// Phase 4: Authentication API Client
// ==========================================

export interface UserSession {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: "CUSTOMER" | "WORKER" | "CONTRACTOR" | "ADMIN";
  avatar?: string | null;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  profile?: any;
}

export interface AuthResponse {
  user: UserSession;
  accessToken: string;
  otpSent?: boolean;
}

export async function loginUser(credentials: {
  identifier: string;
  password: string;
  role?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(credentials),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to log in.");
  }
  return json.data;
}

export async function registerCustomer(data: {
  name: string;
  email?: string;
  phone: string;
  password: string;
  confirmPassword?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register/customer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to register customer.");
  }
  return json.data;
}

export async function registerWorker(data: {
  name: string;
  email?: string;
  phone: string;
  password: string;
  trade: string;
  experienceYears?: number;
  city: string;
  pincode?: string;
  dailyRate?: number;
  bio?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register/worker`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to register worker.");
  }
  return json.data;
}

export async function registerContractor(data: {
  companyName: string;
  contactPerson: string;
  email?: string;
  phone: string;
  password: string;
  city: string;
  gstNumber?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register/contractor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to register contractor.");
  }
  return json.data;
}

export async function logoutUser(): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => {});
}

export async function fetchCurrentUser(): Promise<UserSession | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function sendOtp(phone: string): Promise<{ expiresAt: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to send OTP.");
  }
  return json.data;
}

export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to verify OTP.");
  }
  return json.data?.verified || false;
}

export async function requestPasswordReset(identifier: string): Promise<{ token?: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/password/forgot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to initiate password reset.");
  }
  return json.data || {};
}

export async function submitPasswordReset(data: {
  token: string;
  newPassword: string;
  confirmPassword?: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/auth/password/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to reset password.");
  }
}

// ==========================================
// Phase 5: Customer Portal API Client
// ==========================================

export interface Address {
  id: string;
  userId: string;
  title: string;
  line1: string;
  line2?: string | null;
  area?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  workerId: string;
  jobId?: string | null;
  serviceCategory: string;
  status: "REQUESTED" | "ACCEPTED" | "REJECTED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "DISPUTED";
  startDate: string;
  endDate?: string | null;
  dailyRate: number;
  totalDays: number;
  totalAmount: number;
  address: string;
  city: string;
  notes?: string | null;
  completionNotes?: string | null;
  completedAt?: string | null;
  paymentStatus?: "UNPAID" | "PENDING" | "PAID" | "FAILED" | "REFUND_PENDING" | "REFUNDED" | "PARTIALLY_REFUNDED" | string;
  paidAmount?: number;
  paidAt?: string | null;
  createdAt: string;
  worker?: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    avatar?: string | null;
    workerProfile?: {
      category: string;
      dailyRate: number;
      locationCity: string;
      rating: number;
    } | null;
  };
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    avatar?: string | null;
  };
  reviews?: ReviewItem[];
  invoices?: Invoice[];
  payments?: PaymentRecord[];
  statusHistory?: Array<{
    id: string;
    status: string;
    note?: string | null;
    changedBy?: string | null;
    createdAt: string;
  }>;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  paymentId?: string | null;
  razorpayPaymentId?: string | null;
  paymentMethod?: string | null;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  pdfUrl?: string | null;
  issuedAt: string;
  paidAt?: string | null;
  booking?: Booking;
}

export interface ReviewItem {
  id: string;
  bookingId: string;
  reviewerId: string;
  targetUserId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  reviewer?: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  targetUser?: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  booking?: {
    bookingNumber: string;
    serviceCategory: string;
    completedAt?: string | null;
  };
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt?: string | null;
  link?: string | null;
  bookingId?: string | null;
  conversationId?: string | null;
  relatedUserId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerDashboardData {
  profile: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    avatar?: string | null;
    role: string;
    isPhoneVerified: boolean;
    isEmailVerified: boolean;
    createdAt: string;
    customerProfile?: {
      city?: string | null;
      state?: string | null;
      pincode?: string | null;
      alternatePhone?: string | null;
    } | null;
    addresses?: Address[];
  };
  stats: {
    totalBookings: number;
    pendingBookings: number;
    acceptedBookings: number;
    inProgressBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalSpent: number;
  };
  recentBookings: Booking[];
  recentNotifications: NotificationItem[];
}

// 1. Fetch Customer Dashboard
export async function fetchCustomerDashboard(): Promise<CustomerDashboardData> {
  const res = await fetch(`${API_BASE_URL}/customer/dashboard`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to load customer dashboard");
  }
  return json.data;
}

// 2. Fetch Customer Profile
export async function fetchCustomerProfile(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/customer/profile`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to load customer profile");
  }
  return json.data;
}

// 3. Update Customer Profile
export async function updateCustomerProfile(data: {
  name?: string;
  email?: string;
  avatar?: string;
  alternatePhone?: string;
  city?: string;
  state?: string;
  pincode?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/customer/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to update profile");
  }
  return json.data;
}

// 4. Change Password
export async function changeCustomerPassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/customer/change-password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to change password");
  }
}

// 5. Address CRUD
export async function createCustomerAddress(data: {
  title?: string;
  line1: string;
  line2?: string;
  area?: string;
  city: string;
  state?: string;
  pincode: string;
  isDefault?: boolean;
}): Promise<Address> {
  const res = await fetch(`${API_BASE_URL}/customer/addresses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to save address");
  }
  return json.data;
}

export async function updateCustomerAddress(id: string, data: Partial<Address>): Promise<Address> {
  const res = await fetch(`${API_BASE_URL}/customer/addresses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to update address");
  }
  return json.data;
}

export async function deleteCustomerAddress(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/customer/addresses/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to delete address");
  }
}

// 6. Worker Directory Search
export async function fetchWorkersDirectory(params: {
  category?: string;
  trade?: string;
  skill?: string;
  city?: string;
  area?: string;
  pincode?: string;
  search?: string;
  minExperience?: number;
  maxExperience?: number;
  minRate?: number;
  maxRate?: number;
  minRating?: number;
  isAvailable?: boolean;
  isVerified?: boolean;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
} = {}): Promise<WorkerSearchResponse> {
  const url = new URL(`${API_BASE_URL}/workers`);
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "" && val !== "ALL") {
      url.searchParams.set(key, String(val));
    }
  });

  const res = await fetch(url.toString(), {
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch workers");
  }
  return json.data;
}

// 7. Worker Profile Details (including reviews)
export async function fetchWorkerProfile(id: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/workers/${id}`, {
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Worker not found");
  }
  return json.data;
}

// 8. Bookings
export async function createBookingRequest(data: {
  workerId: string;
  serviceCategory?: string;
  startDate: string;
  endDate?: string;
  totalDays?: number;
  address: string;
  city: string;
  notes?: string;
}): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to submit booking request");
  }
  return json.data;
}

export async function fetchCustomerBookings(params: {
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ bookings: Booking[]; pagination: any }> {
  const url = new URL(`${API_BASE_URL}/bookings`);
  if (params.status && params.status !== "ALL") {
    url.searchParams.set("status", params.status);
  }
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));

  const res = await fetch(url.toString(), {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch bookings");
  }
  return json.data;
}

export async function fetchBookingDetail(id: string): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/bookings/${id}`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch booking detail");
  }
  return json.data;
}

export async function cancelBookingRequest(id: string, reason?: string): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/bookings/${id}/cancel`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ reason: reason || "Cancelled by customer" }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to cancel booking");
  }
  return json.data;
}

export async function acceptBookingRequest(id: string, note?: string): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/bookings/${id}/accept`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ note: note || "Worker accepted booking request" }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to accept booking");
  }
  return json.data;
}

export async function rejectBookingRequest(id: string, reason?: string): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/bookings/${id}/reject`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ reason: reason || "Worker declined booking request" }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to decline booking");
  }
  return json.data;
}

export async function updateBookingLifecycleStatus(
  id: string,
  data: { status: string; note?: string }
): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/bookings/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to update booking status");
  }
  return json.data;
}

// 9. Reviews
export async function submitBookingReview(data: {
  bookingId: string;
  rating: number;
  comment?: string;
}): Promise<ReviewItem> {
  const res = await fetch(`${API_BASE_URL}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to submit review");
  }
  return json.data;
}

export async function fetchReviewsList(params: {
  workerId?: string;
  customerId?: string;
  bookingId?: string;
} = {}): Promise<ReviewItem[]> {
  const url = new URL(`${API_BASE_URL}/reviews`);
  if (params.workerId) url.searchParams.set("workerId", params.workerId);
  if (params.customerId) url.searchParams.set("customerId", params.customerId);
  if (params.bookingId) url.searchParams.set("bookingId", params.bookingId);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch reviews");
  }
  return json.data;
}

// 10. Invoices
export async function fetchCustomerInvoices(): Promise<Invoice[]> {
  const res = await fetch(`${API_BASE_URL}/invoices`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch invoices");
  }
  return json.data;
}

export async function fetchInvoiceDetail(id: string): Promise<Invoice> {
  const res = await fetch(`${API_BASE_URL}/invoices/${id}`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch invoice");
  }
  return json.data;
}

export async function downloadInvoicePdf(id: string, invoiceNumber: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/invoices/${id}/download`, {
    credentials: "include",
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || "Failed to download invoice PDF");
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invoiceNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// 11. Notifications
export interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalResults: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export async function fetchNotificationsList(params?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}): Promise<NotificationsResponse> {
  const url = new URL(`${API_BASE_URL}/notifications`);
  if (params?.page) url.searchParams.set("page", params.page.toString());
  if (params?.limit) url.searchParams.set("limit", params.limit.toString());
  if (params?.unreadOnly) url.searchParams.set("unread", "true");

  const res = await fetch(url.toString(), {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch notifications");
  }
  return json.data;
}

export async function fetchUnreadNotificationsCount(): Promise<number> {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      credentials: "include",
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) {
      return 0;
    }
    return json.data?.unreadCount || 0;
  } catch {
    return 0;
  }
}

export async function markNotificationAsRead(id: string): Promise<NotificationItem> {
  const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: "PATCH",
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to mark notification as read");
  }
  return json.data;
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: "PATCH",
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to mark all notifications as read");
  }
}

export async function deleteNotification(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/notifications/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to delete notification");
  }
}

// ==========================================
// Phase 6: Worker Portal API Client
// ==========================================

export interface WorkerSkillItem {
  id: string;
  workerProfileId: string;
  skillId: string;
  yearsExperience: number;
  skill: {
    id: string;
    name: string;
    categoryId: string;
    category?: {
      name: string;
      slug: string;
    };
  };
}

export interface ServiceAreaItem {
  id: string;
  workerProfileId: string;
  city: string;
  pincode?: string | null;
  areaName?: string | null;
  radiusKm: number;
}

export interface WorkerProfile {
  id: string;
  userId: string;
  category: string;
  categoryId?: string | null;
  experienceYears: number;
  bio?: string | null;
  dailyRate?: number | null;
  hourlyRate?: number | null;
  locationCity: string;
  locationState: string;
  locationPincode: string;
  serviceRadiusKm: number;
  isAvailable: boolean;
  isVerified: boolean;
  rating: number;
  totalReviews: number;
  completedJobs: number;
  idProofType?: string | null;
  idProofUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkerDashboardData {
  user: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    avatar?: string | null;
    role: string;
    isPhoneVerified: boolean;
    isEmailVerified: boolean;
  };
  profile: WorkerProfile;
  stats: {
    activeWorkCount: number;
    pendingRequestsCount: number;
    completedWorkCount: number;
    totalEarnings: number;
    pendingEarnings: number;
    totalApplicationsCount: number;
    pendingApplicationsCount: number;
    acceptedApplicationsCount: number;
    rating: number;
    totalReviews: number;
    isAvailable: boolean;
    isVerified: boolean;
  };
  recentBookings: Booking[];
  recentApplications: JobApplicationItem[];
  recentNotifications: NotificationItem[];
  matchingJobs: JobItem[];
}

export interface WorkerProfileData {
  user: UserSession;
  profile: WorkerProfile;
}

export interface WorkerOnboardingData {
  currentStep: number;
  isCompleted: boolean;
  steps: {
    step1: { completed: boolean; name: string };
    step2: { completed: boolean; name: string };
    step3: { completed: boolean; name: string };
    step4: { completed: boolean; name: string };
  };
  user: UserSession;
  profile: WorkerProfile;
}

export interface JobItem {
  id: string;
  title: string;
  description: string;
  categoryName: string;
  categoryId?: string | null;
  budget: number;
  budgetType: "FIXED" | "HOURLY" | "DAILY";
  jobType: "ONE_TIME" | "RECURRING" | "CONTRACT";
  city: string;
  area?: string | null;
  address: string;
  pincode: string;
  startDate?: string | null;
  expectedDays?: number | null;
  workersNeeded: number;
  status: string;
  poster: {
    id: string;
    name: string;
    role: string;
    phone?: string;
  };
  skills?: Array<{ skill: { id: string; name: string } }>;
  _count?: { applications: number };
  hasApplied?: boolean;
  myApplication?: {
    id: string;
    status: string;
    proposedRate: number;
    coverNote?: string;
  } | null;
  createdAt: string;
}

export interface JobApplicationItem {
  id: string;
  jobId: string;
  workerId: string;
  proposedRate: number;
  coverNote?: string | null;
  status: "PENDING" | "SHORTLISTED" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  job: JobItem;
  createdAt: string;
}

export interface WorkerEarningsData {
  summary: {
    totalConfirmedEarnings: number;
    pendingEarnings: number;
    completedJobsCount: number;
    currency: string;
    currencySymbol: string;
  };
  transactions: Array<{
    id: string;
    bookingNumber: string;
    serviceCategory: string;
    customerName: string;
    date: string;
    dailyRate: number;
    totalDays: number;
    grossAmount: number;
    platformFee: number;
    netPayout: number;
    status: string;
    invoiceNumber?: string | null;
  }>;
}

// 1. Worker Dashboard
export async function fetchWorkerDashboard(): Promise<WorkerDashboardData> {
  const res = await fetch(`${API_BASE_URL}/worker/dashboard`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch worker dashboard");
  }
  return json.data;
}

// 2. Worker Profile
export async function fetchWorkerProfileData(): Promise<WorkerProfileData> {
  const res = await fetch(`${API_BASE_URL}/worker/profile`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch worker profile");
  }
  return json.data;
}

export async function updateWorkerProfileData(data: {
  name?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  experienceYears?: number;
  category?: string;
  categoryId?: string;
  locationCity?: string;
  locationState?: string;
  locationPincode?: string;
  serviceRadiusKm?: number;
  dailyRate?: number;
  hourlyRate?: number;
  isAvailable?: boolean;
}): Promise<WorkerProfileData> {
  const res = await fetch(`${API_BASE_URL}/worker/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to update worker profile");
  }
  return json.data;
}

// 3. Worker Onboarding
export async function fetchWorkerOnboarding(): Promise<WorkerOnboardingData> {
  const res = await fetch(`${API_BASE_URL}/worker/onboarding`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch onboarding status");
  }
  return json.data;
}

export async function saveWorkerOnboardingStep(step: number, data: any): Promise<WorkerProfile> {
  const res = await fetch(`${API_BASE_URL}/worker/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ step, data }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to save onboarding step");
  }
  return json.data;
}

// 4. Skills Management
export async function fetchWorkerSkillsList(): Promise<{
  mySkills: WorkerSkillItem[];
  availableSkills: Array<{ id: string; name: string; categoryId: string; isAdded: boolean }>;
}> {
  const res = await fetch(`${API_BASE_URL}/worker/skills`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch worker skills");
  }
  return json.data;
}

export async function addWorkerSkill(data: {
  skillId?: string;
  skillName?: string;
  yearsExperience?: number;
}): Promise<WorkerSkillItem> {
  const res = await fetch(`${API_BASE_URL}/worker/skills`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to add skill");
  }
  return json.data;
}

export async function updateWorkerSkillExp(id: string, yearsExperience: number): Promise<WorkerSkillItem> {
  const res = await fetch(`${API_BASE_URL}/worker/skills/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ yearsExperience }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to update skill experience");
  }
  return json.data;
}

export async function deleteWorkerSkill(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/worker/skills/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to delete skill");
  }
}

// 5. Rates
export async function fetchWorkerRates(): Promise<{
  dailyRate: number;
  hourlyRate: number;
  recommendedDailyRate: number;
  category: string;
}> {
  const res = await fetch(`${API_BASE_URL}/worker/rates`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch rates");
  }
  return json.data;
}

export async function updateWorkerRates(rates: {
  dailyRate?: number;
  hourlyRate?: number;
}): Promise<{ dailyRate: number; hourlyRate: number }> {
  const res = await fetch(`${API_BASE_URL}/worker/rates`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(rates),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to update rates");
  }
  return json.data;
}

// 6. Service Areas
export async function fetchWorkerServiceAreas(): Promise<{
  primaryLocation: {
    city: string;
    state: string;
    pincode: string;
    serviceRadiusKm: number;
  };
  additionalAreas: ServiceAreaItem[];
}> {
  const res = await fetch(`${API_BASE_URL}/worker/service-areas`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch service areas");
  }
  return json.data;
}

export async function addWorkerServiceArea(data: {
  city: string;
  pincode?: string;
  areaName?: string;
  radiusKm?: number;
}): Promise<ServiceAreaItem> {
  const res = await fetch(`${API_BASE_URL}/worker/service-areas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to add service area");
  }
  return json.data;
}

export async function deleteWorkerServiceArea(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/worker/service-areas/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to delete service area");
  }
}

// 7. Availability
export async function fetchWorkerAvailability(): Promise<{
  isAvailable: boolean;
  upcomingBookings: Array<{
    id: string;
    bookingNumber: string;
    startDate: string;
    endDate?: string | null;
    status: string;
    serviceCategory: string;
    customer: { name: string; phone: string };
  }>;
}> {
  const res = await fetch(`${API_BASE_URL}/worker/availability`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch availability");
  }
  return json.data;
}

export async function updateWorkerAvailability(isAvailable: boolean): Promise<{ isAvailable: boolean }> {
  const res = await fetch(`${API_BASE_URL}/worker/availability`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ isAvailable }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to update availability");
  }
  return json.data;
}

// 8. Jobs
export async function fetchWorkerJobs(params: {
  category?: string;
  city?: string;
  pincode?: string;
  jobType?: string;
  budgetType?: string;
  minBudget?: number;
  maxBudget?: number;
  search?: string;
  status?: string;
} = {}): Promise<JobItem[]> {
  const url = new URL(`${API_BASE_URL}/worker/jobs`);
  if (params.category) url.searchParams.set("category", params.category);
  if (params.city) url.searchParams.set("city", params.city);
  if (params.pincode) url.searchParams.set("pincode", params.pincode);
  if (params.jobType) url.searchParams.set("jobType", params.jobType);
  if (params.budgetType) url.searchParams.set("budgetType", params.budgetType);
  if (params.minBudget) url.searchParams.set("minBudget", String(params.minBudget));
  if (params.maxBudget) url.searchParams.set("maxBudget", String(params.maxBudget));
  if (params.search) url.searchParams.set("search", params.search);
  if (params.status) url.searchParams.set("status", params.status);

  const res = await fetch(url.toString(), {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch jobs");
  }
  return json.data;
}

export async function fetchWorkerJobDetail(id: string): Promise<JobItem> {
  const res = await fetch(`${API_BASE_URL}/worker/jobs/${id}`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch job detail");
  }
  return json.data;
}

// 9. Job Applications
export async function applyForJob(data: {
  jobId: string;
  proposedRate: number;
  coverNote?: string;
}): Promise<JobApplicationItem> {
  const res = await fetch(`${API_BASE_URL}/worker/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to submit job application");
  }
  return json.data;
}

export async function fetchWorkerApplications(status?: string): Promise<JobApplicationItem[]> {
  const url = new URL(`${API_BASE_URL}/worker/applications`);
  if (status && status !== "ALL") url.searchParams.set("status", status);

  const res = await fetch(url.toString(), {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch job applications");
  }
  return json.data;
}

export async function fetchWorkerApplicationDetail(id: string): Promise<JobApplicationItem> {
  const res = await fetch(`${API_BASE_URL}/worker/applications/${id}`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch application detail");
  }
  return json.data;
}

export async function withdrawJobApplication(id: string): Promise<JobApplicationItem> {
  const res = await fetch(`${API_BASE_URL}/worker/applications/${id}/withdraw`, {
    method: "PATCH",
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to withdraw application");
  }
  return json.data;
}

// 10. Work Management
export async function fetchWorkerWork(status?: string): Promise<Booking[]> {
  const url = new URL(`${API_BASE_URL}/worker/work`);
  if (status && status !== "ALL") url.searchParams.set("status", status);

  const res = await fetch(url.toString(), {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch work bookings");
  }
  return json.data;
}

export async function updateWorkerWorkStatus(
  id: string,
  data: { status: "ACCEPTED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED"; completionNotes?: string; note?: string }
): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/worker/work/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to update work status");
  }
  return json.data;
}

// 11. Earnings
export async function fetchWorkerEarnings(): Promise<WorkerEarningsData> {
  const res = await fetch(`${API_BASE_URL}/worker/earnings`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch earnings");
  }
  return json.data;
}

export async function downloadWorkerEarningsStatement(workerName: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/worker/earnings/statement`, {
    credentials: "include",
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || "Failed to download earnings statement PDF");
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `MajDur-Worker-Statement-${workerName.replace(/\s+/g, "_")}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// 12. Verification
export async function fetchWorkerVerification(): Promise<{
  isVerified: boolean;
  idProofType?: string | null;
  idProofUrl?: string | null;
  latestRequest?: any;
}> {
  const res = await fetch(`${API_BASE_URL}/worker/verification`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch verification status");
  }
  return json.data;
}

export async function submitWorkerVerification(data: {
  idType: string;
  idNumber?: string;
  documentUrl: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/worker/verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to submit verification");
  }
  return json.data;
}

// ========================================================
// PHASE 7: CONTRACTOR B2B PLATFORM API CLIENT
// Developer: Harsh Singh
// ========================================================

export interface ContractorProfileData {
  id: string;
  userId: string;
  companyName: string;
  companyBio?: string | null;
  gstNumber?: string | null;
  gstin?: string | null;
  licenseNumber?: string | null;
  ownerName?: string | null;
  businessEmail?: string | null;
  businessPhone?: string | null;
  businessAddress?: string | null;
  businessType?: string | null;
  panNumber?: string | null;
  companyLogo?: string | null;
  city: string;
  state: string;
  pincode?: string | null;
  isVerified: boolean;
  user: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    avatar?: string | null;
  };
}

export interface ContractorDashboardData {
  contractor: ContractorProfileData;
  stats: {
    totalProjects: number;
    activeProjects: number;
    totalSites: number;
    activeSites: number;
    allocatedWorkers: number;
    activeSupervisors: number;
    totalSupervisors: number;
    totalInvoices: number;
    totalInvoiced: number;
    totalInvoicedAmount: number;
    outstandingAmount: number;
    pendingInvoicesCount: number;
  };
  metrics?: any;
  recentProjects: any[];
  recentReports: any[];
  recentInvoices: any[];
}

export interface CommercialProject {
  id: string;
  contractorId: string;
  projectCode: string;
  name: string;
  description: string;
  category: "COMMERCIAL" | "RESIDENTIAL" | "INFRASTRUCTURE" | "INDUSTRIAL" | "RENOVATION";
  clientName: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
  startDate: string;
  endDate?: string | null;
  budget: number;
  status: "DRAFT" | "PUBLISHED" | "RECRUITMENT_OPEN" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  requiredTrades: string[];
  totalWorkforceNeeded: number;
  sites?: CommercialSite[];
  recruitmentRequests?: any[];
  gstInvoices?: any[];
  _count?: {
    sites: number;
    recruitmentRequests: number;
    gstInvoices: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CommercialSite {
  id: string;
  projectId: string;
  siteCode: string;
  name: string;
  address: string;
  city: string;
  pincode: string;
  siteManager?: string | null;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  project?: {
    id: string;
    name: string;
    projectCode: string;
    clientName: string;
  };
  _count?: {
    workerAssignments?: number;
    teams?: number;
    dailyReports?: number;
  };
  createdAt: string;
}

export interface SiteTeam {
  id: string;
  siteId: string;
  name: string;
  trade: string;
  teamLeaderName?: string | null;
  teamLeaderPhone?: string | null;
  shift: "MORNING" | "DAY" | "NIGHT";
  workersCount?: number;
  createdAt: string;
}

export interface RecruitmentRequestItem {
  id: string;
  projectId: string;
  requestNumber: string;
  title: string;
  totalWorkersNeeded: number;
  dailyRate: number;
  shiftType: string;
  workingHours: number;
  requiredExperienceYears: number;
  recruitmentDeadline?: string | null;
  notes?: string | null;
  tradeRequirements?: Array<{ trade: string; count: number; dailyRate: number }>;
  status: "OPEN" | "FULFILLED" | "CLOSED";
  applications?: any[];
  metrics?: {
    totalWorkersNeeded: number;
    applicationsReceived: number;
    workersShortlisted: number;
    workersAccepted: number;
    remainingVacancies: number;
    completionPercentage: number;
  };
  createdAt: string;
}

export interface WorkerAssignmentItem {
  id: string;
  siteId: string;
  workerId: string;
  teamId?: string | null;
  trade: string;
  dailyWage: number;
  startDate: string;
  endDate?: string | null;
  status: "ACTIVE" | "ON_LEAVE" | "RELEASED" | "TRANSFERRED";
  worker: {
    id: string;
    name: string;
    phone: string;
    avatar?: string | null;
    workerProfile?: {
      category: string;
      experienceYears: number;
      rating: number;
    } | null;
  };
  site?: {
    id: string;
    name: string;
    siteCode: string;
  };
  team?: {
    id: string;
    name: string;
  } | null;
}

export interface SupervisorItem {
  id: string;
  contractorId: string;
  name: string;
  phone: string;
  email?: string | null;
  role: string;
  responsibilities?: string | null;
  status: string;
  siteAssignments?: Array<{
    id: string;
    siteId: string;
    role: string;
    site: {
      id: string;
      name: string;
      siteCode: string;
      project?: { name: string };
    };
  }>;
  createdAt: string;
}

export interface AttendanceRecordItem {
  id: string;
  siteId: string;
  workerId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "OVERTIME";
  shift: string;
  hoursWorked: number;
  overtimeHours: number;
  markedBy?: string | null;
  notes?: string | null;
  worker?: {
    id: string;
    name: string;
    phone: string;
  };
}

export interface DailyWorkReportItem {
  id: string;
  siteId: string;
  reportDate: string;
  progressPercentage: number;
  workforcePresent: number;
  completedWork: string;
  issuesEncountered?: string | null;
  weatherCondition?: string | null;
  photos: string[];
  submittedBy?: string | null;
  site?: {
    id: string;
    name: string;
    siteCode: string;
    project?: { name: string };
  };
  createdAt: string;
}

export interface GstInvoiceItem {
  id: string;
  contractorId: string;
  projectId?: string | null;
  invoiceNumber: string;
  invoiceDate: string;
  placeOfSupply: string;
  supplierName: string;
  supplierGstin?: string | null;
  supplierAddress: string;
  supplierState: string;
  recipientName: string;
  recipientGstin?: string | null;
  recipientAddress: string;
  recipientState: string;
  sacCode: string;
  taxableAmount: number;
  taxType: "INTRA_STATE" | "INTER_STATE";
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  grandTotal: number;
  paidAmount: number;
  paymentStatus: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
  paymentDueDate?: string | null;
  notes?: string | null;
  items: Array<{
    description: string;
    hsnCode: string;
    quantity: number;
    unitRate: number;
    amount: number;
  }>;
  project?: {
    id: string;
    name: string;
    projectCode: string;
  } | null;
  createdAt: string;
}

// 1. Contractor Dashboard & Profile
export async function fetchContractorDashboard(): Promise<ContractorDashboardData> {
  const res = await fetch(`${API_BASE_URL}/contractor/dashboard`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch contractor dashboard");
  }
  return json.data;
}

export async function fetchContractorProfile(): Promise<ContractorProfileData> {
  const res = await fetch(`${API_BASE_URL}/contractor/profile`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch contractor profile");
  }
  return json.data;
}

export async function updateContractorProfile(data: Partial<ContractorProfileData>): Promise<ContractorProfileData> {
  const res = await fetch(`${API_BASE_URL}/contractor/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to update contractor profile");
  }
  return json.data;
}

// 2. Commercial Projects
export async function fetchContractorProjects(filters?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<CommercialProject[]> {
  const url = new URL(`${API_BASE_URL}/contractor/projects`);
  if (filters?.status && filters.status !== "ALL") url.searchParams.set("status", filters.status);
  if (filters?.category && filters.category !== "ALL") url.searchParams.set("category", filters.category);
  if (filters?.search?.trim()) url.searchParams.set("search", filters.search.trim());

  const res = await fetch(url.toString(), {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch contractor projects");
  }
  return json.data || [];
}

export async function fetchContractorProjectDetails(id: string): Promise<CommercialProject> {
  const res = await fetch(`${API_BASE_URL}/contractor/projects/${id}`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch project details");
  }
  return json.data;
}

export async function createContractorProject(data: any): Promise<CommercialProject> {
  const res = await fetch(`${API_BASE_URL}/contractor/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to create commercial project");
  }
  return json.data;
}

export async function updateContractorProject(id: string, data: any): Promise<CommercialProject> {
  const res = await fetch(`${API_BASE_URL}/contractor/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to update commercial project");
  }
  return json.data;
}

export async function deleteContractorProject(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/contractor/projects/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || "Failed to delete project");
  }
}

// 3. Project Multi-Sites
export async function fetchProjectSites(projectId: string): Promise<CommercialSite[]> {
  const res = await fetch(`${API_BASE_URL}/contractor/projects/${projectId}/sites`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch project sites");
  }
  return json.data || [];
}

export async function createProjectSite(projectId: string, data: any): Promise<CommercialSite> {
  const res = await fetch(`${API_BASE_URL}/contractor/projects/${projectId}/sites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to create construction site");
  }
  return json.data;
}

// 4. Bulk Worker Recruitment
export async function fetchProjectRecruitment(projectId: string): Promise<RecruitmentRequestItem[]> {
  const res = await fetch(`${API_BASE_URL}/contractor/projects/${projectId}/recruitment`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch recruitment requests");
  }
  return json.data || [];
}

export async function createProjectRecruitment(projectId: string, data: any): Promise<RecruitmentRequestItem> {
  const res = await fetch(`${API_BASE_URL}/contractor/projects/${projectId}/recruitment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to launch bulk recruitment drive");
  }
  return json.data;
}

export async function applyWorkerToRecruitment(recruitmentId: string, data: any): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/contractor/recruitment/${recruitmentId}/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to add worker application to recruitment drive");
  }
  return json.data;
}

export async function updateRecruitmentApplicationStatus(applicationId: string, status: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/contractor/recruitment/applications/${applicationId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to update application status");
  }
  return json.data;
}

// 5. Teams & Workforce Allocation
export async function fetchSiteTeams(siteId: string): Promise<SiteTeam[]> {
  const res = await fetch(`${API_BASE_URL}/contractor/sites/${siteId}/teams`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch site teams");
  }
  return json.data || [];
}

export async function createSiteTeam(siteId: string, data: any): Promise<SiteTeam> {
  const res = await fetch(`${API_BASE_URL}/contractor/sites/${siteId}/teams`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to create site team");
  }
  return json.data;
}

export async function fetchSiteWorkers(siteId: string): Promise<WorkerAssignmentItem[]> {
  const res = await fetch(`${API_BASE_URL}/contractor/sites/${siteId}/workers`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch site workers");
  }
  return json.data || [];
}

export async function assignWorkerToSite(siteId: string, data: any): Promise<WorkerAssignmentItem> {
  const res = await fetch(`${API_BASE_URL}/contractor/sites/${siteId}/assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to allocate worker to site");
  }
  return json.data;
}

export async function transferWorkerAssignment(assignmentId: string, data: {
  targetSiteId: string;
  reason?: string;
}): Promise<WorkerAssignmentItem> {
  const res = await fetch(`${API_BASE_URL}/contractor/assignments/${assignmentId}/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to transfer worker between sites");
  }
  return json.data;
}

export async function fetchContractorWorkforce(): Promise<WorkerAssignmentItem[]> {
  const res = await fetch(`${API_BASE_URL}/contractor/workforce`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch contractor workforce");
  }
  return json.data || [];
}

// 6. Supervisors
export async function fetchContractorSupervisors(): Promise<SupervisorItem[]> {
  const res = await fetch(`${API_BASE_URL}/contractor/supervisors`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch supervisors");
  }
  return json.data || [];
}

export async function createContractorSupervisor(data: any): Promise<SupervisorItem> {
  const res = await fetch(`${API_BASE_URL}/contractor/supervisors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to register supervisor");
  }
  return json.data;
}

export async function assignSupervisorToSite(siteId: string, data: any): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/contractor/sites/${siteId}/supervisors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to assign supervisor to site");
  }
  return json.data;
}

// 7. Site Attendance & Daily Reports
export async function markSiteAttendance(siteId: string, data: {
  date: string;
  shift?: string;
  records: Array<{
    workerId: string;
    status: string;
    hoursWorked?: number;
    overtimeHours?: number;
    notes?: string;
  }>;
}): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/contractor/sites/${siteId}/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to record site attendance");
  }
  return json.data;
}

export async function fetchSiteAttendance(siteId: string, params?: {
  date?: string;
  startDate?: string;
  endDate?: string;
}): Promise<AttendanceRecordItem[]> {
  const url = new URL(`${API_BASE_URL}/contractor/sites/${siteId}/attendance`);
  if (params?.date) url.searchParams.set("date", params.date);
  if (params?.startDate) url.searchParams.set("startDate", params.startDate);
  if (params?.endDate) url.searchParams.set("endDate", params.endDate);

  const res = await fetch(url.toString(), {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch attendance records");
  }
  return json.data || [];
}

export async function createDailyWorkReport(siteId: string, data: any): Promise<DailyWorkReportItem> {
  const res = await fetch(`${API_BASE_URL}/contractor/sites/${siteId}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to submit daily work report");
  }
  return json.data;
}

export async function fetchSiteDailyReports(siteId: string): Promise<DailyWorkReportItem[]> {
  const res = await fetch(`${API_BASE_URL}/contractor/sites/${siteId}/reports`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch daily work reports");
  }
  return json.data || [];
}

// 8. B2B GST Invoicing & PDF
export async function createGstInvoice(data: any): Promise<GstInvoiceItem> {
  const res = await fetch(`${API_BASE_URL}/contractor/invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to generate B2B GST invoice");
  }
  return json.data;
}

export async function fetchGstInvoices(params?: {
  status?: string;
  projectId?: string;
}): Promise<GstInvoiceItem[]> {
  const url = new URL(`${API_BASE_URL}/contractor/invoices`);
  if (params?.status && params.status !== "ALL") url.searchParams.set("status", params.status);
  if (params?.projectId && params.projectId !== "ALL") url.searchParams.set("projectId", params.projectId);

  const res = await fetch(url.toString(), {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch invoices");
  }
  return json.data || [];
}

export async function fetchGstInvoiceDetails(id: string): Promise<GstInvoiceItem> {
  const res = await fetch(`${API_BASE_URL}/contractor/invoices/${id}`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch invoice details");
  }
  return json.data;
}

export async function updateGstInvoicePaymentStatus(id: string, data: {
  paymentStatus: string;
  paidAmount?: number;
}): Promise<GstInvoiceItem> {
  const res = await fetch(`${API_BASE_URL}/contractor/invoices/${id}/payment-status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to update payment status");
  }
  return json.data;
}

export async function downloadGstInvoicePdf(id: string, invoiceNumber: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/contractor/invoices/${id}/pdf`, {
    credentials: "include",
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || "Failed to download GST invoice PDF");
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invoiceNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// ==========================================
// Phase 8 Stage 2: Conversations & Messaging
// ==========================================

export interface ConversationParticipant {
  id: string;
  name: string;
  phone: string;
  avatar?: string | null;
  role: string;
}

export interface ConversationMemberItem {
  id: string;
  conversationId: string;
  userId: string;
  lastReadAt?: string | null;
  joinedAt: string;
  user: ConversationParticipant;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: string;
  status: string;
  isRead: boolean;
  clientMessageId?: string | null;
  readAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string | null;
    role: string;
  };
}

export interface ConversationItem {
  id: string;
  title?: string | null;
  bookingId?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
  members: ConversationMemberItem[];
  otherMember?: ConversationParticipant | null;
  booking?: {
    id: string;
    bookingNumber: string;
    serviceCategory: string;
    status: string;
    startDate: string;
    totalAmount?: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchConversations(): Promise<ConversationItem[]> {
  const res = await fetch(`${API_BASE_URL}/conversations`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch conversations");
  }
  return json.data || [];
}

export async function fetchConversationById(id: string): Promise<ConversationItem> {
  const res = await fetch(`${API_BASE_URL}/conversations/${id}`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch conversation details");
  }
  return json.data;
}

export async function createOrGetConversation(data: {
  bookingId?: string;
  targetUserId?: string;
  title?: string;
}): Promise<ConversationItem> {
  const res = await fetch(`${API_BASE_URL}/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to initiate conversation");
  }
  return json.data;
}

export async function fetchMessages(
  conversationId: string,
  page = 1,
  limit = 40
): Promise<{ messages: MessageItem[]; pagination: any }> {
  const res = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch messages");
  }
  return json.data;
}

export async function sendChatMessage(
  conversationId: string,
  content: string,
  clientMessageId?: string
): Promise<MessageItem> {
  const res = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content, clientMessageId }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to send message");
  }
  return json.data;
}

export async function markConversationAsRead(conversationId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/conversations/${conversationId}/read`, {
    method: "PATCH",
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to mark conversation read");
  }
}

// ========================================================
// PHASE 9: RAZORPAY PAYMENT SYSTEM (TEST MODE) API CLIENT
// ========================================================

export interface PaymentEventRecord {
  id: string;
  paymentId?: string | null;
  eventId?: string | null;
  eventType: string;
  source: string;
  payload?: any;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  bookingId?: string | null;
  userId: string;
  workerId?: string | null;
  amount: number;
  amountPaise: number;
  platformFee: number;
  taxAmount: number;
  currency: string;
  receiptNumber?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  paymentMethod?: string | null;
  paymentMode: "TEST" | "SANDBOX" | string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
  failureCode?: string | null;
  failureReason?: string | null;
  verifiedAt?: string | null;
  refundId?: string | null;
  refundAmount?: number | null;
  refundReason?: string | null;
  refundedAt?: string | null;
  notes?: any;
  createdAt: string;
  updatedAt: string;
  booking?: Booking | null;
  events?: PaymentEventRecord[];
}

export interface PaymentCheckoutOrderResponse {
  payment: PaymentRecord;
  checkout: {
    keyId: string;
    orderId: string;
    amount: number; // in paise
    amountInr: number;
    currency: string;
    name: string;
    description: string;
    receipt: string;
    mode: "TEST" | "SANDBOX";
    isSandbox: boolean;
    isTestMode: boolean;
    prefill: {
      name: string;
      email: string;
      contact: string;
    };
    theme: {
      color: string;
    };
  };
}

export interface PaymentSummaryStats {
  totalPaidAmount: number;
  pendingAmount: number;
  totalRefundedAmount: number;
  successfulCount: number;
  pendingCount: number;
  failedCount: number;
  refundedCount: number;
  totalTransactions: number;
  currency: string;
}

export async function fetchPaymentConfig(): Promise<{
  keyId: string;
  mode: "TEST" | "SANDBOX";
  isSandbox: boolean;
  isTestMode: boolean;
  currency: string;
  currencySymbol: string;
  testModeBanner: string;
}> {
  const res = await fetch(`${API_BASE_URL}/payments/config`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to load payment configuration");
  }
  return json.data;
}

export async function createRazorpayOrder(bookingId: string): Promise<PaymentCheckoutOrderResponse> {
  const res = await fetch(`${API_BASE_URL}/payments/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ bookingId }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to create Razorpay order");
  }
  return json.data;
}

export async function authorizeSandboxCheckout(
  razorpayOrderId: string,
  paymentMethod = "UPI"
): Promise<{
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  paymentMethod: string;
  mode: string;
}> {
  const res = await fetch(`${API_BASE_URL}/payments/sandbox/authorize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ razorpay_order_id: razorpayOrderId, paymentMethod }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to authorize sandbox payment");
  }
  return json.data;
}

export async function verifyRazorpayPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  paymentMethod?: string;
}): Promise<{
  payment: PaymentRecord;
  booking: Booking | null;
  invoice: Invoice | null;
  alreadyVerified: boolean;
}> {
  const res = await fetch(`${API_BASE_URL}/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Payment verification failed");
  }
  return json.data;
}

export async function recordPaymentFailure(payload: {
  razorpay_order_id: string;
  failureCode?: string;
  failureReason?: string;
}): Promise<PaymentRecord> {
  const res = await fetch(`${API_BASE_URL}/payments/fail`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to record payment failure");
  }
  return json.data;
}

export async function fetchPaymentsHistory(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{
  payments: PaymentRecord[];
  summary: PaymentSummaryStats;
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalResults: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "ALL") query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const res = await fetch(`${API_BASE_URL}/payments?${query.toString()}`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to load payments history");
  }
  return json.data;
}

export async function fetchPaymentDetail(paymentId: string): Promise<PaymentRecord> {
  const res = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to load payment details");
  }
  return json.data;
}

export async function initiatePaymentRefund(
  paymentId: string,
  payload?: { amount?: number; reason?: string }
): Promise<PaymentRecord> {
  const res = await fetch(`${API_BASE_URL}/payments/${paymentId}/refund`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload || {}),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to process refund");
  }
  return json.data;
}





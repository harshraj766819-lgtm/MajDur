export type UserRole = "CUSTOMER" | "WORKER" | "CONTRACTOR" | "ADMIN";

export interface UserSummary {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  role: UserRole;
  isPhoneVerified: boolean;
  avatar?: string | null;
}

export interface WorkerCardData {
  id: string;
  name: string;
  avatar?: string | null;
  category: string;
  experienceYears: number;
  dailyRate: number;
  hourlyRate?: number | null;
  locationCity: string;
  locationState: string;
  rating: number;
  totalReviews: number;
  completedJobs: number;
  isVerified: boolean;
  isAvailable: boolean;
  skills: string[];
}

export interface JobCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  activeWorkers: number;
  baseDailyRate: number;
}

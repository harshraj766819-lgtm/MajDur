"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Hammer, 
  ArrowLeft, 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  Calendar, 
  Loader2, 
  ExternalLink 
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { fetchReviewsList, fetchCustomerBookings, ReviewItem, Booking } from "@/lib/api";

export default function CustomerReviewsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [reviews, setReviews] = React.useState<ReviewItem[]>([]);
  const [completedBookings, setCompletedBookings] = React.useState<Booking[]>([]);
  const [dataLoading, setDataLoading] = React.useState(true);

  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/customer/reviews");
      } else if (user.role !== "CUSTOMER" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      }
    }
  }, [user, loading, router]);

  const loadData = React.useCallback(async () => {
    if (!user) return;
    try {
      setDataLoading(true);
      const [revs, bData] = await Promise.all([
        fetchReviewsList({ customerId: user.id }),
        fetchCustomerBookings({ status: "COMPLETED", limit: 50 }),
      ]);
      setReviews(revs || []);
      setCompletedBookings(bData.bookings || []);
    } catch (err) {
      console.error("Error loading reviews:", err);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-xs">Loading your reviews &amp; ratings...</p>
      </div>
    );
  }

  // Find completed bookings that haven't been reviewed yet
  const reviewedBookingIds = new Set(reviews.map((r) => r.bookingId));
  const unreviewedBookings = completedBookings.filter((b) => !reviewedBookingIds.has(b.id));

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/customer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Artisan Ratings &amp; Reviews</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Genuine customer ratings submitted for fulfilled labour and trade contracts
          </p>
        </div>

        {/* Pending Reviews Callout */}
        {unreviewedBookings.length > 0 && (
          <div className="bg-[#18150c] border border-amber-500/30 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Star className="h-4 w-4 fill-amber-400" />
              <span>Pending Reviews ({unreviewedBookings.length})</span>
            </div>
            <p className="text-xs text-zinc-300">
              You have completed bookings awaiting your rating. Help your artisan get discovered by future clients!
            </p>
            <div className="space-y-2 pt-1">
              {unreviewedBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-between"
                >
                  <div className="text-xs">
                    <span className="font-bold text-white">{b.worker?.name}</span>
                    <span className="text-zinc-500 mx-2">•</span>
                    <span className="text-[#D4AF37]">{b.serviceCategory}</span>
                    <span className="text-zinc-500 text-[10px] ml-2 font-mono">({b.bookingNumber})</span>
                  </div>
                  <Link href={`/dashboard/customer/bookings/${b.id}`}>
                    <Button variant="primary" size="sm" className="bg-[#D4AF37] text-black font-bold text-xs">
                      Rate Now
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Given */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">Your Published Reviews ({reviews.length})</h2>

          {reviews.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-[#2b2b2b] bg-[#111111]">
              <MessageSquare className="mx-auto h-10 w-10 text-zinc-600 mb-2" />
              <h3 className="text-sm font-bold text-white">No Reviews Published Yet</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Once a booked worker finishes your task, you will be invited to leave a star rating and written feedback here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-[#141414] border border-[#272727] rounded-2xl p-5 sm:p-6 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-white">
                        Review for {r.targetUser?.name || "Worker"}
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        {r.booking?.serviceCategory} • Ref: {r.booking?.bookingNumber}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < r.rating ? "text-amber-400 fill-amber-400" : "text-zinc-700"
                          }`}
                        />
                      ))}
                      <span className="text-xs font-bold text-amber-400 ml-1.5">{r.rating}/5 Stars</span>
                    </div>
                  </div>

                  {r.comment && (
                    <p className="text-xs text-zinc-300 italic pt-1 leading-relaxed">
                      &quot;{r.comment}&quot;
                    </p>
                  )}

                  <div className="pt-2 border-t border-[#222222] flex items-center justify-between text-[10px] text-zinc-500">
                    <span>Published on {new Date(r.createdAt).toLocaleDateString("en-IN")}</span>
                    <Link
                      href={`/workers/${r.targetUserId}`}
                      className="text-[#D4AF37] hover:underline flex items-center gap-1 font-semibold"
                    >
                      View Worker Profile
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}


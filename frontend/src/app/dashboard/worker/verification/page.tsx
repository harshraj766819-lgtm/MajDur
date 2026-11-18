"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Upload, 
  Sparkles,
  Lock,
  ExternalLink
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { fetchWorkerVerification, submitWorkerVerification } from "@/lib/api";

export default function WorkerVerificationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [isVerified, setIsVerified] = React.useState(false);
  const [latestRequest, setLatestRequest] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Form states
  const [idType, setIdType] = React.useState("Aadhaar");
  const [idNumber, setIdNumber] = React.useState("");
  const [documentUrl, setDocumentUrl] = React.useState("");

  const loadVerification = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWorkerVerification();
      setIsVerified(res.isVerified);
      setLatestRequest(res.latestRequest);
      if (res.latestRequest) {
        setIdType(res.latestRequest.idType || "Aadhaar");
        setIdNumber(res.latestRequest.idNumber || "");
        setDocumentUrl(res.latestRequest.documentUrl || "");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load verification status");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/worker/verification");
      } else if (user.role !== "WORKER" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      } else {
        loadVerification();
      }
    }
  }, [user, authLoading, router, loadVerification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      if (!idType || !documentUrl.trim()) {
        throw new Error("Document Type and Document URL are required.");
      }

      await submitWorkerVerification({
        idType,
        idNumber: idNumber.trim() || undefined,
        documentUrl: documentUrl.trim(),
      });

      setSuccess("Your identity verification documents have been submitted for review!");
      await loadVerification();
    } catch (err: any) {
      setError(err.message || "Failed to submit verification");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Checking KYC Verification Records...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
            <Link href="/dashboard/worker" className="hover:text-[#D4AF37]">Dashboard</Link>
            <span>/</span>
            <span className="text-white">KYC Verification</span>
          </div>
          <h1 className="text-2xl font-black text-white">Identity & Trade Certification (KYC)</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Build unshakeable trust with customers by verifying your official government credentials.
          </p>
        </div>

        {error && <Alert variant="destructive" title="Error">{error}</Alert>}
        {success && <Alert variant="success" title="Success">{success}</Alert>}

        {/* Verification Status Card */}
        <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isVerified
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : latestRequest?.status === "PENDING"
            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
            : "bg-[#141414] border-[#222] text-zinc-300"
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${
              isVerified ? "bg-emerald-500/20 text-emerald-400" :
              latestRequest?.status === "PENDING" ? "bg-amber-500/20 text-amber-400" :
              "bg-zinc-800 text-zinc-400"
            }`}>
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  {isVerified ? "Verified Artisan Badge Granted" :
                   latestRequest?.status === "PENDING" ? "Verification In Review" :
                   "Unverified Account"}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isVerified ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                  latestRequest?.status === "PENDING" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                  "bg-zinc-800 text-zinc-400"
                }`}>
                  {isVerified ? "APPROVED" : latestRequest?.status || "NOT SUBMITTED"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                {isVerified
                  ? "Your account displays the green Verified Worker badge on search cards and worker profile drawers."
                  : latestRequest?.status === "PENDING"
                  ? "Our administrative compliance team is reviewing your uploaded documents. Approval takes 12–24 business hours."
                  : "Submit your government ID proof to unlock premium contractor recruitment and boost hiring conversion by 300%."}
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-[#141414] border border-[#222]">
            <Sparkles className="h-5 w-5 text-[#D4AF37] mb-2" />
            <h4 className="font-bold text-white mb-0.5">Top Search Placement</h4>
            <p className="text-zinc-400">Verified workers are ranked at the top of client search results by default.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#141414] border border-[#222]">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 mb-2" />
            <h4 className="font-bold text-white mb-0.5">Verified Badge</h4>
            <p className="text-zinc-400">Clients prefer booking workers with verified identity to protect their sites.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#141414] border border-[#222]">
            <Lock className="h-5 w-5 text-blue-400 mb-2" />
            <h4 className="font-bold text-white mb-0.5">High Budget Projects</h4>
            <p className="text-zinc-400">Access commercial and large residential jobs posted by registered contractors.</p>
          </div>
        </div>

        {/* Document Submission Form */}
        <Card className="bg-[#141414] border-[#222]">
          <CardHeader>
            <CardTitle className="text-base text-white">
              {latestRequest ? "Update Document Submission" : "Submit Identity Documents"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Government Document Type *
                  </label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="Voter ID">Voter ID Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="Trade License">Government Trade Certificate / ITI License</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Document Number (e.g. 12-digit Aadhaar / Voter ID No.)
                  </label>
                  <Input
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="e.g. 1234-5678-9012"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Secure Document URL or Scanned Copy Path *
                </label>
                <Input
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  placeholder="e.g. https://storage.majdur.in/kyc/my_document.pdf"
                  required
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Encrypted and stored securely. Accessible only by authorized MajDur compliance verifiers.
                </span>
              </div>

              {latestRequest?.reviewNotes && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                  <span className="font-bold block">Previous Reviewer Notes:</span>
                  {latestRequest.reviewNotes}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <Link href="/dashboard/worker">
                  <Button type="button" variant="outline">Back to Dashboard</Button>
                </Link>
                <Button type="submit" disabled={submitting} className="font-bold">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Upload className="h-4 w-4 mr-1.5" />}
                  Submit Documents for Review
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}


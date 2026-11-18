"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Settings, 
  Lock, 
  User, 
  Bell, 
  ShieldCheck, 
  Loader2, 
  Check, 
  AlertCircle 
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { changeCustomerPassword } from "@/lib/api";

export default function WorkerSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [changing, setChanging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/worker/settings");
      } else if (user.role !== "WORKER" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      }
    }
  }, [user, authLoading, router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setChanging(true);
      setError(null);
      setSuccess(null);

      if (newPassword !== confirmPassword) {
        throw new Error("New password and confirm password do not match.");
      }
      if (newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters long.");
      }

      await changeCustomerPassword({ currentPassword, newPassword });
      setSuccess("Your account password was updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setChanging(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
            <Link href="/dashboard/worker" className="hover:text-[#D4AF37]">Dashboard</Link>
            <span>/</span>
            <span className="text-white">Account Settings</span>
          </div>
          <h1 className="text-2xl font-black text-white">Security & Preferences</h1>
        </div>

        {error && <Alert variant="destructive" title="Error">{error}</Alert>}
        {success && <Alert variant="success" title="Success">{success}</Alert>}

        {/* Change Password Card */}
        <Card className="bg-[#141414] border-[#222]">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#D4AF37]" /> Change Account Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Current Password *</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">New Password (Min. 8 characters) *</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Confirm New Password *</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={changing} className="font-bold text-xs">
                {changing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Details & Logout Card */}
        <Card className="bg-[#141414] border-[#222]">
          <CardHeader>
            <CardTitle className="text-base text-white">Worker Account Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-[#222]">
              <div>
                <p className="font-bold text-white">Full Profile Management</p>
                <p className="text-zinc-400">Edit legal name, bio, trade specializations, and service locations</p>
              </div>
              <Link href="/dashboard/worker/profile">
                <Button variant="outline" size="sm" className="text-xs border-[#333]">Edit Profile</Button>
              </Link>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#222]">
              <div>
                <p className="font-bold text-white">KYC Verification Status</p>
                <p className="text-zinc-400">Manage uploaded Aadhaar, Voter ID, or trade certificates</p>
              </div>
              <Link href="/dashboard/worker/verification">
                <Button variant="outline" size="sm" className="text-xs border-[#333]">View KYC</Button>
              </Link>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-bold text-rose-400">Sign Out</p>
                <p className="text-zinc-400">Terminate current session on this device</p>
              </div>
              <Button 
                onClick={logout} 
                variant="outline" 
                size="sm" 
                className="text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
              >
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}


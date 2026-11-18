"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Hammer, 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Lock, 
  PlusCircle, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Save, 
  ShieldCheck, 
  Building 
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  fetchCustomerProfile, 
  updateCustomerProfile, 
  changeCustomerPassword, 
  createCustomerAddress, 
  deleteCustomerAddress, 
  Address 
} from "@/lib/api";

export default function CustomerProfilePage() {
  const router = useRouter();
  const { user, loading, refreshUser } = useAuth();

  const [profileData, setProfileData] = React.useState<any>(null);
  const [addresses, setAddresses] = React.useState<Address[]>([]);
  const [dataLoading, setDataLoading] = React.useState(true);

  // Edit profile form state
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [alternatePhone, setAlternatePhone] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("Delhi");
  const [pincode, setPincode] = React.useState("");
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [profileSuccess, setProfileSuccess] = React.useState<string | null>(null);
  const [profileError, setProfileError] = React.useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isChangingPass, setIsChangingPass] = React.useState(false);
  const [passwordSuccess, setPasswordSuccess] = React.useState<string | null>(null);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  // New address state
  const [showAddAddress, setShowAddAddress] = React.useState(false);
  const [addrTitle, setAddrTitle] = React.useState("Home");
  const [addrLine1, setAddrLine1] = React.useState("");
  const [addrLine2, setAddrLine2] = React.useState("");
  const [addrArea, setAddrArea] = React.useState("");
  const [addrCity, setAddrCity] = React.useState("");
  const [addrState, setAddrState] = React.useState("Delhi");
  const [addrPincode, setAddrPincode] = React.useState("");
  const [addrDefault, setAddrDefault] = React.useState(false);
  const [isAddingAddr, setIsAddingAddr] = React.useState(false);
  const [addrError, setAddrError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/customer/profile");
      } else if (user.role !== "CUSTOMER" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      }
    }
  }, [user, loading, router]);

  const loadData = React.useCallback(async () => {
    try {
      setDataLoading(true);
      const data = await fetchCustomerProfile();
      setProfileData(data);
      setName(data.name || "");
      setEmail(data.email || "");
      setAddresses(data.addresses || []);
      if (data.customerProfile) {
        setAlternatePhone(data.customerProfile.alternatePhone || "");
        setCity(data.customerProfile.city || "");
        setState(data.customerProfile.state || "Delhi");
        setPincode(data.customerProfile.pincode || "");
        setAddrCity(data.customerProfile.city || "");
      }
    } catch (err: any) {
      console.error("Error loading profile:", err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    try {
      setIsSavingProfile(true);
      await updateCustomerProfile({
        name,
        email: email || undefined,
        alternatePhone,
        city,
        state,
        pincode,
      });
      setProfileSuccess("Personal profile updated successfully!");
      await refreshUser();
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    try {
      setIsChangingPass(true);
      await changeCustomerPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password");
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddrError(null);

    if (!addrLine1 || !addrCity || !addrPincode) {
      setAddrError("Address line 1, city, and PIN code are required.");
      return;
    }

    try {
      setIsAddingAddr(true);
      await createCustomerAddress({
        title: addrTitle,
        line1: addrLine1,
        line2: addrLine2 || undefined,
        area: addrArea || undefined,
        city: addrCity,
        state: addrState,
        pincode: addrPincode,
        isDefault: addrDefault,
      });
      setShowAddAddress(false);
      setAddrLine1("");
      setAddrLine2("");
      setAddrArea("");
      setAddrPincode("");
      loadData();
    } catch (err: any) {
      setAddrError(err.message || "Failed to save address");
    } finally {
      setIsAddingAddr(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteCustomerAddress(id);
      loadData();
    } catch (err) {
      console.error("Error deleting address:", err);
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Loading Profile &amp; Settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/customer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 sm:p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-amber-200 text-black flex items-center justify-center font-black text-2xl shadow-lg shadow-[#D4AF37]/20">
              {name.charAt(0) || "U"}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{name}</h1>
              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                <span>+91 {user?.phone}</span>
                {user?.isPhoneVerified && (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified Mobile
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
              Customer Account
            </span>
          </div>
        </div>

        {/* Profile Settings Form */}
        <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Personal Information</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Update your display name, contact email, and primary service location</p>
          </div>

          {profileSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="h-4 w-4" />}
                required
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Alternate Phone (Optional)"
                type="tel"
                placeholder="e.g. 9876543210"
                value={alternatePhone}
                onChange={(e) => setAlternatePhone(e.target.value)}
                leftIcon={<Phone className="h-4 w-4" />}
              />
              <Input
                label="City"
                placeholder="e.g. Delhi NCR"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                leftIcon={<MapPin className="h-4 w-4" />}
              />
              <Input
                label="PIN Code"
                placeholder="e.g. 110001"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSavingProfile}
                className="bg-[#D4AF37] hover:bg-[#c5a028] text-black font-bold"
                leftIcon={isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              >
                {isSavingProfile ? "Saving Changes..." : "Save Profile Details"}
              </Button>
            </div>
          </form>
        </div>

        {/* Address Book Management */}
        <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Saved Service Addresses</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Addresses used for dispatching skilled labour and equipment</p>
            </div>
            <Button
              onClick={() => setShowAddAddress(!showAddAddress)}
              variant="outline"
              size="sm"
              className="border-[#383838] text-zinc-300 hover:text-white"
              leftIcon={<PlusCircle className="h-4 w-4" />}
            >
              {showAddAddress ? "Cancel" : "Add Address"}
            </Button>
          </div>

          {showAddAddress && (
            <form onSubmit={handleAddAddress} className="p-5 rounded-xl bg-[#191919] border border-[#2e2e2e] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">New Address Details</h3>
              
              {addrError && (
                <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-xs">{addrError}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Address Label (e.g. Home, Site Office, Shop)"
                  value={addrTitle}
                  onChange={(e) => setAddrTitle(e.target.value)}
                  required
                />
                <Input
                  label="Area / Landmark"
                  placeholder="e.g. Near Metro Station"
                  value={addrArea}
                  onChange={(e) => setAddrArea(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Address Line 1"
                  placeholder="House/Plot No., Street name"
                  value={addrLine1}
                  onChange={(e) => setAddrLine1(e.target.value)}
                  required
                />
                <Input
                  label="Address Line 2 (Optional)"
                  placeholder="Floor, Building, Wing"
                  value={addrLine2}
                  onChange={(e) => setAddrLine2(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="City"
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  required
                />
                <Input
                  label="State"
                  value={addrState}
                  onChange={(e) => setAddrState(e.target.value)}
                  required
                />
                <Input
                  label="PIN Code"
                  maxLength={6}
                  value={addrPincode}
                  onChange={(e) => setAddrPincode(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="addrDefault"
                  checked={addrDefault}
                  onChange={(e) => setAddrDefault(e.target.checked)}
                  className="rounded border-[#333333] bg-[#1a1a1a] text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <label htmlFor="addrDefault" className="text-xs text-zinc-300 cursor-pointer">
                  Set as default service address
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isAddingAddr}
                className="bg-[#D4AF37] text-black font-bold"
              >
                {isAddingAddr ? "Saving Address..." : "Confirm & Save Address"}
              </Button>
            </form>
          )}

          {addresses.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">
              No saved addresses found. Add one above to speed up booking requests.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-4 rounded-xl bg-[#191919] border border-[#272727] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-white flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-[#D4AF37]" />
                        {addr.title}
                      </span>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {addr.line1}
                      {addr.line2 && `, ${addr.line2}`}
                      {addr.area && `, ${addr.area}`}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {addr.city}, {addr.state} — {addr.pincode}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#252525] flex justify-end">
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Change Password Section */}
        <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Security &amp; Password</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Change your account sign-in password</p>
          </div>

          {passwordSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
            <Input
              label="Current Password"
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              required
            />
            <Input
              label="New Password"
              type="password"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-type new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              required
            />

            <Button
              type="submit"
              variant="outline"
              size="md"
              disabled={isChangingPass}
              className="border-[#383838] text-zinc-300 hover:text-white"
            >
              {isChangingPass ? "Updating Password..." : "Update Password"}
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}


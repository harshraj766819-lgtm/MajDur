"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Loader2, 
  Navigation, 
  AlertCircle,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Alert } from "@/components/ui/alert";
import { 
  fetchWorkerServiceAreas, 
  addWorkerServiceArea, 
  deleteWorkerServiceArea, 
  ServiceAreaItem 
} from "@/lib/api";

export default function WorkerServiceAreasPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [primaryLoc, setPrimaryLoc] = React.useState<any>(null);
  const [areas, setAreas] = React.useState<ServiceAreaItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Add Area Modal
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [city, setCity] = React.useState("");
  const [areaName, setAreaName] = React.useState("");
  const [pincode, setPincode] = React.useState("");
  const [radiusKm, setRadiusKm] = React.useState(25);

  const loadAreas = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWorkerServiceAreas();
      setPrimaryLoc(res.primaryLocation);
      setAreas(res.additionalAreas);
    } catch (err: any) {
      setError(err.message || "Failed to load service areas");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/worker/service-areas");
      } else if (user.role !== "WORKER" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      } else {
        loadAreas();
      }
    }
  }, [user, authLoading, router, loadAreas]);

  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);

      if (!city.trim()) throw new Error("City is required.");
      if (pincode && !/^\d{6}$/.test(pincode.trim())) {
        throw new Error("PIN code must be exactly 6 digits.");
      }

      await addWorkerServiceArea({
        city: city.trim(),
        pincode: pincode ? pincode.trim() : undefined,
        areaName: areaName ? areaName.trim() : undefined,
        radiusKm: Number(radiusKm) || 25,
      });

      setSuccess(`Added ${city} to your operational coverage!`);
      setIsModalOpen(false);
      setCity("");
      setAreaName("");
      setPincode("");
      setRadiusKm(25);
      await loadAreas();
    } catch (err: any) {
      setError(err.message || "Failed to add service area");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, areaCity: string) => {
    if (!confirm(`Are you sure you want to remove ${areaCity} from your coverage?`)) return;
    try {
      setActionLoading(true);
      await deleteWorkerServiceArea(id);
      setSuccess(`Removed ${areaCity} from service areas.`);
      await loadAreas();
    } catch (err: any) {
      setError(err.message || "Failed to delete service area");
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Loading Service Area Configurations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
              <Link href="/dashboard/worker" className="hover:text-[#D4AF37]">Dashboard</Link>
              <span>/</span>
              <span className="text-white">Service Areas</span>
            </div>
            <h1 className="text-2xl font-black text-white">Geographic Service Coverage</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Specify the cities and surrounding zones where you are open to accepting on-site service jobs.
            </p>
          </div>

          <Button onClick={() => setIsModalOpen(true)} className="font-bold text-xs">
            <Plus className="h-4 w-4 mr-1.5" /> Add Additional City
          </Button>
        </div>

        {error && <Alert variant="destructive" title="Error">{error}</Alert>}
        {success && <Alert variant="success" title="Success">{success}</Alert>}

        {/* Primary Base Location Card */}
        <Card className="bg-[#141414] border-[#222]">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-[#D4AF37]" />
                Primary Home Base
              </span>
              <Link href="/dashboard/worker/profile" className="text-xs text-[#D4AF37] hover:underline font-normal">
                Edit Base in Profile →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-[#1a1a1a] rounded-xl border border-[#272727]">
                <p className="text-zinc-500 mb-1">Home City & State</p>
                <p className="text-sm font-bold text-white">{primaryLoc?.city}, {primaryLoc?.state}</p>
              </div>

              <div className="p-3 bg-[#1a1a1a] rounded-xl border border-[#272727]">
                <p className="text-zinc-500 mb-1">Base PIN Code</p>
                <p className="text-sm font-bold text-white font-mono">{primaryLoc?.pincode}</p>
              </div>

              <div className="p-3 bg-[#1a1a1a] rounded-xl border border-[#272727]">
                <p className="text-zinc-500 mb-1">Commute Radius</p>
                <p className="text-sm font-bold text-emerald-400">{primaryLoc?.serviceRadiusKm} KM around base</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Service Areas */}
        <Card className="bg-[#141414] border-[#222]">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center justify-between">
              <span>Extended Operational Cities ({areas.length})</span>
              <span className="text-xs text-zinc-400 font-normal">Additional locations you commute to</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {areas.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">No Additional Coverage Added</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Expand your opportunities by adding neighboring cities or commercial hubs.
                </p>
                <Button onClick={() => setIsModalOpen(true)} size="sm" variant="outline" className="mt-3 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Add Service Area
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {areas.map((a) => (
                  <div key={a.id} className="p-3.5 bg-[#1a1a1a] border border-[#272727] rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-[#D4AF37]" />
                        <h4 className="font-bold text-sm text-white">{a.city}</h4>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {a.areaName ? `${a.areaName}, ` : ""}{a.pincode ? `PIN: ${a.pincode}, ` : ""}{a.radiusKm} km radius
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(a.id, a.city)}
                      className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Remove Area"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add Extended Service Area"
        >
          <form onSubmit={handleAddArea} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">City Name *</label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Noida or Gurugram"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Specific Area (Optional)</label>
                <Input
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder="e.g. Sector 62"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">PIN Code (Optional)</label>
                <Input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 201301"
                  maxLength={6}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Coverage Radius (KM)</label>
              <Input
                type="number"
                min={5}
                max={150}
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading} className="font-bold">
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Add Area
              </Button>
            </div>
          </form>
        </Modal>

      </div>
    </div>
  );
}


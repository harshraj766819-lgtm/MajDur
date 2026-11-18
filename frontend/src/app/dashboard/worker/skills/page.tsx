"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  HardHat, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  Loader2, 
  Sparkles, 
  AlertCircle,
  Layers,
  ChevronLeft
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Alert } from "@/components/ui/alert";
import { 
  fetchWorkerSkillsList, 
  addWorkerSkill, 
  updateWorkerSkillExp, 
  deleteWorkerSkill, 
  WorkerSkillItem 
} from "@/lib/api";

export default function WorkerSkillsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [skills, setSkills] = React.useState<WorkerSkillItem[]>([]);
  const [availableSkills, setAvailableSkills] = React.useState<Array<{ id: string; name: string; categoryId: string; isAdded: boolean }>>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Add Skill Modal
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [selectedSkillId, setSelectedSkillId] = React.useState<string>("");
  const [customSkillName, setCustomSkillName] = React.useState("");
  const [newSkillExp, setNewSkillExp] = React.useState(2);

  // Edit Exp Modal
  const [editingSkill, setEditingSkill] = React.useState<WorkerSkillItem | null>(null);
  const [editExpVal, setEditExpVal] = React.useState(1);

  const loadSkills = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWorkerSkillsList();
      setSkills(res.mySkills);
      setAvailableSkills(res.availableSkills);
    } catch (err: any) {
      setError(err.message || "Failed to load skills matrix");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/worker/skills");
      } else if (user.role !== "WORKER" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      } else {
        loadSkills();
      }
    }
  }, [user, authLoading, router, loadSkills]);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);

      if (!selectedSkillId && !customSkillName.trim()) {
        throw new Error("Please select an available skill or enter a custom skill name.");
      }

      await addWorkerSkill({
        skillId: selectedSkillId || undefined,
        skillName: !selectedSkillId ? customSkillName.trim() : undefined,
        yearsExperience: Number(newSkillExp) || 1,
      });

      setSuccess("Skill added to your professional profile!");
      setIsAddModalOpen(false);
      setSelectedSkillId("");
      setCustomSkillName("");
      setNewSkillExp(2);
      await loadSkills();
    } catch (err: any) {
      setError(err.message || "Failed to add skill");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateExp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSkill) return;
    try {
      setActionLoading(true);
      await updateWorkerSkillExp(editingSkill.id, Number(editExpVal));
      setSuccess(`Experience for ${editingSkill.skill.name} updated to ${editExpVal} years!`);
      setEditingSkill(null);
      await loadSkills();
    } catch (err: any) {
      setError(err.message || "Failed to update skill experience");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, skillName: string) => {
    if (!confirm(`Are you sure you want to remove "${skillName}" from your profile?`)) return;
    try {
      setActionLoading(true);
      await deleteWorkerSkill(id);
      setSuccess(`Removed "${skillName}" from your skills.`);
      await loadSkills();
    } catch (err: any) {
      setError(err.message || "Failed to remove skill");
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Loading Skills Matrix...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
              <Link href="/dashboard/worker" className="hover:text-[#D4AF37]">Dashboard</Link>
              <span>/</span>
              <span className="text-white">Skills Matrix</span>
            </div>
            <h1 className="text-2xl font-black text-white">Verified Skills & Core Trades</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Add your specialized capabilities and years of hands-on experience to match with relevant high-budget jobs.
            </p>
          </div>

          <Button onClick={() => setIsAddModalOpen(true)} className="font-bold text-xs">
            <Plus className="h-4 w-4 mr-1.5" /> Add New Skill
          </Button>
        </div>

        {error && <Alert variant="destructive" title="Error">{error}</Alert>}
        {success && <Alert variant="success" title="Success">{success}</Alert>}

        {/* Current Skills Grid */}
        <Card className="bg-[#141414] border-[#222]">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center justify-between">
              <span>My Active Skills ({skills.length})</span>
              <span className="text-xs text-zinc-400 font-normal">Clients filter workers based on these capabilities</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {skills.length === 0 ? (
              <div className="text-center py-10">
                <HardHat className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white">No Skills Added Yet</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Add specialized skills from our trade catalog or specify your own custom capabilities.
                </p>
                <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="mt-4 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Your First Skill
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {skills.map((s) => (
                  <div key={s.id} className="bg-[#1a1a1a] border border-[#272727] rounded-xl p-3.5 flex flex-col justify-between group hover:border-[#383838] transition-colors">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                        <span>{s.skill.category?.name || "Trade Skill"}</span>
                        <span className="text-emerald-400 font-semibold">{s.yearsExperience} Years Exp.</span>
                      </div>
                      <h4 className="font-bold text-white text-sm">{s.skill.name}</h4>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-[#222] flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSkill(s);
                          setEditExpVal(s.yearsExperience);
                        }}
                        className="text-zinc-400 hover:text-[#D4AF37] flex items-center gap-1 text-[11px]"
                      >
                        <Edit2 className="h-3 w-3" /> Edit Exp
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(s.id, s.skill.name)}
                        className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-[11px]"
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Add From Recommended Skills */}
        {availableSkills.filter((s) => !s.isAdded).length > 0 && (
          <Card className="bg-[#141414] border-[#222]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                Recommended Skills for Your Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {availableSkills.filter((s) => !s.isAdded).slice(0, 10).map((avail) => (
                  <button
                    key={avail.id}
                    type="button"
                    onClick={() => {
                      setSelectedSkillId(avail.id);
                      setIsAddModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] border border-[#272727] text-xs text-zinc-300 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    {avail.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Skill Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add Skill to Profile"
        >
          <form onSubmit={handleAddSkill} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Select Canonical Skill from Database
              </label>
              <select
                value={selectedSkillId}
                onChange={(e) => {
                  setSelectedSkillId(e.target.value);
                  if (e.target.value) setCustomSkillName("");
                }}
                className="w-full bg-[#1c1c1c] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="">-- Choose from available catalog --</option>
                {availableSkills.filter((s) => !s.isAdded).map((as) => (
                  <option key={as.id} value={as.id}>{as.name}</option>
                ))}
              </select>
            </div>

            <div className="text-center text-xs text-zinc-500 font-bold">— OR ENTER CUSTOM SKILL —</div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Custom Skill Name
              </label>
              <Input
                value={customSkillName}
                onChange={(e) => {
                  setCustomSkillName(e.target.value);
                  if (e.target.value) setSelectedSkillId("");
                }}
                placeholder="e.g. Laser Tile Leveling or Solar DC Inverter"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Years of Experience with this skill *
              </label>
              <Input
                type="number"
                min={1}
                max={50}
                value={newSkillExp}
                onChange={(e) => setNewSkillExp(Number(e.target.value))}
                required
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading} className="font-bold">
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Add Skill
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Experience Modal */}
        <Modal
          isOpen={Boolean(editingSkill)}
          onClose={() => setEditingSkill(null)}
          title={`Update Experience: ${editingSkill?.skill.name}`}
        >
          <form onSubmit={handleUpdateExp} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Years of Hands-on Experience
              </label>
              <Input
                type="number"
                min={1}
                max={60}
                value={editExpVal}
                onChange={(e) => setEditExpVal(Number(e.target.value))}
                required
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingSkill(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading} className="font-bold">
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Save Experience
              </Button>
            </div>
          </form>
        </Modal>

      </div>
    </div>
  );
}


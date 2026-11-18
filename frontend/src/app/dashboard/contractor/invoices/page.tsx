"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ReceiptIndianRupee,
  Building2,
  PlusCircle,
  Download,
  CheckCircle2,
  Clock,
  IndianRupee,
  Loader2,
  AlertCircle,
  X,
  FileText,
  Filter,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContractorNav } from "@/components/contractor-nav";
import {
  fetchContractorProfile,
  fetchContractorProjects,
  fetchGstInvoices,
  createGstInvoice,
  updateGstInvoicePaymentStatus,
  downloadGstInvoicePdf,
  ContractorProfileData,
  CommercialProject,
  GstInvoiceItem,
} from "@/lib/api";

function GstInvoicesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preProjectId = searchParams.get("projectId") || "";

  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = React.useState<ContractorProfileData | null>(null);
  const [projects, setProjects] = React.useState<CommercialProject[]>([]);
  const [invoices, setInvoices] = React.useState<GstInvoiceItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = React.useState("ALL");

  // Download state
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  // Create Invoice Modal
  const [showModal, setShowModal] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  // Form State
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>(preProjectId);
  const [recipientName, setRecipientName] = React.useState("");
  const [recipientGstin, setRecipientGstin] = React.useState("");
  const [recipientAddress, setRecipientAddress] = React.useState("");
  const [recipientState, setRecipientState] = React.useState("Delhi");
  const [gstRate, setGstRate] = React.useState<number>(18);
  const [notes, setNotes] = React.useState("Payment due within 15 days of invoice date via RTGS / NEFT.");

  // Line items
  const [items, setItems] = React.useState<
    Array<{ description: string; hsnCode: string; quantity: number; unitRate: number; amount: number }>
  >([
    {
      description: "Skilled Masonry & Civil Workforce Services",
      hsnCode: "9985",
      quantity: 30,
      unitRate: 1500,
      amount: 45000,
    },
  ]);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/contractor/invoices");
      } else if (user.role !== "CONTRACTOR" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      } else {
        loadData();
      }
    }
  }, [user, authLoading, statusFilter, router]);

  async function loadData() {
    try {
      setLoading(true);
      const [prof, projs, invs] = await Promise.all([
        fetchContractorProfile(),
        fetchContractorProjects(),
        fetchGstInvoices({ status: statusFilter }),
      ]);
      setProfile(prof);
      setProjects(projs);
      setInvoices(invs);

      if (preProjectId) {
        const found = projs.find((p) => p.id === preProjectId);
        if (found) {
          setSelectedProjectId(found.id);
          setRecipientName(found.clientName);
          setRecipientAddress(`${found.city}, ${found.state}`);
          setRecipientState(found.state);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleItemChange(idx: number, field: string, val: any) {
    const updated = [...items];
    const item = { ...updated[idx], [field]: val };
    if (field === "quantity" || field === "unitRate") {
      item.amount = (Number(item.quantity) || 0) * (Number(item.unitRate) || 0);
    }
    updated[idx] = item;
    setItems(updated);
  }

  function addItem() {
    setItems([
      ...items,
      {
        description: "Additional Construction Service",
        hsnCode: "9985",
        quantity: 1,
        unitRate: 10000,
        amount: 10000,
      },
    ]);
  }

  function removeItem(idx: number) {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  }

  // Frontend dynamic tax computation preview
  const taxableAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const supplierState = (profile?.state || "Delhi").trim().toLowerCase();
  const currentRecipientState = recipientState.trim().toLowerCase();
  const isIntraState = supplierState === currentRecipientState;

  const cgstRate = isIntraState ? gstRate / 2 : 0;
  const sgstRate = isIntraState ? gstRate / 2 : 0;
  const igstRate = !isIntraState ? gstRate : 0;

  const cgstAmount = isIntraState ? Math.round((taxableAmount * cgstRate) / 100) : 0;
  const sgstAmount = isIntraState ? Math.round((taxableAmount * sgstRate) / 100) : 0;
  const igstAmount = !isIntraState ? Math.round((taxableAmount * igstRate) / 100) : 0;
  const grandTotal = taxableAmount + cgstAmount + sgstAmount + igstAmount;

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!recipientName || taxableAmount <= 0) {
      alert("Please provide recipient details and at least one billable item");
      return;
    }

    try {
      setCreating(true);
      await createGstInvoice({
        projectId: selectedProjectId || null,
        recipientName,
        recipientGstin: recipientGstin || null,
        recipientAddress,
        recipientState,
        taxableAmount,
        gstRate,
        items,
        notes,
      });

      setShowModal(false);
      const invs = await fetchGstInvoices({ status: statusFilter });
      setInvoices(invs);
      alert("Professional B2B GST Invoice generated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to generate invoice");
    } finally {
      setCreating(false);
    }
  }

  async function handleDownload(inv: GstInvoiceItem) {
    try {
      setDownloadingId(inv.id);
      await downloadGstInvoicePdf(inv.id, inv.invoiceNumber);
    } catch (err: any) {
      alert(err.message || "Failed to download invoice PDF");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleMarkPaid(invId: string) {
    try {
      await updateGstInvoicePaymentStatus(invId, { paymentStatus: "PAID" });
      const invs = await fetchGstInvoices({ status: statusFilter });
      setInvoices(invs);
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  }

  if (authLoading || (loading && invoices.length === 0 && !profile)) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Loading B2B GST Invoicing System...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 pb-16">
      <ContractorNav activeTab="GST Invoices" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <ReceiptIndianRupee className="h-8 w-8 text-[#D4AF37]" /> B2B GST Invoicing & Compliance
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Issue GST-compliant tax invoices with automatic CGST + SGST vs IGST calculation and printable PDF downloads.
            </p>
          </div>

          <Button
            onClick={() => setShowModal(true)}
            variant="default"
            className="bg-[#D4AF37] text-black hover:bg-amber-400 font-bold gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Issue GST Tax Invoice
          </Button>
        </div>

        {/* Filters Bar */}
        <div className="bg-[#141414] border border-[#272727] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <Filter className="h-4 w-4" />
            <span>Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none"
            >
              <option value="ALL">All Invoices</option>
              <option value="PENDING">Pending Payment</option>
              <option value="PARTIAL">Partial Payment</option>
              <option value="PAID">Fully Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-zinc-400">
              Contractor State: <strong className="text-amber-300">{profile?.state || "Delhi"}</strong>
            </span>
            <span className="text-zinc-400">
              GSTIN: <strong className="font-mono text-zinc-200">{profile?.gstNumber || profile?.gstin || "N/A"}</strong>
            </span>
          </div>
        </div>

        {/* Invoices List Table */}
        <div className="bg-[#141414] border border-[#272727] rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ReceiptIndianRupee className="h-5 w-5 text-[#D4AF37]" /> All Issued Tax Invoices ({invoices.length})
          </h2>

          {invoices.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No tax invoices issued yet. Click &quot;Issue GST Tax Invoice&quot; to generate your first bill.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-zinc-400 border-b border-zinc-800">
                    <th className="pb-3 font-semibold">Invoice Number</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Client / Recipient</th>
                    <th className="pb-3 font-semibold">Tax Jurisdiction</th>
                    <th className="pb-3 font-semibold">Taxable Amount</th>
                    <th className="pb-3 font-semibold">Taxes</th>
                    <th className="pb-3 font-semibold">Grand Total</th>
                    <th className="pb-3 font-semibold">Payment Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-zinc-900/40">
                      <td className="py-3.5 font-mono font-bold text-[#D4AF37]">{inv.invoiceNumber}</td>
                      <td className="py-3.5 text-zinc-400">
                        {new Date(inv.invoiceDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3.5 font-medium text-white">
                        {inv.recipientName}
                        {inv.recipientGstin && (
                          <span className="block text-[10px] font-mono text-zinc-500">
                            GSTIN: {inv.recipientGstin}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.taxType === "INTRA_STATE"
                              ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                              : "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                          }`}
                        >
                          {inv.taxType === "INTRA_STATE" ? "CGST + SGST" : "IGST"}
                        </span>
                      </td>
                      <td className="py-3.5 text-zinc-300">
                        ₹{Number(inv.taxableAmount).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 text-xs text-zinc-400">
                        {inv.taxType === "INTRA_STATE" ? (
                          <span>
                            CGST: ₹{inv.cgstAmount} | SGST: ₹{inv.sgstAmount}
                          </span>
                        ) : (
                          <span>IGST: ₹{inv.igstAmount}</span>
                        )}
                      </td>
                      <td className="py-3.5 font-black text-white">
                        ₹{Number(inv.grandTotal).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.paymentStatus === "PAID"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 text-right space-x-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={downloadingId === inv.id}
                          onClick={() => handleDownload(inv)}
                          className="h-7 px-2 text-[#D4AF37] hover:text-amber-200 hover:bg-zinc-800 gap-1 text-xs"
                        >
                          {downloadingId === inv.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                          PDF
                        </Button>

                        {inv.paymentStatus !== "PAID" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkPaid(inv.id)}
                            className="h-7 px-2 text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          >
                            Mark Paid
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Generate GST Tax Invoice */}
        {showModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#181818] border border-[#2a2a2a] rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ReceiptIndianRupee className="h-5 w-5 text-[#D4AF37]" /> Generate B2B GST Tax Invoice
                </h3>
                <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
                {/* Linked Project */}
                <div className="space-y-1">
                  <label className="text-zinc-300 font-semibold">Linked Project (Optional)</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedProjectId(id);
                      const found = projects.find((p) => p.id === id);
                      if (found) {
                        setRecipientName(found.clientName);
                        setRecipientAddress(`${found.city}, ${found.state}`);
                        setRecipientState(found.state);
                      }
                    }}
                    className="w-full h-9 px-2 rounded-md bg-zinc-900 border border-zinc-700 text-white text-xs"
                  >
                    <option value="">-- No Direct Project Link --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.projectCode} — {p.name} ({p.clientName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Recipient Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-zinc-300 font-semibold">
                      Client / Recipient Name <span className="text-rose-400">*</span>
                    </label>
                    <Input
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Delhi Metro Rail Corp Ltd"
                      required
                      className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-300 font-semibold">Recipient GSTIN (Optional if Unregistered)</label>
                    <Input
                      value={recipientGstin}
                      onChange={(e) => setRecipientGstin(e.target.value.toUpperCase())}
                      placeholder="e.g. 07AAACD1234D1Z8"
                      className="bg-zinc-900 border-zinc-700 text-white font-mono uppercase text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-300 font-semibold">Client Address</label>
                    <Input
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      placeholder="Metro Bhawan, Barakhamba Road, New Delhi"
                      required
                      className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-300 font-semibold">
                      Recipient State (Jurisdiction) <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={recipientState}
                      onChange={(e) => setRecipientState(e.target.value)}
                      className="w-full h-9 px-2 rounded-md bg-zinc-900 border border-zinc-700 text-white text-xs"
                    >
                      <option value="Delhi">Delhi</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Haryana">Haryana</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="West Bengal">West Bengal</option>
                    </select>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-200 font-bold">Line Items & Services</label>
                    <Button type="button" size="sm" variant="ghost" onClick={addItem} className="h-7 text-xs text-[#D4AF37]">
                      + Add Item
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {items.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-zinc-900/60 p-2 rounded-xl border border-zinc-800">
                        <div className="col-span-5">
                          <Input
                            value={it.description}
                            onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                            placeholder="Description"
                            required
                            className="bg-zinc-900 border-zinc-700 text-white text-xs h-8"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={it.quantity}
                            onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                            placeholder="Qty"
                            min={1}
                            required
                            className="bg-zinc-900 border-zinc-700 text-white text-xs h-8"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={it.unitRate}
                            onChange={(e) => handleItemChange(idx, "unitRate", e.target.value)}
                            placeholder="Rate (₹)"
                            min={1}
                            required
                            className="bg-zinc-900 border-zinc-700 text-white text-xs h-8"
                          />
                        </div>
                        <div className="col-span-2 text-right font-bold text-white">
                          ₹{it.amount.toLocaleString("en-IN")}
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            disabled={items.length <= 1}
                            className="text-zinc-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* GST Rate Selector & Live Computation */}
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-300">GST Slab Rate:</span>
                    <select
                      value={gstRate}
                      onChange={(e) => setGstRate(Number(e.target.value))}
                      className="h-8 px-2 rounded bg-zinc-800 border border-zinc-700 text-white text-xs font-bold"
                    >
                      <option value={5}>5% GST</option>
                      <option value={12}>12% GST</option>
                      <option value={18}>18% GST (Standard Services)</option>
                      <option value={28}>28% GST</option>
                    </select>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 space-y-1.5 text-xs text-zinc-400">
                    <div className="flex items-center justify-between">
                      <span>Taxable Value:</span>
                      <span className="font-bold text-white">₹{taxableAmount.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="flex items-center justify-between text-[#D4AF37]">
                      <span>
                        Tax Jurisdiction:{" "}
                        <strong>{isIntraState ? "Intra-State (CGST + SGST)" : "Inter-State (IGST)"}</strong>
                      </span>
                      <span>
                        {isIntraState
                          ? `CGST ${cgstRate}% (₹${cgstAmount}) + SGST ${sgstRate}% (₹${sgstAmount})`
                          : `IGST ${igstRate}% (₹${igstAmount})`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-sm font-black text-white">
                      <span>Grand Total:</span>
                      <span className="text-[#D4AF37]">₹{grandTotal.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 font-semibold">Payment Terms & Remarks</label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                    size="sm"
                    variant="default"
                    className="bg-[#D4AF37] text-black font-bold gap-1.5"
                  >
                    {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ReceiptIndianRupee className="h-3.5 w-3.5" />}
                    Issue Invoice
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-[#272727] text-center text-xs text-zinc-500">
          <p>MajDur B2B Workforce & Commercial Contracting Platform • Developed by Harsh Singh</p>
        </div>
      </div>
    </div>
  );
}

export default function GstInvoicesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        </div>
      }
    >
      <GstInvoicesPageContent />
    </React.Suspense>
  );
}


"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useMutation } from "@tanstack/react-query";

export function ManagerBillingPanel() {
  const { authorizedRequest } = useAuth();
  
  // Invoice state
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [invoiceType, setInvoiceType] = useState("MEMBERSHIP");

  // Payment state
  const [invoiceId, setInvoiceId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      return authorizedRequest("/api/v1/billing/invoices", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      alert("Tao hoa don thanh cong!");
      setMemberId("");
      setAmount("");
      setDueDate("");
    },
    onError: (err: any) => {
      alert("Loi tao hoa don: " + err.message);
    }
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return authorizedRequest("/api/v1/billing/payments", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      alert("Ghi nhan thanh toan thanh cong!");
      setInvoiceId("");
      setPaymentAmount("");
    },
    onError: (err: any) => {
      alert("Loi ghi nhan thanh toan: " + err.message);
    }
  });

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    createInvoiceMutation.mutate({ memberId, totalAmount: Number(amount), dueDate, type: invoiceType });
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    recordPaymentMutation.mutate({ invoiceId, amount: Number(paymentAmount), paymentMethod });
  };

  return (
    <div className="space-y-6 mt-6">
      <SurfaceCard title="Create Invoice" description="Tao hoa don moi cho member">
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Member ID</label>
              <input type="text" required value={memberId} onChange={(e) => setMemberId(e.target.value)} className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Amount</label>
              <input type="number" required min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
              <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select value={invoiceType} onChange={(e) => setInvoiceType(e.target.value)} className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white">
                <option value="MEMBERSHIP">Membership</option>
                <option value="PT_PACKAGE">PT Package</option>
                <option value="COURSE">Course</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={createInvoiceMutation.isPending} className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50">
            {createInvoiceMutation.isPending ? "Dang xu ly..." : "Tao Hoa Don"}
          </button>
        </form>
      </SurfaceCard>

      <SurfaceCard title="Record Payment" description="Ghi nhan thanh toan cho hoa don">
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Invoice ID</label>
              <input type="text" required value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount Paid</label>
              <input type="number" required min="0" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white">
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={recordPaymentMutation.isPending} className="inline-flex justify-center rounded-md border border-transparent bg-emerald-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50">
            {recordPaymentMutation.isPending ? "Dang xu ly..." : "Ghi Nhan Thanh Toan"}
          </button>
        </form>
      </SurfaceCard>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useMutation } from "@tanstack/react-query";
import { Receipt, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

type CreateInvoiceInput = {
  memberId: string;
  totalAmount: number;
  dueDate: string;
  type: string;
};

type RecordPaymentInput = {
  invoiceId: string;
  amount: number;
  paymentMethod: string;
};

const inputClass =
  "myfit-input w-full px-4 text-sm text-[var(--black)] bg-white placeholder:text-[var(--gray-500)]";

const selectClass =
  "w-full h-[52px] rounded-xl border-2 border-[var(--gray-100)] bg-white px-4 text-sm text-[var(--black)] outline-none transition focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)] appearance-none";

export function ManagerBillingPanel() {
  const { authorizedRequest } = useAuth();

  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [invoiceType, setInvoiceType] = useState("MEMBERSHIP");

  const [invoiceId, setInvoiceId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: CreateInvoiceInput) => {
      return authorizedRequest("/api/v1/billing/invoices", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success("Tạo hoá đơn thành công!");
      setMemberId("");
      setAmount("");
      setDueDate("");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: RecordPaymentInput) => {
      return authorizedRequest("/api/v1/billing/payments", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success("Ghi nhận thanh toán thành công!");
      setInvoiceId("");
      setPaymentAmount("");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    createInvoiceMutation.mutate({
      memberId,
      totalAmount: Number(amount),
      dueDate,
      type: invoiceType,
    });
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    recordPaymentMutation.mutate({
      invoiceId,
      amount: Number(paymentAmount),
      paymentMethod,
    });
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-500 h-20 rounded-3xl flex items-center gap-4 px-6 shadow-lg">
        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm">
          <Receipt className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white leading-tight">Quản lý Thanh toán</h2>
          <p className="text-violet-100 text-xs font-medium">Tạo hoá đơn & ghi nhận thanh toán hội viên</p>
        </div>
        <div className="ml-auto flex items-center justify-center w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Create invoice section */}
      <SurfaceCard title="Tạo hoá đơn" description="Tạo hoá đơn mới cho hội viên">
        <form onSubmit={handleCreateInvoice} className="space-y-5 pt-1">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--black)]">Mã hội viên</label>
              <input
                type="text"
                required
                placeholder="VD: mem_123"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--black)]">Tổng tiền (VND)</label>
              <input
                type="number"
                required
                min="0"
                placeholder="VD: 500000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--black)]">Hạn thanh toán</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--black)]">Loại hoá đơn</label>
              <select
                value={invoiceType}
                onChange={(e) => setInvoiceType(e.target.value)}
                className={selectClass}
              >
                <option value="MEMBERSHIP">Gói tập</option>
                <option value="PT_PACKAGE">Gói PT</option>
                <option value="COURSE">Khoá học</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={createInvoiceMutation.isPending}
            className="h-12 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm shadow-md hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2"
          >
            {createInvoiceMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Receipt className="w-4 h-4" />
                Tạo hoá đơn
              </>
            )}
          </button>
        </form>
      </SurfaceCard>

      {/* Record payment section */}
      <SurfaceCard title="Ghi nhận thanh toán" description="Ghi nhận thanh toán cho hoá đơn">
        <form onSubmit={handleRecordPayment} className="space-y-5 pt-1">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--black)]">Mã hoá đơn</label>
              <input
                type="text"
                required
                placeholder="VD: inv_456"
                value={invoiceId}
                onChange={(e) => setInvoiceId(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--black)]">Số tiền đã trả (VND)</label>
              <input
                type="number"
                required
                min="0"
                placeholder="VD: 500000"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--black)]">Phương thức</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={selectClass}
              >
                <option value="CASH">Tiền mặt</option>
                <option value="CARD">Thẻ ngân hàng</option>
                <option value="BANK_TRANSFER">Chuyển khoản</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={recordPaymentMutation.isPending}
            className="h-12 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm shadow-md hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2"
          >
            {recordPaymentMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Ghi nhận thanh toán
              </>
            )}
          </button>
        </form>
      </SurfaceCard>
    </div>
  );
}

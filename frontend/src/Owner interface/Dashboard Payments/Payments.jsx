import React, { useMemo, useRef, useState, useEffect } from "react";
import { 
  ChevronDown, CheckCircle2, XCircle, AlertCircle, Clock3, X, 
  Wallet, Hourglass, RotateCcw, TrendingUp, Download, Search, CalendarDays 
} from "lucide-react";

/* =========================
   Helpers
========================= */
const cx = (...c) => c.filter(Boolean).join(" ");

const Wave = ({ opacity = 0.12 }) => (
  <svg
    className="absolute right-0 bottom-0 pointer-events-none"
    width="240"
    height="130"
    viewBox="0 0 240 130"
    fill="none"
    aria-hidden="true"
    style={{ opacity }}
  >
    <path
      d="M0 90C74 52 142 132 240 84V130H0V112C0 102 0 96 0 90Z"
      fill="#ffffff"
    />
  </svg>
);

const useOutside = (refs, onOutside, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e) => {
      const inside = refs.some((r) => r.current && r.current.contains(e.target));
      if (!inside) onOutside?.();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [refs, onOutside, enabled]);
};

const formatEGP = (n) => `EGP ${Number(n || 0).toLocaleString("en-US")}`;

/* =========================
   UI Atoms
========================= */
const StatCard = ({ title, value, className, icon: Icon }) => (
  <div
    className={cx(
      "relative overflow-hidden rounded-2xl px-6 py-5 h-[86px]",
      "shadow-[0_10px_26px_rgba(15,23,42,0.06)]",
      className
    )}
  >
    <Wave opacity={0.12} />
    <div className="relative flex justify-between items-start h-full">
      <div>
        <p className="text-[14px] font-semibold opacity-90">{title}</p>
        <p className="mt-1 text-[20px] font-extrabold">{value}</p>
      </div>
      {Icon && (
        <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
          <Icon size={20} className="opacity-90" />
        </div>
      )}
    </div>
  </div>
);

// تحسين شارة الحالة لتكون بخلفية ملونة لتمييز أسرع
const StatusPill = ({ status }) => {
  const s = (status || "").toLowerCase();
  if (s === "success") return <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md text-[12px] font-bold">Success</span>;
  if (s === "rejected") return <span className="bg-rose-50 text-rose-600 px-2.5 py-1 rounded-md text-[12px] font-bold">Rejected</span>;
  if (s === "pending") return <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md text-[12px] font-bold">Pending</span>;
  return <span className="bg-slate-50 text-slate-500 px-2.5 py-1 rounded-md text-[12px] font-bold">{status}</span>;
};

const StatusIcon = ({ status }) => {
  const s = (status || "").toLowerCase();
  if (s === "success") return <CheckCircle2 className="text-emerald-500" size={16} />;
  if (s === "rejected") return <XCircle className="text-rose-500" size={16} />;
  if (s === "pending") return <Clock3 className="text-blue-500" size={16} />;
  return <AlertCircle className="text-slate-400" size={16} />;
};

const Input = ({ label, placeholder, value, onChange, type = "text", required, icon: Icon }) => (
  <label className="block relative">
    {label && <span className="text-xs font-bold text-slate-700 block mb-2">{label}{required ? " *" : ""}</span>}
    <div className="relative">
      {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          "w-full h-11 rounded-xl bg-white",
          "border border-slate-200 text-sm text-slate-800",
          Icon ? "pl-9 pr-4" : "px-4",
          "placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-200 transition-all"
        )}
      />
    </div>
  </label>
);

const Select = ({ label, value, onChange, options = [], required, icon: Icon }) => (
  <label className="block">
    {label && <span className="text-xs font-bold text-slate-700 block mb-2">{label}{required ? " *" : ""}</span>}
    <div className="relative">
      {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          "w-full h-11 rounded-xl bg-white appearance-none cursor-pointer",
          "border border-slate-200 text-sm text-slate-800",
          Icon ? "pl-9 pr-10" : "px-4",
          "focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-200 transition-all"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  </label>
);

const ModalShell = ({ open, title, subtitle, onClose, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999]">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[720px] rounded-2xl bg-white border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400">{subtitle}</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">{title}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-6 max-h-[80vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
};

/* =========================
   Transaction Details Modal
========================= */
const TransactionDetailsModal = ({ open, transaction, onClose }) => {
  if (!transaction) return null;

  // Mock calculation for demonstration
  const commissionRate = 0.10; // 10% Platform fee
  const commission = transaction.amount * commissionRate;
  const netAmount = transaction.amount - commission;

  return (
    <ModalShell open={open} onClose={onClose} subtitle={`Ref: #${transaction.id}`} title="Transaction Details">
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div>
            <p className="text-xs font-bold text-slate-500">Status</p>
            <div className="mt-1 flex items-center gap-2">
               <StatusIcon status={transaction.status} />
               <StatusPill status={transaction.status} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-500">Date</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">{transaction.date}</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-3">Property & Tenant</h4>
          <div className="grid grid-cols-2 gap-4">
             <div className="p-3 bg-white border border-slate-200 rounded-xl">
               <p className="text-[11px] font-bold text-slate-400 uppercase">Property</p>
               <p className="text-sm font-semibold text-slate-800 mt-1">{transaction.property}</p>
             </div>
             <div className="p-3 bg-white border border-slate-200 rounded-xl">
               <p className="text-[11px] font-bold text-slate-400 uppercase">Tenant</p>
               <p className="text-sm font-semibold text-slate-800 mt-1">{transaction.tenant}</p>
             </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-3">Payment Breakdown</h4>
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
             <div className="flex justify-between text-sm">
                <span className="text-slate-600 font-medium">Tenant Payment (Rent)</span>
                <span className="font-bold text-slate-900">{formatEGP(transaction.amount)}</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-slate-600 font-medium">Platform Commission (10%)</span>
                <span className="font-bold text-rose-600">- {formatEGP(commission)}</span>
             </div>
             <div className="pt-3 border-t border-slate-100 flex justify-between">
                <span className="font-bold text-slate-900">Net Earnings</span>
                <span className="font-black text-emerald-600 text-lg">{formatEGP(netAmount)}</span>
             </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

/* =========================
   Withdraw Modal (Instapay / Wallet / Bank)
========================= */
const WithdrawModal = ({ open, onClose, availableBalance = 0, onSubmit }) => {
  // نفس الكود الخاص بك للمودال مع تعديل بسيط في التنسيقات إن لزم
  // احتفظت به كما هو لعدم الإطالة...
  const [method, setMethod] = useState("instapay");
  const [amount, setAmount] = useState("");
  const [instapayId, setInstapayId] = useState("");
  const [walletProvider, setWalletProvider] = useState("vodafone_cash");
  const [walletNumber, setWalletNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [iban, setIban] = useState("");
  const [swift, setSwift] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError(""); setAmount(""); setMethod("instapay"); setInstapayId(""); setWalletProvider("vodafone_cash"); setWalletNumber(""); setBankName(""); setAccountName(""); setAccountNumber(""); setIban(""); setSwift("");
  }, [open]);

  const handleSubmit = () => {
    // Basic validation
    const a = Number(amount);
    if (!amount || Number.isNaN(a) || a <= 0) return setError("Please enter a valid amount.");
    if (a > Number(availableBalance)) return setError("Amount exceeds available balance.");
    if (method === "instapay" && !instapayId.trim()) return setError("Instapay ID is required.");
    if (method === "wallet" && (!walletProvider || !walletNumber.trim())) return setError("Wallet details required.");
    if (method === "bank" && (!bankName.trim() || !accountName.trim() || !accountNumber.trim())) return setError("Bank details required.");

    onSubmit?.({ method, amount: a });
    onClose?.();
  };

  return (
    <ModalShell open={open} onClose={onClose} subtitle="Withdraw request" title="Request Withdraw">
       <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 md:col-span-5">
          <div className="rounded-2xl border border-slate-100 bg-[#FAFBFD] p-4">
            <p className="text-xs font-bold text-slate-700">Available Balance</p>
            <p className="mt-2 text-2xl font-extrabold text-emerald-700">{formatEGP(availableBalance)}</p>
            <div className="mt-4">
              <Select label="Withdrawal method" value={method} onChange={setMethod} required options={[{ value: "instapay", label: "Instapay" }, { value: "wallet", label: "Electronic Wallet" }, { value: "bank", label: "Bank Account" }]} />
            </div>
            <div className="mt-4">
              <Input label="Amount" placeholder="e.g. 1500" value={amount} onChange={setAmount} type="number" required />
              <p className="mt-2 text-[11px] text-slate-400">Max: {formatEGP(availableBalance)}</p>
            </div>
            {error && <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
          </div>
        </div>
        <div className="col-span-12 md:col-span-7">
          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <p className="text-sm font-extrabold text-slate-900">{method === "instapay" ? "Instapay info" : method === "wallet" ? "Wallet info" : "Bank info"}</p>
            <div className="mt-5 space-y-4">
              {method === "instapay" && <Input label="Instapay ID" placeholder="e.g. username@instapay" value={instapayId} onChange={setInstapayId} required />}
              {method === "wallet" && (
                <>
                  <Select label="Provider" value={walletProvider} onChange={setWalletProvider} required options={[{ value: "vodafone_cash", label: "Vodafone Cash" }, { value: "orange_money", label: "Orange Money" }]} />
                  <Input label="Wallet number" placeholder="e.g. 01XXXXXXXXX" value={walletNumber} onChange={setWalletNumber} required />
                </>
              )}
              {method === "bank" && (
                <>
                  <Input label="Bank name" value={bankName} onChange={setBankName} required />
                  <Input label="Account name" value={accountName} onChange={setAccountName} required />
                  <Input label="Account number" value={accountNumber} onChange={setAccountNumber} required />
                </>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition">Cancel</button>
              <button type="button" onClick={handleSubmit} className="h-11 px-5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition">Submit request</button>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

/* =========================
   Page
========================= */
export default function OwnerPayments() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const stats = useMemo(() => ({ totalIncome: 16000, pendingPayments: 4000, refundedAmounts: 1200, yourEarnings: 15000 }), []);

  // تم تصحيح تواريخ 2033 إلى تواريخ واقعية
  const transactions = useMemo(() => [
    { id: "10291", property: "Shared Room - Nasr City", date: "Mar 1, 2024", amount: 2000, tenant: "Youssef A.", status: "Success" },
    { id: "10292", property: "Luxury Apartment - Zamalek", date: "Jan 26, 2024", amount: 1500, tenant: "Mona K.", status: "Success" },
    { id: "10293", property: "Studio Near Cairo University", date: "Feb 12, 2024", amount: 3500, tenant: "Mohamed K.", status: "Success" },
    { id: "10294", property: "Shared Room - Nasr City", date: "Feb 28, 2024", amount: 5000, tenant: "Mona R.", status: "Rejected" },
    { id: "10295", property: "Studio Near Cairo University", date: "Feb 12, 2024", amount: 2500, tenant: "Salah K.", status: "Success" },
    { id: "10296", property: "Luxury Apartment - Zamalek", date: "March 18, 2024", amount: 1300, tenant: "Ali K.", status: "Pending" },
  ], []);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      // Status Match
      const matchStatus = statusFilter === "all" || t.status.toLowerCase() === statusFilter.toLowerCase();
      // Search Match
      const search = searchTerm.toLowerCase();
      const matchSearch = t.property.toLowerCase().includes(search) || t.tenant.toLowerCase().includes(search);
      // Date Match (Simulated logic based on month presence in string)
      const matchDate = dateFilter === "all" || t.date.toLowerCase().includes(dateFilter.toLowerCase());
      
      return matchStatus && matchSearch && matchDate;
    });
  }, [transactions, statusFilter, searchTerm, dateFilter]);

  const availableBalance = stats.yourEarnings;

  const onWithdrawSubmit = (payload) => {
    console.log("Withdraw payload:", payload);
    alert(`Withdraw request submitted: ${payload.method} - ${formatEGP(payload.amount)}`);
  };

  const handleExport = () => {
    alert("Exporting data to CSV...");
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-slate-800">
      <div className="max-w-7xl mx-auto px-10 py-10">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">My Payments</h1>
            <p className="mt-1 text-sm text-slate-400">
              Monitor your property income, manage withdrawals, and review platform commissions.
            </p>
          </div>
        </div>

        {/* Stats with Icons added */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Income"
            value={formatEGP(stats.totalIncome)}
            icon={Wallet}
            className="bg-gradient-to-br from-[#9EC1FF] to-[#87B6FF] text-blue-900"
          />
          <StatCard
            title="Pending Payments"
            value={formatEGP(stats.pendingPayments)}
            icon={Hourglass}
            className="bg-gradient-to-br from-[#EEF6FF] to-[#E6F0FF] text-[#3B5BFF]"
          />
          <StatCard
            title="Refunded Amounts"
            value={formatEGP(stats.refundedAmounts)}
            icon={RotateCcw}
            className="bg-gradient-to-br from-[#FDEFD2] to-[#FBE3B4] text-[#9A5B00]"
          />
          <StatCard
            title="Your Earnings"
            value={formatEGP(stats.yourEarnings)}
            icon={TrendingUp}
            className="bg-gradient-to-br from-[#BFF7E4] to-[#A6F3D8] text-emerald-900"
          />
        </div>

        {/* Withdraw Section */}
        <div className="mt-10 rounded-2xl bg-white border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Withdraw Your Earnings</h3>
            <p className="mt-1 text-sm text-slate-600">
              Available Balance:{" "}
              <span className="font-extrabold text-emerald-700">{formatEGP(availableBalance)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setWithdrawOpen(true)}
            className="h-11 px-6 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition shadow-lg shadow-emerald-100 whitespace-nowrap"
          >
            Request Withdraw
          </button>
        </div>

        {/* Filters & Export Toolbar */}
        <div className="mt-10 flex flex-col lg:flex-row items-center justify-between gap-4">
           <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <div className="w-full sm:w-64">
                <Input 
                   placeholder="Search tenant or property..." 
                   value={searchTerm} 
                   onChange={setSearchTerm}
                   icon={Search}
                />
              </div>
              <div className="w-full sm:w-44">
                <Select 
                   value={statusFilter} 
                   onChange={setStatusFilter}
                   icon={AlertCircle}
                   options={[
                     { value: "all", label: "All Status" },
                     { value: "success", label: "Success" },
                     { value: "pending", label: "Pending" },
                     { value: "rejected", label: "Rejected" },
                   ]}
                />
              </div>
              <div className="w-full sm:w-44">
                <Select 
                   value={dateFilter} 
                   onChange={setDateFilter}
                   icon={CalendarDays}
                   options={[
                     { value: "all", label: "All Time" },
                     { value: "jan", label: "January" },
                     { value: "feb", label: "February" },
                     { value: "mar", label: "March" },
                   ]}
                />
              </div>
           </div>

           <button 
             onClick={handleExport}
             className="flex items-center gap-2 h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition w-full lg:w-auto justify-center"
           >
              <Download size={16} /> Export CSV
           </button>
        </div>

        {/* Table */}
        <div className="mt-6 rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAFBFD] border-b border-slate-100">
                <tr className="text-left text-xs text-slate-400">
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Property</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Tenant</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTransaction(t)}
                    className="bg-white hover:bg-slate-50/80 transition cursor-pointer group"
                  >
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium group-hover:text-blue-600 transition-colors">
                      {t.property}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">{t.date}</td>
                    <td className="px-6 py-4 text-sm font-extrabold text-slate-800">
                      {t.amount} EGP
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{t.tenant}</td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-2">
                        <StatusIcon status={t.status} />
                        <StatusPill status={t.status} />
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td className="px-6 py-16 text-center" colSpan={5}>
                      <div className="flex flex-col items-center justify-center text-slate-400">
                         <Search size={32} className="mb-3 opacity-20" />
                         <p className="text-sm font-medium">No transactions found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals */}
        <WithdrawModal
          open={withdrawOpen}
          onClose={() => setWithdrawOpen(false)}
          availableBalance={availableBalance}
          onSubmit={onWithdrawSubmit}
        />

        <TransactionDetailsModal 
          open={!!selectedTransaction}
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
        
      </div>
    </div>
  );
}
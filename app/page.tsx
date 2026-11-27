"use client";

import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  CreditCard,
  Search,
  Calendar,
  Phone,
  User,
  Package,
  Trash2,
  Landmark,
  ShoppingBag,
  XCircle,
  TrendingUp,
} from "lucide-react";

type ModeType = "credit" | "lombard" | "nisye";

interface CreditRecord {
  id: string;
  firstName: string;
  lastName: string;
  fin: string;
  phones: [string, string, string];
  productName: string;
  productDesc: string;
  quantity: number;
  issueDate: string; // YYYY-MM-DD
  totalPrice: number;
  downPayment: number;
  months: number;
  paidMonths: number;
  nextPaymentDate: string; // YYYY-MM-DD
}

interface LombardRecord {
  id: string;
  firstName: string;
  lastName: string;
  fin: string;
  phones: [string, string, string];
  receivedItem: string; // Alınan məhsul
  givenAmountForItem: number; // Alınan məhsul altında verilən məbləğ
  productDesc: string;
  quantity: number;
  issueDate: string; // YYYY-MM-DD
  principalAmount: number; // Verilən məbləğ (məs: 600)
  ratePercent: number; // 15%
  receivableAmount: number; // Qaytarılacaq / Alınacaq məbləğ
  unpaidCount: number; // "Ödənilmədi" basılma sayı
  paidCycles: number;
  nextPaymentDate: string; // YYYY-MM-DD
}

interface NisyeRecord {
  id: string;
  firstName: string;
  lastName: string;
  fin: string;
  phones: [string, string, string];
  productName: string;
  productDesc: string;
  quantity: number;
  issueDate: string; // YYYY-MM-DD
  totalAmount: number;
  paidAmount: number;
  dueDate: string; // YYYY-MM-DD
  isPaid: boolean;
}

// Tarixə ay əlavə edən köməkçi funksiya
function addMonthsToDate(dateStr: string, monthsToAdd: number): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const d = date.getDate();
  date.setMonth(date.getMonth() + monthsToAdd);
  if (date.getDate() !== d) {
    date.setDate(0);
  }
  return date.toISOString().split("T")[0];
}

// Tarixi Azərbaycan formatına (GG.AA.İİİİ) çevirən funksiya
function formatDateAZ(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

// Verilmə tarixindən keçən ay indeksini (1..12) tapan funksiya
function getMonthIndexFromIssue(issueDate: string, targetDate: string): number {
  if (!issueDate || !targetDate) return 1;
  const start = new Date(issueDate);
  const end = new Date(targetDate);
  const diff =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  return Math.max(1, diff);
}

export default function CreditSystem() {
  // 3 əsas pəncərə seçimi: 1-ci Kreditin verilməsi, 2-ci Lombard, 3-cü Nisyə verilməsi
  const [activeMode, setActiveMode] = useState<ModeType>("credit");

  const [records, setRecords] = useState<CreditRecord[]>([]);
  const [lombardRecords, setLombardRecords] = useState<LombardRecord[]>([]);
  const [nisyeRecords, setNisyeRecords] = useState<NisyeRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Admin giriş və pəncərə idarəetməsi
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "credits" | "lombard" | "nisye" | "overdue" | "reports" | "monthlyIncome"
  >("credits");
  const [searchQuery, setSearchQuery] = useState("");

  // Gecikmələr daxilində 3 ayrı pəncərə seçimi: Kredit | Lombard | Nisyə
  const [overdueSubTab, setOverdueSubTab] = useState<"credit" | "lombard" | "nisye">("credit");

  // Aylıq gəlirlər alt-pəncərə və 1-12 ay seçimi
  const [incomeSubTab, setIncomeSubTab] = useState<"credit" | "nisye" | "lombard">("credit");
  const [selectedMonth, setSelectedMonth] = useState<number>(1);

  // Ümumi Müştəri Formu State-ləri
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [fin, setFin] = useState("");
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [phone3, setPhone3] = useState("");
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [issueDate, setIssueDate] = useState<string>("");
  const [todayStr, setTodayStr] = useState<string>("");

  // Kredit State-ləri
  const [totalPrice, setTotalPrice] = useState<string>("");
  const [downPayment, setDownPayment] = useState<string>("0");
  const [months, setMonths] = useState<number>(12);

  // Lombard State-ləri
  const [givenAmountForItem, setGivenAmountForItem] = useState<string>("");
  const [lombardPrincipal, setLombardPrincipal] = useState<string>("");

  // Nisyə State-ləri
  const [nisyeAmount, setNisyeAmount] = useState<string>("");
  const [nisyePaid, setNisyePaid] = useState<string>("0");
  const [nisyeDueDate, setNisyeDueDate] = useState<string>("");

  const [successMsg, setSuccessMsg] = useState("");

  // LocalStorage-dən məlumatların oxunması və brauzer tarixinin təyin edilməsi
  useEffect(() => {
    const nowDate = new Date().toISOString().split("T")[0];
    setTodayStr(nowDate);
    setIssueDate(nowDate);
    setNisyeDueDate(addMonthsToDate(nowDate, 1));

    const savedCredits = localStorage.getItem("kredit_qeydleri_v1");
    if (savedCredits) {
      setRecords(JSON.parse(savedCredits));
    }

    const savedLombard = localStorage.getItem("lombard_qeydleri_v1");
    if (savedLombard) {
      setLombardRecords(JSON.parse(savedLombard));
    }

    const savedNisye = localStorage.getItem("nisye_qeydleri_v1");
    if (savedNisye) {
      setNisyeRecords(JSON.parse(savedNisye));
    }

    setIsLoaded(true);
  }, []);

  // LocalStorage-ə məlumatların yazılması
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("kredit_qeydleri_v1", JSON.stringify(records));
    }
  }, [records, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("lombard_qeydleri_v1", JSON.stringify(lombardRecords));
    }
  }, [lombardRecords, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("nisye_qeydleri_v1", JSON.stringify(nisyeRecords));
    }
  }, [nisyeRecords, isLoaded]);

  // Canlı aylıq ödəniş hesablanması (Kredit önizləməsi)
  const previewTotal = parseFloat(totalPrice) || 0;
  const previewDown = parseFloat(downPayment) || 0;
  const previewRemaining = Math.max(0, previewTotal - previewDown);
  const previewMonthly = months > 0 ? previewRemaining / months : 0;

  // Canlı Lombard 15% hesablanması (məs: 600 AZN -> +15% = 690 AZN)
  const previewLombardPrincipal = parseFloat(lombardPrincipal) || 0;
  const previewLombard15Amount = previewLombardPrincipal * 0.15;
  const previewLombardReceivable = previewLombardPrincipal + previewLombard15Amount;

  const resetCommonFields = () => {
    setFirstName("");
    setLastName("");
    setFin("");
    setPhone1("");
    setPhone2("");
    setPhone3("");
    setProductName("");
    setProductDesc("");
    setQuantity(1);
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // 1. Yeni Kredit Qeydiyyatı
  const handleAddCredit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(totalPrice) || 0;
    const down = parseFloat(downPayment) || 0;

    if (down > total) {
      alert("İlkin ödəniş toplam kredit qiymətindən çox ola bilməz!");
      return;
    }

    const effectiveIssueDate =
      issueDate || todayStr || new Date().toISOString().split("T")[0];
    const firstPaymentDate = addMonthsToDate(effectiveIssueDate, 1);

    const newRecord: CreditRecord = {
      id: Date.now().toString(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fin: fin.trim().toUpperCase(),
      phones: [phone1.trim(), phone2.trim(), phone3.trim()],
      productName: productName.trim(),
      productDesc: productDesc.trim(),
      quantity: Number(quantity) || 1,
      issueDate: effectiveIssueDate,
      totalPrice: total,
      downPayment: down,
      months: Number(months),
      paidMonths: 0,
      nextPaymentDate: firstPaymentDate,
    };

    setRecords([newRecord, ...records]);
    resetCommonFields();
    setTotalPrice("");
    setDownPayment("0");
    setMonths(12);
    triggerSuccess("Kredit qeydiyyatı uğurla əlavə edildi!");
  };

  // 2. Yeni Lombard Qeydiyyatı
  const handleAddLombard = (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseFloat(lombardPrincipal) || 0;
    const itemAmt = parseFloat(givenAmountForItem) || 0;

    if (principal <= 0) {
      alert("Zəhmət olmasa verilən məbləği düzgün daxil edin!");
      return;
    }

    const effectiveIssueDate =
      issueDate || todayStr || new Date().toISOString().split("T")[0];
    const firstPaymentDate = addMonthsToDate(effectiveIssueDate, 1);
    const initialReceivable = principal * 1.15;

    const newLombard: LombardRecord = {
      id: Date.now().toString(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fin: fin.trim().toUpperCase(),
      phones: [phone1.trim(), phone2.trim(), phone3.trim()],
      receivedItem: productName.trim(),
      givenAmountForItem: itemAmt,
      productDesc: productDesc.trim(),
      quantity: Number(quantity) || 1,
      issueDate: effectiveIssueDate,
      principalAmount: principal,
      ratePercent: 15,
      receivableAmount: initialReceivable,
      unpaidCount: 0,
      paidCycles: 0,
      nextPaymentDate: firstPaymentDate,
    };

    setLombardRecords([newLombard, ...lombardRecords]);
    resetCommonFields();
    setGivenAmountForItem("");
    setLombardPrincipal("");
    triggerSuccess("Lombard qeydiyyatı uğurla əlavə edildi!");
  };

  // 3. Yeni Nisyə Qeydiyyatı
  const handleAddNisye = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(nisyeAmount) || 0;
    const paid = parseFloat(nisyePaid) || 0;

    if (paid > total) {
      alert("Ödənilən məbləğ nisyə məbləğindən çox ola bilməz!");
      return;
    }

    const effectiveIssueDate =
      issueDate || todayStr || new Date().toISOString().split("T")[0];

    const newNisye: NisyeRecord = {
      id: Date.now().toString(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fin: fin.trim().toUpperCase(),
      phones: [phone1.trim(), phone2.trim(), phone3.trim()],
      productName: productName.trim(),
      productDesc: productDesc.trim(),
      quantity: Number(quantity) || 1,
      issueDate: effectiveIssueDate,
      totalAmount: total,
      paidAmount: paid,
      dueDate: nisyeDueDate || addMonthsToDate(effectiveIssueDate, 1),
      isPaid: paid >= total && total > 0,
    };

    setNisyeRecords([newNisye, ...nisyeRecords]);
    resetCommonFields();
    setNisyeAmount("");
    setNisyePaid("0");
    triggerSuccess("Nisyə qeydiyyatı uğurla əlavə edildi!");
  };

  // Admin parol yoxlanışı
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "1111") {
      setIsAdminOpen(true);
      setPasswordError(false);
      setPasswordInput("");
    } else {
      setPasswordError(true);
    }
  };

  // Kredit "Ödənildi" düyməsi funksiyası
  const handleMarkAsPaid = (id: string) => {
    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== id) return rec;
        if (rec.paidMonths >= rec.months) return rec;

        const updatedPaidMonths = rec.paidMonths + 1;
        const updatedNextDate = addMonthsToDate(rec.nextPaymentDate, 1);

        return {
          ...rec,
          paidMonths: updatedPaidMonths,
          nextPaymentDate: updatedNextDate,
        };
      })
    );
  };

  // Lombard "Ödənildi" düyməsi funksiyası
  const handleLombardMarkAsPaid = (id: string) => {
    setLombardRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== id) return rec;
        const updatedNextDate = addMonthsToDate(rec.nextPaymentDate, 1);
        return {
          ...rec,
          paidCycles: rec.paidCycles + 1,
          nextPaymentDate: updatedNextDate,
        };
      })
    );
  };

  // Lombard "Ödənilmədi" düyməsi funksiyası: yalnız basıldıqda qaytarılacaq məbləğin üzərinə 15% gəlir
  const handleLombardMarkAsUnpaid = (id: string) => {
    setLombardRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== id) return rec;
        const currentReceivable =
          typeof rec.receivableAmount === "number" && rec.receivableAmount > 0
            ? rec.receivableAmount
            : rec.principalAmount * 1.15;
        const increasedReceivable = currentReceivable * 1.15;
        const updatedNextDate = addMonthsToDate(rec.nextPaymentDate, 1);

        return {
          ...rec,
          receivableAmount: increasedReceivable,
          unpaidCount: (rec.unpaidCount || 0) + 1,
          nextPaymentDate: updatedNextDate,
        };
      })
    );
  };

  // Nisyə "Ödənildi" düyməsi funksiyası
  const handleNisyeMarkAsPaid = (id: string) => {
    setNisyeRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== id) return rec;
        return {
          ...rec,
          paidAmount: rec.totalAmount,
          isPaid: true,
        };
      })
    );
  };

  // Qeydi silmək
  const handleDelete = (id: string) => {
    if (confirm("Bu kredit qeydini silmək istədiyinizə əminsiniz?")) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleDeleteLombard = (id: string) => {
    if (confirm("Bu lombard qeydini silmək istədiyinizə əminsiniz?")) {
      setLombardRecords((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleDeleteNisye = (id: string) => {
    if (confirm("Bu nisyə qeydini silmək istədiyinizə əminsiniz?")) {
      setNisyeRecords((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // Axtarış üzrə filtrləmə
  const filteredRecords = records.filter(
    (r) =>
      `${r.firstName} ${r.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.fin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLombard = lombardRecords.filter(
    (r) =>
      `${r.firstName} ${r.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.fin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.receivedItem.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNisye = nisyeRecords.filter(
    (r) =>
      `${r.firstName} ${r.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.fin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Gecikən kreditlər, lombardlar və nisyələr
  const overdueRecords = filteredRecords.filter(
    (r) => todayStr && r.paidMonths < r.months && r.nextPaymentDate < todayStr
  );

  const overdueLombard = filteredLombard.filter((r) => (r.unpaidCount || 0) > 0);

  const overdueNisye = filteredNisye.filter(
    (r) => !r.isPaid && Boolean(todayStr) && r.dueDate < todayStr
  );

  const totalOverdueCount =
    overdueRecords.length + overdueLombard.length + overdueNisye.length;

  // Ümumi Hesabat göstəriciləri
  const totalSalesAmount = records.reduce((acc, r) => acc + r.totalPrice, 0);
  const totalDownPayments = records.reduce((acc, r) => acc + r.downPayment, 0);
  const totalCollectedInstallments = records.reduce((acc, r) => {
    const monthly = (r.totalPrice - r.downPayment) / r.months;
    return acc + monthly * r.paidMonths;
  }, 0);
  const totalPaidOverall = totalDownPayments + totalCollectedInstallments;
  const totalRemainingOverall = Math.max(0, totalSalesAmount - totalPaidOverall);

  const totalLombardPrincipal = lombardRecords.reduce(
    (acc, r) => acc + r.principalAmount,
    0
  );
  const totalLombardReceivable = lombardRecords.reduce(
    (acc, r) =>
      acc +
      (typeof r.receivableAmount === "number" && r.receivableAmount > 0
        ? r.receivableAmount
        : r.principalAmount * 1.15),
    0
  );
  const totalNisyeRemaining = nisyeRecords.reduce(
    (acc, r) => acc + Math.max(0, r.totalAmount - r.paidAmount),
    0
  );

  // --- AYLİQ GƏLİRLƏR (1-12 AY) HESABLAMALARI ---
  const creditEarnedUpToMonth = records.reduce((acc, r) => {
    const monthly = (r.totalPrice - r.downPayment) / r.months;
    const paidInstallmentsInPeriod = Math.min(r.paidMonths, selectedMonth);
    return acc + r.downPayment + monthly * paidInstallmentsInPeriod;
  }, 0);

  const creditExpectedUpToMonth = records.reduce((acc, r) => {
    const monthly = (r.totalPrice - r.downPayment) / r.months;
    const scheduledMonths = Math.min(r.months, selectedMonth);
    const paidInstallmentsInPeriod = Math.min(r.paidMonths, selectedMonth);
    const remainingToCome = Math.max(0, scheduledMonths - paidInstallmentsInPeriod);
    return acc + monthly * remainingToCome;
  }, 0);

  const nisyeEarnedUpToMonth = nisyeRecords.reduce((acc, r) => {
    const dueMonthIdx = getMonthIndexFromIssue(r.issueDate, r.dueDate);
    if (dueMonthIdx <= selectedMonth || r.isPaid) {
      return acc + (r.isPaid ? r.totalAmount : r.paidAmount);
    }
    return acc + r.paidAmount;
  }, 0);

  const nisyeExpectedUpToMonth = nisyeRecords.reduce((acc, r) => {
    const dueMonthIdx = getMonthIndexFromIssue(r.issueDate, r.dueDate);
    if (!r.isPaid && dueMonthIdx <= selectedMonth) {
      return acc + Math.max(0, r.totalAmount - r.paidAmount);
    }
    return acc;
  }, 0);

  const lombardEarnedUpToMonth = lombardRecords.reduce((acc, r) => {
    const receivable =
      typeof r.receivableAmount === "number" && r.receivableAmount > 0
        ? r.receivableAmount
        : r.principalAmount * 1.15;
    const paidInPeriod = Math.min(r.paidCycles, selectedMonth);
    return acc + receivable * paidInPeriod;
  }, 0);

  const lombardExpectedUpToMonth = lombardRecords.reduce((acc, r) => {
    const receivable =
      typeof r.receivableAmount === "number" && r.receivableAmount > 0
        ? r.receivableAmount
        : r.principalAmount * 1.15;
    const remainingCycles = Math.max(0, selectedMonth - r.paidCycles);
    return acc + (remainingCycles > 0 ? receivable : 0);
  }, 0);

  const currentModeTitle =
    activeMode === "credit"
      ? "Yeni Kredit Müqaviləsi Qeydiyyatı"
      : activeMode === "lombard"
      ? "Yeni Lombard Müqaviləsi Qeydiyyatı"
      : "Yeni Nisyə Qeydiyyatı";

  const currentSubmitLabel =
    activeMode === "credit"
      ? "Kredit Qeydiyyatını Təsdiqlə"
      : activeMode === "lombard"
      ? "Lombard Qeydiyyatını Təsdiqlə"
      : "Nisyə Qeydiyyatını Təsdiqlə";

  return (
    <div
      className="min-h-screen bg-fixed bg-slate-950 text-slate-800 p-4 md:p-8 font-sans relative overflow-x-hidden"
      style={{
        backgroundImage: `
          radial-gradient(at 10% 15%, rgba(37, 99, 235, 0.28) 0px, transparent 50%),
          radial-gradient(at 90% 10%, rgba(16, 185, 129, 0.20) 0px, transparent 50%),
          radial-gradient(at 80% 85%, rgba(99, 102, 241, 0.25) 0px, transparent 55%),
          radial-gradient(at 20% 85%, rgba(14, 165, 233, 0.18) 0px, transparent 50%),
          linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)
        `,
      }}
    >
      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Üst Başlıq və Admin Giriş Paneli */}
        <header className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-3 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Kredit Qeydiyyat və İdarəetmə Sistemi
              </h1>
              <p className="text-sm text-slate-500">
                Kassir Satış Paneli və Admin Nəzarəti
              </p>
            </div>
          </div>

          {/* Admin Giriş / Çıxış hissəsi */}
          {!isAdminOpen ? (
            <form onSubmit={handleAdminLogin} className="flex items-center gap-2">
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Admin parolu"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className={`pl-9 pr-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 ${
                    passwordError
                      ? "border-red-500 focus:ring-red-200"
                      : "border-slate-300 focus:ring-blue-200"
                  }`}
                />
              </div>
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                Admin Giriş
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAdminOpen(false)}
              className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <Unlock className="w-4 h-4" />
              Admin Panelini Bağla
            </button>
          )}
        </header>

        {/* 3 ƏSAS PƏNCƏRƏ SEÇİMİ: 1. Kreditin verilməsi | 2. Lombard | 3. Nisyə verilməsi */}
        {!isAdminOpen && (
          <nav className="bg-white/95 backdrop-blur rounded-2xl shadow-sm border border-slate-200 p-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setActiveMode("credit")}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition ${
                activeMode === "credit"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              1. Kreditin verilməsi
            </button>

            <button
              type="button"
              onClick={() => setActiveMode("lombard")}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition ${
                activeMode === "lombard"
                  ? "bg-amber-600 text-white shadow-md"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Landmark className="w-4 h-4" />
              2. Lombard
            </button>

            <button
              type="button"
              onClick={() => setActiveMode("nisye")}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition ${
                activeMode === "nisye"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              3. Nisyə verilməsi
            </button>
          </nav>
        )}

        {/* ORTA ÖLÇÜDƏ ADMİN PƏNCƏRƏSİ (Parol 1111 yazıldıqda açılır) */}
        {isAdminOpen && (
          <section className="bg-white rounded-2xl shadow-lg border-2 border-blue-600/20 overflow-hidden transition-all">
            <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="font-semibold text-lg">Admin İdarəetmə Pəncərəsi</h2>
              </div>

              {/* Admin Tab Düymələri */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab("credits")}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                    activeTab === "credits"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Kreditlər ({records.length})
                </button>
                <button
                  onClick={() => setActiveTab("lombard")}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                    activeTab === "lombard"
                      ? "bg-amber-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <Landmark className="w-4 h-4" />
                  Lombard ({lombardRecords.length})
                </button>
                <button
                  onClick={() => setActiveTab("nisye")}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                    activeTab === "nisye"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Nisyə ({nisyeRecords.length})
                </button>
                <button
                  onClick={() => setActiveTab("overdue")}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                    activeTab === "overdue"
                      ? "bg-red-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Gecikmələr ({totalOverdueCount})
                </button>
                <button
                  onClick={() => setActiveTab("reports")}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                    activeTab === "reports"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Hesabat
                </button>
                <button
                  onClick={() => setActiveTab("monthlyIncome")}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                    activeTab === "monthlyIncome"
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Aylıq gəlirlər
                </button>
              </div>
            </div>

            {/* Axtarış Çubuğu */}
            {activeTab !== "reports" && activeTab !== "monthlyIncome" && (
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="relative w-full max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ad, Soyad, FİN və ya Məhsul adına görə axtar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* 1. KREDİTLƏR PƏNCƏRƏSİ */}
            {activeTab === "credits" && (
              <div className="p-4 overflow-x-auto max-h-[550px] overflow-y-auto">
                {filteredRecords.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">
                    Hələ heç bir kredit qeydiyyatı yoxdur.
                  </p>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                        <th className="p-3 font-semibold">Müştəri & FİN</th>
                        <th className="p-3 font-semibold">Əlaqə (3 nömrə)</th>
                        <th className="p-3 font-semibold">Məhsul & Miqdar</th>
                        <th className="p-3 font-semibold">Maliyyə (Toplam / İlkin)</th>
                        <th className="p-3 font-semibold">Aylıq Ödəniş</th>
                        <th className="p-3 font-semibold">Növbəti Ödəniş</th>
                        <th className="p-3 font-semibold text-right">Əməliyyat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredRecords.map((rec) => {
                        const remainingPrincipal = rec.totalPrice - rec.downPayment;
                        const monthlyPayment = remainingPrincipal / rec.months;
                        const isFinished = rec.paidMonths >= rec.months;
                        const isOverdue =
                          !isFinished && Boolean(todayStr) && rec.nextPaymentDate < todayStr;

                        return (
                          <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3">
                              <div className="font-bold text-slate-900">
                                {rec.firstName} {rec.lastName}
                              </div>
                              <div className="text-xs font-mono bg-slate-200 text-slate-700 inline-block px-1.5 py-0.5 rounded mt-1">
                                FİN: {rec.fin}
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                Verilib: {formatDateAZ(rec.issueDate)}
                              </div>
                            </td>

                            <td className="p-3 text-xs space-y-0.5 text-slate-600">
                              <div>1) {rec.phones[0]}</div>
                              <div>2) {rec.phones[1]}</div>
                              <div>3) {rec.phones[2]}</div>
                            </td>

                            <td className="p-3">
                              <div className="font-semibold text-slate-800">
                                {rec.productName}{" "}
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  {rec.quantity} ədəd
                                </span>
                              </div>
                              {rec.productDesc && (
                                <p className="text-xs text-slate-500 max-w-[180px] truncate mt-0.5">
                                  {rec.productDesc}
                                </p>
                              )}
                            </td>

                            <td className="p-3 text-xs space-y-1">
                              <div>
                                Toplam:{" "}
                                <span className="font-bold text-slate-900">
                                  {rec.totalPrice.toFixed(2)} ₼
                                </span>
                              </div>
                              <div>
                                İlkin:{" "}
                                <span className="font-semibold text-emerald-600">
                                  {rec.downPayment.toFixed(2)} ₼
                                </span>
                              </div>
                              <div className="text-slate-500">
                                Müddət: {rec.paidMonths} / {rec.months} ay
                              </div>
                            </td>

                            <td className="p-3">
                              <div className="bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1.5 rounded-lg inline-block">
                                <span className="text-xs block text-amber-700">
                                  Aylıq ödəniləcək:
                                </span>
                                <span className="font-bold text-base">
                                  {monthlyPayment.toFixed(2)} ₼
                                </span>
                              </div>
                            </td>

                            <td className="p-3">
                              {isFinished ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Kredit Tam Bağlanıb
                                </span>
                              ) : (
                                <div>
                                  <div
                                    className={`font-bold text-sm ${
                                      isOverdue ? "text-red-600" : "text-blue-700"
                                    }`}
                                  >
                                    {formatDateAZ(rec.nextPaymentDate)}
                                  </div>
                                  <div className="text-xs text-slate-600 font-medium">
                                    Məbləğ: {monthlyPayment.toFixed(2)} ₼
                                  </div>
                                  {isOverdue && (
                                    <span className="text-[11px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">
                                      Gecikir!
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {!isFinished && (
                                  <button
                                    onClick={() => handleMarkAsPaid(rec.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Ödənildi
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(rec.id)}
                                  title="Qeydi sil"
                                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* 2. LOMBARD PƏNCƏRƏSİ */}
            {activeTab === "lombard" && (
              <div className="p-4 overflow-x-auto max-h-[550px] overflow-y-auto">
                {filteredLombard.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">
                    Hələ heç bir lombard qeydiyyatı yoxdur.
                  </p>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-amber-200 text-amber-900 bg-amber-50">
                        <th className="p-3 font-semibold">Müştəri & FİN</th>
                        <th className="p-3 font-semibold">Əlaqə (3 nömrə)</th>
                        <th className="p-3 font-semibold">Alınan Məhsul & Məbləğ</th>
                        <th className="p-3 font-semibold">Verilən Məbləğ & 15%</th>
                        <th className="p-3 font-semibold">Qaytarılacaq Məbləğ</th>
                        <th className="p-3 font-semibold">Növbəti Ödəniş</th>
                        <th className="p-3 font-semibold text-right">Əməliyyat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredLombard.map((rec) => {
                        const receivable =
                          typeof rec.receivableAmount === "number" && rec.receivableAmount > 0
                            ? rec.receivableAmount
                            : rec.principalAmount * 1.15;

                        return (
                          <tr key={rec.id} className="hover:bg-amber-50/40 transition">
                            <td className="p-3">
                              <div className="font-bold text-slate-900">
                                {rec.firstName} {rec.lastName}
                              </div>
                              <div className="text-xs font-mono bg-slate-200 text-slate-700 inline-block px-1.5 py-0.5 rounded mt-1">
                                FİN: {rec.fin}
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                Verilib: {formatDateAZ(rec.issueDate)}
                              </div>
                            </td>

                            <td className="p-3 text-xs space-y-0.5 text-slate-600">
                              <div>1) {rec.phones[0]}</div>
                              <div>2) {rec.phones[1]}</div>
                              <div>3) {rec.phones[2]}</div>
                            </td>

                            <td className="p-3">
                              <div className="font-semibold text-slate-800">
                                {rec.receivedItem}{" "}
                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                  {rec.quantity} ədəd
                                </span>
                              </div>
                              <div className="text-xs text-slate-600 mt-0.5">
                                Məhsula verilən:{" "}
                                <span className="font-semibold">
                                  {rec.givenAmountForItem.toFixed(2)} ₼
                                </span>
                              </div>
                              {rec.productDesc && (
                                <p className="text-xs text-slate-500 max-w-[180px] truncate mt-0.5">
                                  {rec.productDesc}
                                </p>
                              )}
                            </td>

                            <td className="p-3 text-xs space-y-1">
                              <div>
                                Verilən:{" "}
                                <span className="font-bold text-slate-900">
                                  {rec.principalAmount.toFixed(2)} ₼
                                </span>
                              </div>
                              <div>
                                Faiz dərəcəsi:{" "}
                                <span className="font-semibold text-amber-700">
                                  {rec.ratePercent}%
                                </span>
                              </div>
                              <div className="text-slate-500">
                                Ödənildi sayı: {rec.paidCycles}
                              </div>
                            </td>

                            <td className="p-3">
                              <div className="bg-amber-50 border border-amber-300 text-amber-950 px-2.5 py-1.5 rounded-lg inline-block">
                                <span className="text-xs block text-amber-800">
                                  Qaytarılacaq məbləğ:
                                </span>
                                <span className="font-bold text-base">
                                  {receivable.toFixed(2)} ₼
                                </span>
                                {(rec.unpaidCount || 0) > 0 && (
                                  <span className="block text-[11px] font-semibold text-red-600 mt-0.5">
                                    Ödənilmədi: {rec.unpaidCount} dəfə (+15%)
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="p-3">
                              <div className="font-bold text-sm text-blue-700">
                                {formatDateAZ(rec.nextPaymentDate)}
                              </div>
                              <div className="text-xs text-slate-600 font-medium">
                                Məbləğ: {receivable.toFixed(2)} ₼
                              </div>
                            </td>

                            <td className="p-3 text-right">
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleLombardMarkAsPaid(rec.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-2 rounded-lg shadow-sm transition flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Ödənildi
                                </button>
                                <button
                                  onClick={() => handleLombardMarkAsUnpaid(rec.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-2.5 py-2 rounded-lg shadow-sm transition flex items-center gap-1"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Ödənilmədi (+15%)
                                </button>
                                <button
                                  onClick={() => handleDeleteLombard(rec.id)}
                                  title="Qeydi sil"
                                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* 3. NİSYƏ PƏNCƏRƏSİ */}
            {activeTab === "nisye" && (
              <div className="p-4 overflow-x-auto max-h-[550px] overflow-y-auto">
                {filteredNisye.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">
                    Hələ heç bir nisyə qeydiyyatı yoxdur.
                  </p>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                        <th className="p-3 font-semibold">Müştəri & FİN</th>
                        <th className="p-3 font-semibold">Əlaqə (3 nömrə)</th>
                        <th className="p-3 font-semibold">Məhsul & Miqdar</th>
                        <th className="p-3 font-semibold">Məbləğ / Qalıq</th>
                        <th className="p-3 font-semibold">Son Tarix</th>
                        <th className="p-3 font-semibold text-right">Əməliyyat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredNisye.map((rec) => {
                        const rem = Math.max(0, rec.totalAmount - rec.paidAmount);
                        return (
                          <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3">
                              <div className="font-bold text-slate-900">
                                {rec.firstName} {rec.lastName}
                              </div>
                              <div className="text-xs font-mono bg-slate-200 text-slate-700 inline-block px-1.5 py-0.5 rounded mt-1">
                                FİN: {rec.fin}
                              </div>
                            </td>
                            <td className="p-3 text-xs space-y-0.5 text-slate-600">
                              <div>1) {rec.phones[0]}</div>
                              <div>2) {rec.phones[1]}</div>
                              <div>3) {rec.phones[2]}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-800">
                                {rec.productName} ({rec.quantity} ədəd)
                              </div>
                            </td>
                            <td className="p-3 text-xs space-y-1">
                              <div>
                                Cəmi:{" "}
                                <span className="font-bold text-slate-900">
                                  {rec.totalAmount.toFixed(2)} ₼
                                </span>
                              </div>
                              <div>
                                Qalıq:{" "}
                                <span className="font-bold text-blue-700">
                                  {rem.toFixed(2)} ₼
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-sm font-semibold text-slate-700">
                              {formatDateAZ(rec.dueDate)}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {!rec.isPaid && (
                                  <button
                                    onClick={() => handleNisyeMarkAsPaid(rec.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Ödənildi
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteNisye(rec.id)}
                                  title="Qeydi sil"
                                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* 4. GECİKMƏLƏR PƏNCƏRƏSİ (3 ayrı pəncərə: Kredit | Lombard | Nisyə) */}
            {activeTab === "overdue" && (
              <div className="p-4 space-y-4 max-h-[550px] overflow-y-auto">
                {/* 3 ayrı seçim pəncərəsi */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setOverdueSubTab("credit")}
                    className={`py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${
                      overdueSubTab === "credit"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-700 hover:bg-white"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Kredit ({overdueRecords.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setOverdueSubTab("lombard")}
                    className={`py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${
                      overdueSubTab === "lombard"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "text-slate-700 hover:bg-white"
                    }`}
                  >
                    <Landmark className="w-4 h-4" />
                    Lombard ({overdueLombard.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setOverdueSubTab("nisye")}
                    className={`py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${
                      overdueSubTab === "nisye"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-700 hover:bg-white"
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Nisyə ({overdueNisye.length})
                  </button>
                </div>

                {/* A) KREDİT GECİKMƏLƏRİ PƏNCƏRƏSİ */}
                {overdueSubTab === "credit" && (
                  <div className="overflow-x-auto">
                    {overdueRecords.length === 0 ? (
                      <div className="text-center py-10 text-emerald-700 bg-emerald-50/50 rounded-xl">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                        <p className="font-medium">Hal-hazırda kredit üzrə gecikən ödəniş yoxdur.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-red-200 text-red-800 bg-red-50">
                            <th className="p-3 font-semibold">Kredit Müştəri & FİN</th>
                            <th className="p-3 font-semibold">Əlaqə Nömrələri</th>
                            <th className="p-3 font-semibold">Məhsul</th>
                            <th className="p-3 font-semibold">Gecikən Tarix</th>
                            <th className="p-3 font-semibold">Gecikən Məbləğ</th>
                            <th className="p-3 font-semibold text-right">Əməliyyat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-100">
                          {overdueRecords.map((rec) => {
                            const monthlyPayment =
                              (rec.totalPrice - rec.downPayment) / rec.months;
                            return (
                              <tr key={rec.id} className="bg-red-50/30 hover:bg-red-50">
                                <td className="p-3 font-bold text-slate-900">
                                  {rec.firstName} {rec.lastName}
                                  <span className="block text-xs font-normal text-slate-500">
                                    FİN: {rec.fin}
                                  </span>
                                </td>
                                <td className="p-3 text-xs text-slate-700">
                                  {rec.phones.join(" | ")}
                                </td>
                                <td className="p-3">
                                  {rec.productName} ({rec.quantity} ədəd)
                                </td>
                                <td className="p-3 font-bold text-red-600">
                                  {formatDateAZ(rec.nextPaymentDate)}
                                </td>
                                <td className="p-3 font-bold text-slate-900">
                                  {monthlyPayment.toFixed(2)} ₼
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => handleMarkAsPaid(rec.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
                                  >
                                    Ödənildi
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* B) LOMBARD GECİKMƏLƏRİ PƏNCƏRƏSİ */}
                {overdueSubTab === "lombard" && (
                  <div className="overflow-x-auto">
                    {overdueLombard.length === 0 ? (
                      <div className="text-center py-10 text-emerald-700 bg-emerald-50/50 rounded-xl">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                        <p className="font-medium">Hal-hazırda lombard üzrə gecikən ödəniş yoxdur.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-red-200 text-red-800 bg-red-50">
                            <th className="p-3 font-semibold">Lombard Müştəri & FİN</th>
                            <th className="p-3 font-semibold">Əlaqə Nömrələri</th>
                            <th className="p-3 font-semibold">Alınan Məhsul</th>
                            <th className="p-3 font-semibold">Ödənilmədi Sayı</th>
                            <th className="p-3 font-semibold">Qaytarılacaq Məbləğ</th>
                            <th className="p-3 font-semibold text-right">Əməliyyat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-100">
                          {overdueLombard.map((rec) => {
                            const receivable =
                              typeof rec.receivableAmount === "number" &&
                              rec.receivableAmount > 0
                                ? rec.receivableAmount
                                : rec.principalAmount * 1.15;
                            return (
                              <tr key={rec.id} className="bg-red-50/30 hover:bg-red-50">
                                <td className="p-3 font-bold text-slate-900">
                                  {rec.firstName} {rec.lastName}
                                  <span className="block text-xs font-normal text-slate-500">
                                    FİN: {rec.fin}
                                  </span>
                                </td>
                                <td className="p-3 text-xs text-slate-700">
                                  {rec.phones.join(" | ")}
                                </td>
                                <td className="p-3">{rec.receivedItem}</td>
                                <td className="p-3 font-bold text-red-600">
                                  {rec.unpaidCount} dəfə (+15%)
                                </td>
                                <td className="p-3 font-bold text-slate-900">
                                  {receivable.toFixed(2)} ₼
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleLombardMarkAsPaid(rec.id)}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-2 rounded-lg transition"
                                    >
                                      Ödənildi
                                    </button>
                                    <button
                                      onClick={() => handleLombardMarkAsUnpaid(rec.id)}
                                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-2.5 py-2 rounded-lg transition"
                                    >
                                      Ödənilmədi (+15%)
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* C) NİSYƏ GECİKMƏLƏRİ PƏNCƏRƏSİ */}
                {overdueSubTab === "nisye" && (
                  <div className="overflow-x-auto">
                    {overdueNisye.length === 0 ? (
                      <div className="text-center py-10 text-emerald-700 bg-emerald-50/50 rounded-xl">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                        <p className="font-medium">Hal-hazırda nisyə üzrə gecikən ödəniş yoxdur.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-red-200 text-red-800 bg-red-50">
                            <th className="p-3 font-semibold">Nisyə Müştəri & FİN</th>
                            <th className="p-3 font-semibold">Əlaqə Nömrələri</th>
                            <th className="p-3 font-semibold">Məhsul</th>
                            <th className="p-3 font-semibold">Gecikən Tarix</th>
                            <th className="p-3 font-semibold">Qalıq Məbləğ</th>
                            <th className="p-3 font-semibold text-right">Əməliyyat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-100">
                          {overdueNisye.map((rec) => {
                            const rem = Math.max(0, rec.totalAmount - rec.paidAmount);
                            return (
                              <tr key={rec.id} className="bg-red-50/30 hover:bg-red-50">
                                <td className="p-3 font-bold text-slate-900">
                                  {rec.firstName} {rec.lastName}
                                  <span className="block text-xs font-normal text-slate-500">
                                    FİN: {rec.fin}
                                  </span>
                                </td>
                                <td className="p-3 text-xs text-slate-700">
                                  {rec.phones.join(" | ")}
                                </td>
                                <td className="p-3">
                                  {rec.productName} ({rec.quantity} ədəd)
                                </td>
                                <td className="p-3 font-bold text-red-600">
                                  {formatDateAZ(rec.dueDate)}
                                </td>
                                <td className="p-3 font-bold text-slate-900">
                                  {rem.toFixed(2)} ₼
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => handleNisyeMarkAsPaid(rec.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
                                  >
                                    Ödənildi
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 5. HESABAT PƏNCƏRƏSİ */}
            {activeTab === "reports" && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                    <span className="text-xs font-semibold text-slate-500 uppercase">
                      Ümumi Kredit Satışı
                    </span>
                    <div className="text-2xl font-bold text-slate-900 mt-1">
                      {totalSalesAmount.toFixed(2)} ₼
                    </div>
                    <span className="text-xs text-slate-400">
                      Cəmi {records.length} müqavilə
                    </span>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                    <span className="text-xs font-semibold text-emerald-700 uppercase">
                      Kassaya Daxil Olan (İlkin + Aylıq)
                    </span>
                    <div className="text-2xl font-bold text-emerald-800 mt-1">
                      {totalPaidOverall.toFixed(2)} ₼
                    </div>
                    <span className="text-xs text-emerald-600">
                      İlkin ödənişlər: {totalDownPayments.toFixed(2)} ₼
                    </span>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                    <span className="text-xs font-semibold text-blue-700 uppercase">
                      Gözlənilən Qalıq Borc (Kredit + Nisyə)
                    </span>
                    <div className="text-2xl font-bold text-blue-800 mt-1">
                      {(totalRemainingOverall + totalNisyeRemaining).toFixed(2)} ₼
                    </div>
                    <span className="text-xs text-blue-600">
                      Nisyə qalıq: {totalNisyeRemaining.toFixed(2)} ₼
                    </span>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                    <span className="text-xs font-semibold text-amber-800 uppercase">
                      Lombard Qaytarılacaq Məbləğ
                    </span>
                    <div className="text-2xl font-bold text-amber-900 mt-1">
                      {totalLombardReceivable.toFixed(2)} ₼
                    </div>
                    <span className="text-xs text-amber-700">
                      Verilən əsas: {totalLombardPrincipal.toFixed(2)} ₼
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 6. AYLİQ GƏLİRLƏR PƏNCƏRƏSİ (Kredit / Nisyə / Lombard + 1-12 ay seçim xanası) */}
            {activeTab === "monthlyIncome" && (
              <div className="p-6 space-y-6">
                {/* 3 ayrı bölmə: Kredit üçün ayrı, Nisyə üçün ayrı, Lombard üçün ayrı */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIncomeSubTab("credit")}
                    className={`py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${
                      incomeSubTab === "credit"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-700 hover:bg-white"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Kredit Gəlirləri
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncomeSubTab("nisye")}
                    className={`py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${
                      incomeSubTab === "nisye"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-700 hover:bg-white"
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Nisyə Gəlirləri
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncomeSubTab("lombard")}
                    className={`py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${
                      incomeSubTab === "lombard"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "text-slate-700 hover:bg-white"
                    }`}
                  >
                    <Landmark className="w-4 h-4" />
                    Lombard Gəlirləri
                  </button>
                </div>

                {/* 12 Aylıq Sistem Xanası (1-ci aydan 12-ci aya qədər seçim) */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      12 Aylıq Sistem Seçimi (1-ci aydan {selectedMonth}-ci aya qədər olan göstəricilər)
                    </span>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="px-3 py-1.5 text-sm font-semibold bg-white border border-slate-300 rounded-lg outline-none focus:border-cyan-600"
                    >
                      {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
                        <option key={m} value={m}>
                          {m}-ci ay (1–{m} ay arası toplam)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-12 gap-2">
                    {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSelectedMonth(m)}
                        className={`py-2 px-2 rounded-lg text-xs font-bold border transition ${
                          selectedMonth === m
                            ? incomeSubTab === "credit"
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : incomeSubTab === "nisye"
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                              : "bg-amber-600 text-white border-amber-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {m}-ci ay
                      </button>
                    ))}
                  </div>
                </div>

                {/* A) KREDİT ÜZRƏ AYLİQ GƏLİRLƏR */}
                {incomeSubTab === "credit" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl">
                        <span className="text-xs font-bold text-emerald-700 uppercase">
                          {selectedMonth === 1
                            ? "1-ci ay üzrə kreditdən əldə olunan gəlir"
                            : `1–${selectedMonth}-ci aylara qədər kreditdən əldə olunan gəlir`}
                        </span>
                        <div className="text-3xl font-bold text-emerald-800 mt-2">
                          {creditEarnedUpToMonth.toFixed(2)} ₼
                        </div>
                        <p className="text-xs text-emerald-600 mt-1">
                          İlkin ödənişlər + "Ödənildi" düyməsi ilə təsdiqlənən aylıq ödənişlər
                        </p>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl">
                        <span className="text-xs font-bold text-blue-700 uppercase">
                          {selectedMonth === 1
                            ? "1-ci ay üzrə gəlməli olan (əldə ediləcək) ödəniş"
                            : `1–${selectedMonth}-ci aylara qədər gəlməli olan (əldə ediləcək) ödəniş`}
                        </span>
                        <div className="text-3xl font-bold text-blue-800 mt-2">
                          {creditExpectedUpToMonth.toFixed(2)} ₼
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          Hələ "Ödənildi" basılmamış aylıq ödənişlərin cəmi
                        </p>
                      </div>
                    </div>

                    {records.length > 0 && (
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                              <th className="p-3 font-semibold">Müştəri</th>
                              <th className="p-3 font-semibold">Aylıq Ödəniş</th>
                              <th className="p-3 font-semibold">Ödənildi (Ay)</th>
                              <th className="p-3 font-semibold text-emerald-700">
                                Əldə Edilən ({selectedMonth} aya qədər)
                              </th>
                              <th className="p-3 font-semibold text-blue-700">
                                Əldə Ediləcək ({selectedMonth} aya qədər)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {records.map((r) => {
                              const monthly = (r.totalPrice - r.downPayment) / r.months;
                              const paidInRange = Math.min(r.paidMonths, selectedMonth);
                              const scheduledInRange = Math.min(r.months, selectedMonth);
                              const earned = r.downPayment + monthly * paidInRange;
                              const expected =
                                Math.max(0, scheduledInRange - paidInRange) * monthly;
                              return (
                                <tr key={r.id}>
                                  <td className="p-3 font-semibold text-slate-900">
                                    {r.firstName} {r.lastName}
                                  </td>
                                  <td className="p-3">{monthly.toFixed(2)} ₼</td>
                                  <td className="p-3">
                                    {r.paidMonths} / {r.months} ay
                                  </td>
                                  <td className="p-3 font-bold text-emerald-700">
                                    {earned.toFixed(2)} ₼
                                  </td>
                                  <td className="p-3 font-bold text-blue-700">
                                    {expected.toFixed(2)} ₼
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* B) NİSYƏ ÜZRƏ AYLİQ GƏLİRLƏR */}
                {incomeSubTab === "nisye" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl">
                        <span className="text-xs font-bold text-emerald-700 uppercase">
                          {selectedMonth === 1
                            ? "1-ci ay üzrə nisyədən əldə olunan gəlir"
                            : `1–${selectedMonth}-ci aylara qədər nisyədən əldə olunan gəlir`}
                        </span>
                        <div className="text-3xl font-bold text-emerald-800 mt-2">
                          {nisyeEarnedUpToMonth.toFixed(2)} ₼
                        </div>
                        <p className="text-xs text-emerald-600 mt-1">
                          "Ödənildi" düyməsi ilə təsdiqlənmiş və ödənilmiş nisyə məbləğləri
                        </p>
                      </div>

                      <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-xl">
                        <span className="text-xs font-bold text-indigo-700 uppercase">
                          {selectedMonth === 1
                            ? "1-ci ay üzrə gəlməli olan (əldə ediləcək) nisyə ödənişi"
                            : `1–${selectedMonth}-ci aylara qədər gəlməli olan (əldə ediləcək) nisyə ödənişi`}
                        </span>
                        <div className="text-3xl font-bold text-indigo-800 mt-2">
                          {nisyeExpectedUpToMonth.toFixed(2)} ₼
                        </div>
                        <p className="text-xs text-indigo-600 mt-1">
                          Seçilən aya qədər qaytarılması gözlənilən nisyə qalıqları
                        </p>
                      </div>
                    </div>

                    {nisyeRecords.length > 0 && (
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                              <th className="p-3 font-semibold">Müştəri</th>
                              <th className="p-3 font-semibold">Məhsul</th>
                              <th className="p-3 font-semibold">Status</th>
                              <th className="p-3 font-semibold text-emerald-700">
                                Əldə Edilən
                              </th>
                              <th className="p-3 font-semibold text-indigo-700">
                                Əldə Ediləcək ({selectedMonth} aya qədər)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {nisyeRecords.map((r) => {
                              const dueMonthIdx = getMonthIndexFromIssue(
                                r.issueDate,
                                r.dueDate
                              );
                              const earned = r.isPaid ? r.totalAmount : r.paidAmount;
                              const expected =
                                !r.isPaid && dueMonthIdx <= selectedMonth
                                  ? Math.max(0, r.totalAmount - r.paidAmount)
                                  : 0;
                              return (
                                <tr key={r.id}>
                                  <td className="p-3 font-semibold text-slate-900">
                                    {r.firstName} {r.lastName}
                                  </td>
                                  <td className="p-3">{r.productName}</td>
                                  <td className="p-3">
                                    {r.isPaid ? (
                                      <span className="text-emerald-700 font-semibold">
                                        Ödənilib
                                      </span>
                                    ) : (
                                      <span className="text-amber-700 font-semibold">
                                        Gözlənilir ({formatDateAZ(r.dueDate)})
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 font-bold text-emerald-700">
                                    {earned.toFixed(2)} ₼
                                  </td>
                                  <td className="p-3 font-bold text-indigo-700">
                                    {expected.toFixed(2)} ₼
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* C) LOMBARD ÜZRƏ AYLİQ GƏLİRLƏR */}
                {incomeSubTab === "lombard" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl">
                        <span className="text-xs font-bold text-emerald-700 uppercase">
                          {selectedMonth === 1
                            ? "1-ci ay üzrə lombarddan əldə olunan gəlir"
                            : `1–${selectedMonth}-ci aylara qədər lombarddan əldə olunan gəlir`}
                        </span>
                        <div className="text-3xl font-bold text-emerald-800 mt-2">
                          {lombardEarnedUpToMonth.toFixed(2)} ₼
                        </div>
                        <p className="text-xs text-emerald-600 mt-1">
                          "Ödənildi" düyməsi basılaraq qəbul edilmiş lombard ödənişləri
                        </p>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl">
                        <span className="text-xs font-bold text-amber-800 uppercase">
                          {selectedMonth === 1
                            ? "1-ci ay üzrə gəlməli olan (əldə ediləcək) lombard ödənişi"
                            : `1–${selectedMonth}-ci aylara qədər gəlməli olan (əldə ediləcək) lombard ödənişi`}
                        </span>
                        <div className="text-3xl font-bold text-amber-900 mt-2">
                          {lombardExpectedUpToMonth.toFixed(2)} ₼
                        </div>
                        <p className="text-xs text-amber-700 mt-1">
                          Qaytarılması gözlənilən lombard məbləğləri (+15% daxil)
                        </p>
                      </div>
                    </div>

                    {lombardRecords.length > 0 && (
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                              <th className="p-3 font-semibold">Müştəri</th>
                              <th className="p-3 font-semibold">Alınan Məhsul</th>
                              <th className="p-3 font-semibold">Ödənildi Sayı</th>
                              <th className="p-3 font-semibold text-emerald-700">
                                Əldə Edilən ({selectedMonth} aya qədər)
                              </th>
                              <th className="p-3 font-semibold text-amber-800">
                                Əldə Ediləcək
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {lombardRecords.map((r) => {
                              const receivable =
                                typeof r.receivableAmount === "number" &&
                                r.receivableAmount > 0
                                  ? r.receivableAmount
                                  : r.principalAmount * 1.15;
                              const paidInRange = Math.min(r.paidCycles, selectedMonth);
                              const earned = receivable * paidInRange;
                              const expected =
                                selectedMonth - r.paidCycles > 0 ? receivable : 0;
                              return (
                                <tr key={r.id}>
                                  <td className="p-3 font-semibold text-slate-900">
                                    {r.firstName} {r.lastName}
                                  </td>
                                  <td className="p-3">{r.receivedItem}</td>
                                  <td className="p-3">{r.paidCycles} dəfə</td>
                                  <td className="p-3 font-bold text-emerald-700">
                                    {earned.toFixed(2)} ₼
                                  </td>
                                  <td className="p-3 font-bold text-amber-800">
                                    {expected.toFixed(2)} ₼
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* KASSİR QEYDİYYAT FORMU (1. Kredit | 2. Lombard | 3. Nisyə) */}
        {!isAdminOpen && (
          <main className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <PlusCircle className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">{currentModeTitle}</h2>
              </div>

              {successMsg && (
                <span className="bg-emerald-100 text-emerald-800 text-sm font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {successMsg}
                </span>
              )}
            </div>

            <form
              onSubmit={
                activeMode === "credit"
                  ? handleAddCredit
                  : activeMode === "lombard"
                  ? handleAddLombard
                  : handleAddNisye
              }
              className="space-y-6"
            >
              {/* 1. Müştəri Məlumatları */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  1. Müştəri Məlumatları
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Müştərinin Adı *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Məs: Əli"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Müştərinin Soyadı *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Məs: Məmmədov"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      FİN Kodu *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={7}
                      placeholder="7 simvollu FİN"
                      value={fin}
                      onChange={(e) => setFin(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Minimum 3 Əlaqə Nömrəsi */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-blue-600" />
                    Əlaqə Nömrələri (Minimum 3 ədəd məcburidir) *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="tel"
                      required
                      placeholder="1-ci nömrə: +994 50 000 00 00"
                      value={phone1}
                      onChange={(e) => setPhone1(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="2-ci nömrə (Qohum/Ev): +994 55 000 00 00"
                      value={phone2}
                      onChange={(e) => setPhone2(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="3-cü nömrə (Əlavə): +994 70 000 00 00"
                      value={phone3}
                      onChange={(e) => setPhone3(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* 2. Məhsul Məlumatları */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-blue-600" />
                  2. Məhsul Məlumatları
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {activeMode === "lombard" ? "Alınan məhsul *" : "Məhsulun Adı *"}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={
                          activeMode === "lombard"
                            ? "Məs: Qızıl boyunbağı / iPhone 16"
                            : "Məs: iPhone 16 Pro Max 256GB"
                        }
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    {/* Lombard pəncərəsində "Alınan məhsul" altında "verilen mebleğ" */}
                    {activeMode === "lombard" && (
                      <div>
                        <label className="block text-sm font-medium text-amber-900 mb-1">
                          Verilən məbləğ (₼) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          placeholder="Məhsula verilən məbləğ"
                          value={givenAmountForItem}
                          onChange={(e) => setGivenAmountForItem(e.target.value)}
                          className="w-full px-3.5 py-2 border border-amber-300 bg-amber-50/40 rounded-lg font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Xüsusi çərçivədə Miqdar xanası */}
                  <div className="border-2 border-blue-500 bg-blue-50/40 p-2.5 rounded-xl h-fit">
                    <label className="block text-xs font-bold text-blue-800 uppercase mb-1">
                      Miqdar (Neçə ədəd) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="h-fit">
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      Verilmə Tarixi *
                    </label>
                    <input
                      type="date"
                      required
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Məhsul Haqqında (Qeyd / Seriya nömrəsi / Rəng)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Məhsulun texniki göstəriciləri, IMEI və ya əlavə qeydlər..."
                      value={productDesc}
                      onChange={(e) => setProductDesc(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* 3. KREDİT / LOMBARD / NİSYƏ ŞƏRTLƏRİ */}
              {activeMode === "credit" && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
                    3. Kredit və Ödəniş Şərtləri
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Məhsulun Kredit Qiyməti (TOPLAM ₼) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        placeholder="Məs: 2800"
                        value={totalPrice}
                        onChange={(e) => setTotalPrice(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Alınan İlkin Ödəniş (₼)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        value={downPayment}
                        onChange={(e) => setDownPayment(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-lg font-semibold text-emerald-700 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Neçə Aylıq Kreditə Bölündü *
                      </label>
                      <select
                        value={months}
                        onChange={(e) => setMonths(Number(e.target.value))}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-lg bg-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {[3, 6, 9, 12, 15, 18, 24, 36].map((m) => (
                          <option key={m} value={m}>
                            {m} ay
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {previewTotal > 0 && (
                    <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                      <div className="text-sm text-slate-600">
                        Qalıq kredit məbləği:{" "}
                        <span className="font-bold text-slate-900">
                          {previewRemaining.toFixed(2)} ₼
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">
                        Hesablanmış aylıq ödəniş:{" "}
                        <span className="text-lg font-bold text-blue-600">
                          {previewMonthly.toFixed(2)} ₼ / ay
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeMode === "lombard" && (
                <div>
                  <h3 className="text-sm font-semibold text-amber-900 uppercase tracking-wider mb-3">
                    3. Lombard və 15% Hesablama Şərtləri
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Verilən məbləğ (₼) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        placeholder="Məs: 600"
                        value={lombardPrincipal}
                        onChange={(e) => setLombardPrincipal(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        İlkin ödəniş / Faiz dərəcəsi (%)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value="15% (Avtomatik)"
                        className="w-full px-3.5 py-2 border border-amber-300 bg-amber-50 text-amber-900 rounded-lg font-bold outline-none cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Qaytarılacaq məbləğ (Verilən məbləğ + 15%)
                      </label>
                      <div className="w-full px-3.5 py-2 border border-slate-300 bg-slate-50 rounded-lg font-bold text-slate-900 flex items-center justify-between">
                        <span>{previewLombardReceivable.toFixed(2)} ₼</span>
                        <span className="text-xs font-normal text-slate-500">
                          (+{previewLombard15Amount.toFixed(2)} ₼)
                        </span>
                      </div>
                    </div>
                  </div>

                  {previewLombardPrincipal > 0 && (
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                      <div className="text-sm text-amber-900">
                        15% əlavə:{" "}
                        <span className="font-bold">
                          +{previewLombard15Amount.toFixed(2)} ₼
                        </span>
                      </div>
                      <div className="text-sm text-amber-950">
                        Qaytarılacaq məbləğ:{" "}
                        <span className="text-lg font-bold text-amber-700">
                          {previewLombardReceivable.toFixed(2)} ₼
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeMode === "nisye" && (
                <div>
                  <h3 className="text-sm font-semibold text-emerald-900 uppercase tracking-wider mb-3">
                    3. Nisyə Ödəniş Şərtləri
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Nisyə Məbləği (TOPLAM ₼) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        placeholder="Məs: 150"
                        value={nisyeAmount}
                        onChange={(e) => setNisyeAmount(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Ödənilən Məbləğ (₼)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        value={nisyePaid}
                        onChange={(e) => setNisyePaid(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-lg font-semibold text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Qaytarılma Tarixi *
                      </label>
                      <input
                        type="date"
                        required
                        value={nisyeDueDate}
                        onChange={(e) => setNisyeDueDate(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className={`w-full md:w-auto text-white font-semibold px-8 py-3 rounded-xl shadow-md transition ${
                    activeMode === "credit"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : activeMode === "lombard"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {currentSubmitLabel}
                </button>
              </div>
            </form>
          </main>
        )}
      </div>
    </div>
  );
}

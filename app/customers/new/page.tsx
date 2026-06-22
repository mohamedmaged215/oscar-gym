"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { addCustomer, addPayment } from "../../lib/firebaseUtils";
import { calculateEndDate, calculateStatus } from "../../lib/customerUtils";

export default function NewCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    startDate: "",
    durationDays: "30",
    price: "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const endDate =
    form.startDate && form.durationDays
      ? calculateEndDate(form.startDate, Number(form.durationDays))
      : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!endDate) return;
    setSaving(true);

    const status = calculateStatus(endDate);
    const customerId = await addCustomer({
      name: form.name.trim(),
      phone: form.phone.trim(),
      subscriptionType: "monthly",
      startDate: form.startDate,
      endDate,
      durationDays: Number(form.durationDays),
      price: Number(form.price),
      status,
    });
    await addPayment({ customerId, amount: Number(form.price), date: form.startDate });

    router.push("/customers");
  }

  return (
    <div className="min-h-full bg-gray-50/50 pb-24 sm:pb-8">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition mb-4 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            رجوع
          </button>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">إضافة اشتراك جديد</h2>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">الاسم</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="مثال: أحمد محمد"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">الهاتف</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="مثال: 01012345678"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">تاريخ البداية</label>
              <input
                required
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">المدة (أيام)</label>
              <input
                required
                type="number"
                min="1"
                value={form.durationDays}
                onChange={(e) => set("durationDays", e.target.value)}
                placeholder="30"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
              />
            </div>

            {endDate && (
              <div className="flex items-center gap-2 px-3.5 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 font-bold shadow-sm">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                تاريخ الانتهاء تلقائياً: <strong>{endDate}</strong>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">السعر (جنيه)</label>
              <input
                required
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="500"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-md shadow-blue-100 active:scale-[0.98]"
            >
              {saving ? "جارٍ الحفظ…" : "إضافة الاشتراك"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

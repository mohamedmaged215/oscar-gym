"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { getCustomers, updateCustomer } from "../../../lib/firebaseUtils";
import { calculateEndDate, calculateStatus } from "../../../lib/customerUtils";
import { Customer } from "../../../lib/types";

export default function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriptionType, setSubscriptionType] = useState<"monthly" | "session">("monthly");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    startDate: "",
    durationDays: "",
    price: "",
  });

  useEffect(() => {
    getCustomers().then((customers) => {
      const c = customers.find((x: Customer) => x.id === id);
      if (c) {
        setSubscriptionType(c.subscriptionType ?? "monthly");
        setForm({
          name: c.name,
          phone: c.phone,
          startDate: c.startDate || "",
          durationDays: c.durationDays ? String(c.durationDays) : "",
          price: String(c.price),
        });
      }
      setLoading(false);
    });
  }, [id]);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const endDate =
    subscriptionType === "monthly" && form.startDate && form.durationDays
      ? calculateEndDate(form.startDate, Number(form.durationDays))
      : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (subscriptionType === "monthly" && !endDate) { setSaving(false); return; }
    setSaving(true);

    if (subscriptionType === "session") {
      await updateCustomer(id, {
        name: form.name.trim(),
        phone: "",
        price: Number(form.price),
        subscriptionType: "session",
        status: "session",
      });
    } else {
      const status = calculateStatus(endDate, "monthly");
      await updateCustomer(id, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        startDate: form.startDate,
        endDate,
        durationDays: Number(form.durationDays),
        price: Number(form.price),
        status,
        subscriptionType: "monthly",
      });
    }

    router.push("/customers");
  }

  if (loading) {
    return (
      <div className="min-h-full bg-gray-50 pb-24">
        <Navbar />
        <main className="max-w-lg mx-auto px-4 sm:px-6 py-8">
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
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
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">تعديل الاشتراك</h2>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">نوع الاشتراك</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSubscriptionType("monthly")}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border transition duration-150 active:scale-95 ${
                    subscriptionType === "monthly"
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  شهري
                </button>
                <button
                  type="button"
                  onClick={() => setSubscriptionType("session")}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border transition duration-150 active:scale-95 ${
                    subscriptionType === "session"
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  حصة
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">الاسم</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
              />
            </div>

            {subscriptionType === "monthly" && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">الهاتف</label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
                />
              </div>
            )}

            {subscriptionType === "monthly" && (
              <>
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
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">السعر (جنيه)</label>
              <input
                required
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-md shadow-blue-100 active:scale-[0.98]"
            >
              {saving ? "جارٍ الحفظ…" : "حفظ التغييرات"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

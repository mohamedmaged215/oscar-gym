"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { addSale, getSales, deleteSale, getInventoryItems, decrementInventoryQuantity } from "../lib/firebaseUtils";
import { Sale, InventoryItem } from "../lib/types";

function DeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm border border-gray-100 transition-all">
        <h3 className="text-lg font-bold text-gray-900 mb-2">تأكيد الحذف</h3>
        <p className="text-sm text-gray-600 mb-6">هل أنت متأكد من حذف هذا المبيع؟</p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 active:scale-95 transition">حذف</button>
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 active:scale-95 transition">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ itemName: "", costPrice: "", sellPrice: "" });

  const profit =
    form.costPrice && form.sellPrice
      ? Number(form.sellPrice) - Number(form.costPrice)
      : null;

  async function load() {
    setLoading(true);
    const [salesData, invData] = await Promise.all([getSales(), getInventoryItems()]);
    salesData.sort((a, b) => b.date.localeCompare(a.date));
    setSales(salesData);
    setInventory(invData);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function handleItemNameChange(name: string) {
    const match = inventory.find((i) => i.itemName === name);
    setForm((f) => ({
      ...f,
      itemName: name,
      costPrice: match ? String(match.costPrice) : f.costPrice,
    }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.itemName.trim() || !form.costPrice || !form.sellPrice) return;
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    const cost = Number(form.costPrice);
    const sell = Number(form.sellPrice);
    await addSale({
      itemName: form.itemName.trim(),
      price: sell,
      costPrice: cost,
      sellPrice: sell,
      profit: sell - cost,
      date: today,
    });
    await decrementInventoryQuantity(form.itemName.trim());
    setForm({ itemName: "", costPrice: "", sellPrice: "" });
    await load();
    setSaving(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteSale(deleteTarget);
    setSales((prev) => prev.filter((s) => s.id !== deleteTarget));
    setDeleteTarget(null);
  }

  const totalSell = sales.reduce((sum, s) => sum + (s.sellPrice ?? s.price), 0);
  const totalProfit = sales.reduce((sum, s) => sum + (s.profit ?? 0), 0);

  return (
    <div className="min-h-full bg-gray-50/50 pb-24 sm:pb-8">
      <Navbar />

      {deleteTarget && (
        <DeleteModal onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-6">المبيعات</h2>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">اسم الصنف</label>
                <input
                  required
                  type="text"
                  placeholder="اسم الصنف"
                  value={form.itemName}
                  list="inventory-items"
                  onChange={(e) => handleItemNameChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
                />
                <datalist id="inventory-items">
                  {inventory.map((i) => <option key={i.id} value={i.itemName} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">سعر التكلفة (جنيه)</label>
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="سعر التكلفة"
                  value={form.costPrice}
                  onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">سعر البيع (جنيه)</label>
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="سعر البيع"
                  value={form.sellPrice}
                  onChange={(e) => setForm((f) => ({ ...f, sellPrice: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {profit !== null ? (
                <span className={`text-sm font-bold ${profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                  الفائض المتوقع: {profit.toLocaleString()} جنيه
                </span>
              ) : (
                <span />
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-md shadow-blue-100 active:scale-[0.98]"
              >
                {saving ? "جارٍ الإضافة…" : "إضافة عملية بيع"}
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse border border-gray-150" />
            ))}
          </div>
        ) : sales.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-16 bg-white rounded-2xl border border-gray-200">لا توجد مبيعات.</p>
        ) : (
          <>
            {/* Mobile View: Cards Layout (sm:hidden) */}
            <div className="sm:hidden space-y-4">
              {sales.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-black text-gray-900 text-base leading-snug">{s.itemName}</h4>
                      <p className="text-xs text-gray-400 font-bold mt-0.5">{s.date}</p>
                    </div>
                    <button
                      onClick={() => setDeleteTarget(s.id)}
                      className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-500 active:scale-95 transition"
                      title="حذف"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                    <div>
                      <span className="text-gray-400 font-bold block mb-0.5">سعر البيع</span>
                      <span className="text-gray-700 font-black">{(s.sellPrice ?? s.price).toLocaleString()} جنيه</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block mb-0.5">الفائض</span>
                      {s.profit != null ? (
                        <span className={`font-black ${s.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {s.profit.toLocaleString()} جنيه
                        </span>
                      ) : (
                        <span className="text-gray-400 font-black">—</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table Layout (hidden sm:block) */}
            <div className="hidden sm:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-right px-5 py-4.5 font-bold text-gray-600">الصنف</th>
                      <th className="text-right px-5 py-4.5 font-bold text-gray-600">سعر البيع</th>
                      <th className="text-right px-5 py-4.5 font-bold text-gray-600">الفائض</th>
                      <th className="text-right px-5 py-4.5 font-bold text-gray-600">التاريخ</th>
                      <th className="text-left px-5 py-4.5 font-bold text-gray-600">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sales.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-4 font-bold text-gray-900">{s.itemName}</td>
                        <td className="px-5 py-4 text-gray-600 font-semibold">{(s.sellPrice ?? s.price).toLocaleString()} جنيه</td>
                        <td className="px-5 py-4 font-semibold">
                          {s.profit != null ? (
                            <span className={s.profit >= 0 ? "text-green-600" : "text-red-500"}>
                              {s.profit.toLocaleString()} جنيه
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-gray-600 font-semibold">{s.date}</td>
                        <td className="px-5 py-4 text-left">
                          <button
                            onClick={() => setDeleteTarget(s.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                            title="حذف"
                          >
                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {!loading && sales.length > 0 && (
          <div className="mt-6 flex justify-end gap-6 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <span className="text-sm font-bold text-gray-600">
              إجمالي البيع: <span className="text-blue-700 font-black">{totalSell.toLocaleString()} جنيه</span>
            </span>
            <span className="text-sm font-bold text-gray-600">
              إجمالي الفائض: <span className="text-green-600 font-black">{totalProfit.toLocaleString()} جنيه</span>
            </span>
          </div>
        )}
      </main>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { regionsApi } from '@/lib/api';
import type { Region } from '@/types';

interface RegionForm {
  key: string;
  nameUz: string;
  topicId: string;
  isActive: boolean;
}

const emptyForm: RegionForm = {
  key: '',
  nameUz: '',
  topicId: '',
  isActive: true,
};

export default function RegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RegionForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  function fetchRegions() {
    setLoading(true);
    regionsApi
      .list()
      .then(setRegions)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Xatolik'),
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchRegions();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(region: Region) {
    setEditingId(region.id);
    setForm({
      key: region.key,
      nameUz: region.nameUz,
      topicId: String(region.topicId),
      isActive: region.isActive,
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    const topicId = Number(form.topicId);
    if (!form.nameUz.trim()) {
      setFormError('Nomi kiritilishi shart');
      return;
    }
    if (isNaN(topicId) || topicId < 0) {
      setFormError("Topic ID to'g'ri kiritilishi shart");
      return;
    }

    setSaving(true);
    try {
      if (editingId !== null) {
        const updated = await regionsApi.update(editingId, {
          nameUz: form.nameUz.trim(),
          topicId,
          isActive: form.isActive,
        });
        setRegions((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r)),
        );
      } else {
        if (!form.key.trim()) {
          setFormError('Kalit kiritilishi shart');
          setSaving(false);
          return;
        }
        const created = await regionsApi.create({
          key: form.key.trim(),
          nameUz: form.nameUz.trim(),
          topicId,
          isActive: form.isActive,
        });
        setRegions((prev) => [...prev, created]);
      }
      setModalOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(region: Region) {
    try {
      const updated = await regionsApi.update(region.id, {
        isActive: !region.isActive,
      });
      setRegions((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Xatolik');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hududlar</h1>
          <p className="text-gray-500 text-sm mt-1">Jami: {regions.length}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yangi hudud
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 text-sm">{error}</div>
        ) : regions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Hududlar topilmadi
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">ID</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Kalit</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Nomi (UZ)</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Topic ID</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Holat</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {regions.map((region) => (
                  <tr key={region.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{region.id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">
                      {region.key}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {region.nameUz}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{region.topicId}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => void handleToggleActive(region)}
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          region.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {region.isActive ? 'Faol' : 'Faol emas'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(region)}
                        className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                      >
                        Tahrirlash
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">
                {editingId !== null ? 'Hududni tahrirlash' : 'Yangi hudud'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => void handleSave(e)} className="p-6 space-y-4">
              {editingId === null && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kalit (key)
                  </label>
                  <input
                    value={form.key}
                    onChange={(e) => setForm({ ...form, key: e.target.value })}
                    placeholder="toshkent"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomi (O&apos;zbekcha)
                </label>
                <input
                  value={form.nameUz}
                  onChange={(e) => setForm({ ...form, nameUz: e.target.value })}
                  placeholder="Toshkent"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telegram Topic ID
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.topicId}
                  onChange={(e) => setForm({ ...form, topicId: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 font-medium">
                  Faol holat
                </label>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

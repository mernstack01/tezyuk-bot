'use client';
import { useEffect, useState, useCallback } from 'react';
import { usersApi, settingsApi } from '@/lib/api';
import type { AppSettings, User } from '@/types';

const PAGE_SIZE = 20;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [globalLimitInput, setGlobalLimitInput] = useState('');
  const [savingGlobal, setSavingGlobal] = useState(false);

  const [editingLimitId, setEditingLimitId] = useState<string | null>(null);
  const [limitInput, setLimitInput] = useState('');
  const [savingLimitId, setSavingLimitId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await usersApi.list(page, PAGE_SIZE);
      setUsers(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    settingsApi.get().then((s) => {
      setSettings(s);
      setGlobalLimitInput(String(s.dailyOrderLimit));
    }).catch(() => {});
  }, []);

  async function handleToggleBlock(user: User) {
    const action = user.isBlocked ? 'blokdan chiqarish' : 'bloklash';
    if (!confirm(`${user.fullName} ni ${action}ni istaysizmi?`)) return;

    setTogglingId(user.id);
    try {
      const updated = await usersApi.toggleBlock(user.id);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleSaveGlobalLimit() {
    const val = parseInt(globalLimitInput, 10);
    if (!val || val < 1 || val > 100) {
      alert('Limit 1 dan 100 gacha bo\'lishi kerak');
      return;
    }
    setSavingGlobal(true);
    try {
      const updated = await settingsApi.update(val);
      setSettings(updated);
      setGlobalLimitInput(String(updated.dailyOrderLimit));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setSavingGlobal(false);
    }
  }

  function startEditLimit(user: User) {
    setEditingLimitId(user.id);
    setLimitInput(user.dailyOrderLimit != null ? String(user.dailyOrderLimit) : '');
  }

  async function handleSaveUserLimit(userId: string) {
    const raw = limitInput.trim();
    const limit = raw === '' ? null : parseInt(raw, 10);
    if (limit !== null && (isNaN(limit) || limit < 1 || limit > 100)) {
      alert('Limit 1 dan 100 gacha bo\'lishi kerak (bo\'sh = global default)');
      return;
    }
    setSavingLimitId(userId);
    try {
      const updated = await usersApi.setDailyLimit(userId, limit);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setEditingLimitId(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setSavingLimitId(null);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Global limit kartochkasi */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Kunlik buyurtma limiti (global)</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Alohida limit belgilanmagan foydalanuvchilarga qo'llaniladi
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={100}
              value={globalLimitInput}
              onChange={(e) => setGlobalLimitInput(e.target.value)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">ta / kun</span>
            <button
              onClick={() => void handleSaveGlobalLimit()}
              disabled={savingGlobal || globalLimitInput === String(settings?.dailyOrderLimit)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingGlobal ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Foydalanuvchilar</h1>
          <p className="text-gray-500 text-sm mt-1">Jami: {total}</p>
        </div>
        <button
          onClick={() => void fetchUsers()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          Yangilash
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 text-sm">{error}</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Foydalanuvchilar topilmadi
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Ism</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Telefon</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Telegram ID</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Til</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Holat</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Kunlik limit</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Ro&apos;yxatdan o&apos;tgan</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{user.fullName}</td>
                    <td className="px-4 py-3 text-gray-700">{user.phone}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{user.telegramId}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium uppercase">
                        {user.language}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.isBlocked ? (
                        <span className="inline-flex px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                          Bloklangan
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Faol
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingLimitId === user.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            placeholder={String(settings?.dailyOrderLimit ?? 12)}
                            value={limitInput}
                            onChange={(e) => setLimitInput(e.target.value)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={() => void handleSaveUserLimit(user.id)}
                            disabled={savingLimitId === user.id}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                          >
                            {savingLimitId === user.id ? '...' : '✓'}
                          </button>
                          <button
                            onClick={() => setEditingLimitId(null)}
                            className="px-2 py-1 text-gray-500 hover:text-gray-700 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditLimit(user)}
                          className="group flex items-center gap-1.5 text-xs"
                        >
                          {user.dailyOrderLimit != null ? (
                            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium">
                              {user.dailyOrderLimit} ta
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-400 rounded-full">
                              global ({settings?.dailyOrderLimit ?? '...'})
                            </span>
                          )}
                          <span className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => void handleToggleBlock(user)}
                        disabled={togglingId === user.id}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                          user.isBlocked
                            ? 'text-green-700 bg-green-50 hover:bg-green-100'
                            : 'text-red-600 bg-red-50 hover:bg-red-100'
                        }`}
                      >
                        {togglingId === user.id
                          ? '...'
                          : user.isBlocked
                          ? 'Blokdan chiqarish'
                          : 'Bloklash'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} / {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Oldingi
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Keyingi →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useState, useCallback } from 'react';
import { usersApi } from '@/lib/api';
import type { User } from '@/types';

const PAGE_SIZE = 20;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

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

  async function handleToggleBlock(user: User) {
    const action = user.isBlocked ? 'blokdan chiqarish' : 'bloklash';
    if (!confirm(`${user.fullName} ni ${action}ni istaysizmi?`)) return;

    setTogglingId(user.id);
    try {
      const updated = await usersApi.toggleBlock(user.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u)),
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setTogglingId(null);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
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
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Ro&apos;yxatdan o&apos;tgan</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {user.fullName}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{user.phone}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {user.telegramId}
                    </td>
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

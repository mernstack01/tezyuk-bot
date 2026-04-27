'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ordersApi, regionsApi } from '@/lib/api';
import type { Order, OrderStatus, Region } from '@/types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Kutilmoqda',
  active: 'Faol',
  cancelled: 'Bekor',
  completed: 'Topildi',
  expired: 'Muddati tugadi',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  completed: 'bg-blue-100 text-blue-700',
  expired: 'bg-gray-100 text-gray-500',
};

const PAGE_SIZE = 20;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [region, setRegion] = useState('');
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ordersApi.list({
        status: status || undefined,
        region: region || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setOrders(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setLoading(false);
    }
  }, [status, region, page]);

  useEffect(() => {
    regionsApi.list().then(setRegions).catch(() => {});
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handleFilterChange() {
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buyurtmalar</h1>
          <p className="text-gray-500 text-sm mt-1">Jami: {total}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as OrderStatus | '');
            handleFilterChange();
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Barcha statuslar</option>
          <option value="pending">Kutilmoqda</option>
          <option value="active">Faol</option>
          <option value="cancelled">Bekor</option>
          <option value="completed">Topildi</option>
          <option value="expired">Muddati tugadi</option>
        </select>

        <select
          value={region}
          onChange={(e) => {
            setRegion(e.target.value);
            handleFilterChange();
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Barcha hududlar</option>
          {regions.map((r) => (
            <option key={r.id} value={r.key}>
              {r.nameUz}
            </option>
          ))}
        </select>

        <button
          onClick={() => void fetchOrders()}
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
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Buyurtmalar topilmadi
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Foydalanuvchi</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Yo&apos;nalish</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Yuk</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Narx</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Sana</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {order.user?.fullName ?? '—'}
                      </div>
                      <div className="text-gray-500 text-xs">{order.user?.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div>
                        {order.fromRegion}{order.fromDistrict ? `, ${order.fromDistrict}` : ''}
                      </div>
                      <div className="text-gray-400">↓</div>
                      <div>
                        {order.toRegion}{order.toDistrict ? `, ${order.toDistrict}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div>{order.cargoName}</div>
                      <div className="text-xs text-gray-500">{order.weight} | {order.truckType}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{order.price || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}
                      >
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleString('uz-UZ', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-xs"
                      >
                        Ko&apos;rish
                      </Link>
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

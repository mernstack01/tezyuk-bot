'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ordersApi } from '@/lib/api';
import type { Order, OrderStatus } from '@/types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Kutilmoqda',
  active: 'Faol',
  cancelled: 'Bekor',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex py-3 border-b border-gray-100 last:border-0">
      <dt className="w-44 text-sm text-gray-500 font-medium flex-shrink-0">{label}</dt>
      <dd className="text-sm text-gray-900 flex-1">{value}</dd>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    ordersApi
      .getById(id)
      .then(setOrder)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Xatolik'),
      )
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusChange(newStatus: OrderStatus) {
    if (!order) return;
    setUpdating(true);
    try {
      const updated = await ordersApi.updateStatus(id, newStatus);
      setOrder(updated);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setUpdating(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Buyurtmani bekor qilmoqchimisiz?")) return;
    setCancelling(true);
    try {
      await ordersApi.cancel(id);
      router.push('/orders');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Xatolik');
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
        {error || 'Buyurtma topilmadi'}
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href="/orders"
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Buyurtma tafsiloti</h1>
          <p className="text-gray-500 text-xs font-mono mt-0.5">{order.id}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Buyurtma ma&apos;lumotlari
        </h2>
        <dl>
          <DetailRow
            label="Status"
            value={
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                {STATUS_LABELS[order.status]}
              </span>
            }
          />
          <DetailRow label="Yuklash hududi" value={order.fromRegion} />
          <DetailRow label="Tushirish hududi" value={order.toRegion} />
          <DetailRow label="Yuk nomi" value={order.cargoName} />
          <DetailRow label="Og'irlik" value={order.weight} />
          <DetailRow label="Mashina turi" value={order.truckType} />
          <DetailRow label="Narx" value={order.price || '—'} />
          <DetailRow
            label="Yaratilgan"
            value={new Date(order.createdAt).toLocaleString('uz-UZ')}
          />
        </dl>
      </div>

      {order.user && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Foydalanuvchi
          </h2>
          <dl>
            <DetailRow label="Ism" value={order.user.fullName} />
            <DetailRow label="Telefon" value={order.user.phone} />
            <DetailRow label="Telegram ID" value={String(order.user.telegramId)} />
            <DetailRow label="Til" value={order.user.language.toUpperCase()} />
            <DetailRow
              label="Holat"
              value={
                order.user.isBlocked ? (
                  <span className="text-red-600 text-xs font-medium">Bloklangan</span>
                ) : (
                  <span className="text-green-600 text-xs font-medium">Faol</span>
                )
              }
            />
          </dl>
        </div>
      )}

      {order.status !== 'cancelled' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Amallar
          </h2>
          <div className="flex flex-wrap gap-3">
            {order.status === 'pending' && (
              <button
                onClick={() => void handleStatusChange('active')}
                disabled={updating}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                Faollashtirish
              </button>
            )}
            {order.status === 'active' && (
              <button
                onClick={() => void handleStatusChange('pending')}
                disabled={updating}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                Kutish holatiga qaytarish
              </button>
            )}
            <button
              onClick={() => void handleCancel()}
              disabled={cancelling}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              {cancelling ? 'Bekor qilinmoqda...' : 'Bekor qilish'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

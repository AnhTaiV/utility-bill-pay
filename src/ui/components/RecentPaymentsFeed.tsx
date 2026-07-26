'use client';

import { useEffect, useState } from 'react';

interface PaymentEvent {
  id: number;
  eventType: string;
  txHash: string;
  amount: string;
  memo: string | null;
  fromAddress: string | null;
  toAddress: string | null;
  createdAt: string;
}

export function RecentPaymentsFeed() {
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchEvents() {
      try {
        const res = await fetch('/api/events');
        const json = await res.json();
        if (!json.ok) return;
        if (!cancelled) {
          setEvents(json.data ?? []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-yellow-50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-4xl mb-2">📡</p>
        <p className="text-gray-500 text-sm font-body">No payments yet</p>
        <p className="text-gray-400 text-xs mt-1">Waiting for Horizon SSE...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          className="bg-white border border-yellow-100 rounded-lg p-3 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-heading font-semibold text-gray-900 text-sm truncate">
                {event.memo ?? 'Payment'}
              </p>
              <p className="text-gray-500 text-xs font-mono truncate mt-0.5">
                {event.txHash.slice(0, 16)}...
              </p>
            </div>
            <span className="text-green-600 font-heading font-bold text-sm ml-2 flex-shrink-0">
              +{parseFloat(event.amount).toFixed(2)} USDC
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-1">
            {new Date(event.createdAt).toLocaleTimeString('en-PH')}
          </p>
        </div>
      ))}
    </div>
  );
}

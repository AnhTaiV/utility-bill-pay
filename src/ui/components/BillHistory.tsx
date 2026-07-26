'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from './StatusBadge';

interface Bill {
  id: number;
  userName: string;
  billerName: string;
  billerType: string;
  accountNumber: string;
  amountPhp: number;
  amountUsdc: string;
  memoRef: string;
  status: string;
  txHash: string | null;
  sep38Rate: string | null;
  createdAt: string;
  paidAt: string | null;
  settledAt: string | null;
}

const typeIcons: Record<string, string> = {
  electricity: '⚡',
  water: '💧',
  internet: '🌐',
  gas: '🔥',
};

export function BillHistory() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bills?user=Nida+Reyes')
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setBills(json.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-yellow-100" />
        ))}
      </div>
    );
  }

  if (bills.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-yellow-100 p-8 text-center">
        <p className="text-4xl mb-2">📋</p>
        <p className="text-gray-500 font-body">No bills yet</p>
        <p className="text-gray-400 text-sm mt-1">Pay a bill to see it here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="bill-history">
      {bills.map((bill) => (
        <Link key={bill.id} href={`/bill/${bill.id}`}>
          <div className="bg-white rounded-xl border border-yellow-100 p-4 shadow-sm hover:border-yellow-300 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{typeIcons[bill.billerType] ?? '📄'}</span>
                <div>
                  <p className="font-heading font-semibold text-gray-900">
                    {bill.billerName}
                  </p>
                  <p className="text-gray-500 text-xs font-body mt-0.5">
                    {bill.memoRef}
                  </p>
                  {bill.txHash && (
                    <p className="text-gray-400 text-xs font-mono mt-0.5">
                      {bill.txHash.slice(0, 20)}...
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="font-heading font-bold text-gray-900">
                  ₱{bill.amountPhp.toLocaleString('en-PH')}
                </p>
                <p className="text-gray-400 text-xs">
                  {parseFloat(bill.amountUsdc).toFixed(4)} USDC
                </p>
                <div className="mt-1.5">
                  <StatusBadge status={bill.status} />
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

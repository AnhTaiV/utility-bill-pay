'use client';

import { useEffect, useState } from 'react';

interface Rate {
  pair: string;
  rate: string;
  validUntil: string;
  source: string;
}

export function RateWidget() {
  const [rate, setRate] = useState<Rate | null>(null);

  useEffect(() => {
    fetch('/api/rates')
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setRate(json.data);
      })
      .catch(() => {});
  }, []);

  if (!rate) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2">
        <p className="text-yellow-600 text-xs font-heading">SEP-38 Rate loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2" data-testid="rate-widget">
      <p className="text-yellow-600 text-xs font-heading uppercase tracking-wide">
        SEP-38 Live Rate
      </p>
      <p className="font-heading font-bold text-yellow-800 text-lg">
        1 USDC = ₱{parseFloat(rate.rate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
      </p>
      <p className="text-yellow-500 text-xs">
        Valid until {new Date(rate.validUntil).toLocaleTimeString('en-PH')}
      </p>
    </div>
  );
}

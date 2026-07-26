'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { generateMemoRef, generateSep7Uri, phpToUsdc } from '@/server/lib/billing';

const BILLERS: Record<string, Array<{ name: string; type: string }>> = {
  electricity: [
    { name: 'MERALCO', type: 'electricity' },
    { name: 'Davao Light', type: 'electricity' },
    { name: 'Cebu Electric', type: 'electricity' },
  ],
  water: [
    { name: 'Manila Water', type: 'water' },
    { name: 'Maynilad', type: 'water' },
    { name: 'Davao City Water', type: 'water' },
  ],
  internet: [
    { name: 'PLDT Fiber', type: 'internet' },
    { name: 'Globe Broadband', type: 'internet' },
    { name: 'Converge ICT', type: 'internet' },
  ],
  gas: [
    { name: 'Petron LPG', type: 'gas' },
    { name: 'Shell Gas', type: 'gas' },
    { name: 'Total Gas PH', type: 'gas' },
  ],
};

const DEMO_DESTINATION = 'GDEMOHOUSEHOULDPAYMENTDESTINATIONSTELLARADDRESSXXXXXX';
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const SEP38_RATE = 162.5;

export function BillPayForm() {
  const [billerType, setBillerType] = useState<string>('electricity');
  const [billerName, setBillerName] = useState<string>('MERALCO');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [amountPhp, setAmountPhp] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [sep7Uri, setSep7Uri] = useState<string>('');
  const [memo, setMemo] = useState<string>('');

  const usdcAmount = amountPhp ? phpToUsdc(Number(amountPhp), SEP38_RATE) : '0.0000000';
  const selectedBillers = BILLERS[billerType] ?? [];

  function handleTypeChange(type: string) {
    setBillerType(type);
    setBillerName(BILLERS[type]?.[0]?.name ?? '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountNumber || !amountPhp || Number(amountPhp) <= 0) {
      toast.error('Please fill all fields');
      return;
    }

    setSubmitting(true);
    try {
      const memoRef = generateMemoRef(billerName, accountNumber, Number(amountPhp));
      const uri = generateSep7Uri({
        destination: DEMO_DESTINATION,
        amount: usdcAmount,
        assetCode: 'USDC',
        assetIssuer: USDC_ISSUER,
        memo: memoRef,
      });

      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billerName,
          billerType,
          accountNumber,
          amountPhp: Number(amountPhp),
          rate: SEP38_RATE,
        }),
      });

      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error?.message ?? 'Failed to create bill');
        return;
      }

      setMemo(memoRef);
      setSep7Uri(uri);
      toast.success(`Bill created! Memo: ${memoRef}`);
    } catch {
      toast.error('Network error — please try again');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="bill-pay-form">
      {/* Biller type */}
      <div>
        <label className="block text-sm font-heading font-medium text-gray-700 mb-1.5">
          Bill Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries({ electricity: '⚡ Electricity', water: '💧 Water', internet: '🌐 Internet', gas: '🔥 Gas' }).map(([type, label]) => (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeChange(type)}
              className={`px-3 py-2 rounded-lg text-sm font-heading border transition-all ${
                billerType === type
                  ? 'bg-yellow-100 border-yellow-400 text-yellow-800 font-semibold'
                  : 'border-gray-200 text-gray-600 hover:border-yellow-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Biller */}
      <div>
        <label className="block text-sm font-heading font-medium text-gray-700 mb-1.5">
          Biller
        </label>
        <select
          value={billerName}
          onChange={(e) => setBillerName(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-yellow-400"
          data-testid="biller-select"
        >
          {selectedBillers.map((b) => (
            <option key={b.name} value={b.name}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Account number */}
      <div>
        <label className="block text-sm font-heading font-medium text-gray-700 mb-1.5">
          Account / Reference Number
        </label>
        <input
          type="text"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="e.g. 123456789"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-yellow-400"
          data-testid="account-input"
        />
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-heading font-medium text-gray-700 mb-1.5">
          Amount (PHP ₱)
        </label>
        <input
          type="number"
          value={amountPhp}
          onChange={(e) => setAmountPhp(e.target.value)}
          placeholder="e.g. 2600"
          min="1"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-yellow-400"
          data-testid="amount-input"
        />
      </div>

      {/* USDC preview */}
      {amountPhp && Number(amountPhp) > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3" data-testid="usdc-preview">
          <p className="text-yellow-700 text-xs font-heading font-medium">You pay (USDC)</p>
          <p className="font-heading font-bold text-yellow-800 text-lg">
            {parseFloat(usdcAmount).toFixed(4)} USDC
          </p>
          <p className="text-yellow-600 text-xs">@ 1 USDC = ₱{SEP38_RATE.toFixed(2)}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-heading font-semibold py-3 rounded-xl transition-colors"
        data-testid="submit-bill"
      >
        {submitting ? 'Processing...' : '⚡ Pay Bill with USDC'}
      </button>

      {/* SEP-7 URI result */}
      {sep7Uri && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg" data-testid="sep7-result">
          <p className="font-heading font-semibold text-green-800 text-sm mb-1">
            ✅ Bill created — scan to pay
          </p>
          <p className="text-green-700 text-xs font-mono mb-2 break-all">
            Memo: {memo}
          </p>
          <a
            href={sep7Uri}
            className="text-green-600 text-xs underline break-all"
          >
            SEP-7 Pay URI
          </a>
        </div>
      )}
    </form>
  );
}

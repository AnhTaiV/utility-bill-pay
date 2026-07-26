import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/ui/components/Sidebar';
import { StatusBadge } from '@/ui/components/StatusBadge';
import { getBill } from '@/server/service/bills.service';

const typeIcons: Record<string, string> = {
  electricity: '⚡',
  water: '💧',
  internet: '🌐',
  gas: '🔥',
};

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const billId = Number(id);
  if (isNaN(billId)) notFound();

  let bill;
  try {
    bill = await getBill(billId);
  } catch {
    notFound();
  }

  const isSettled = bill.status === 'settled';
  const isPaid = bill.status === 'paid';

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 min-w-0 bg-yellow-50/30 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Back */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-yellow-600 hover:text-yellow-700 font-heading text-sm mb-6"
          >
            ← Back to Dashboard
          </Link>

          {/* Bill card */}
          <div className="bg-white rounded-2xl border border-yellow-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-500 to-amber-500 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{typeIcons[bill.billerType] ?? '📄'}</span>
                  <div>
                    <h1 className="font-heading font-bold text-xl">{bill.billerName}</h1>
                    <p className="text-yellow-100 text-sm capitalize">{bill.billerType} bill</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-heading font-bold text-3xl">
                    ₱{bill.amountPhp.toLocaleString('en-PH')}
                  </p>
                  <p className="text-yellow-100 text-sm">
                    {parseFloat(bill.amountUsdc).toFixed(4)} USDC
                  </p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm font-body">Status</span>
                <StatusBadge status={bill.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm font-body">Account Number</span>
                <span className="font-mono text-gray-900 text-sm">{bill.accountNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm font-body">Memo Reference</span>
                <span className="font-mono text-gray-900 text-sm">{bill.memoRef}</span>
              </div>
              {bill.sep38Rate && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm font-body">SEP-38 Rate Used</span>
                  <span className="font-heading font-semibold text-yellow-700 text-sm" data-testid="sep38-rate">
                    1 USDC = ₱{parseFloat(bill.sep38Rate).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm font-body">Created</span>
                <span className="text-gray-900 text-sm">
                  {new Date(bill.createdAt).toLocaleDateString('en-PH', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
              </div>
              {bill.paidAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm font-body">Paid At</span>
                  <span className="text-gray-900 text-sm">
                    {new Date(bill.paidAt).toLocaleString('en-PH')}
                  </span>
                </div>
              )}
              {bill.settledAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm font-body">Settled At</span>
                  <span className="text-green-700 text-sm font-semibold">
                    {new Date(bill.settledAt).toLocaleString('en-PH')}
                  </span>
                </div>
              )}
            </div>

            {/* TX Hash — proof of payment */}
            {bill.txHash && (
              <div className="px-6 pb-5">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4" data-testid="tx-hash-section">
                  <p className="font-heading font-semibold text-green-800 text-sm mb-1">
                    ✅ On-Chain Proof of Payment
                  </p>
                  <p className="text-green-700 text-xs font-body mb-2">
                    This transaction hash is immutably recorded on the Stellar blockchain.
                    It proves your bill was paid and cannot be forged.
                  </p>
                  <p className="font-mono text-green-700 text-xs break-all" data-testid="tx-hash">
                    {bill.txHash}
                  </p>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${bill.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-green-600 hover:text-green-700 text-xs underline"
                  >
                    View on Stellar Expert ↗
                  </a>
                </div>
              </div>
            )}

            {/* Pending — show SEP-7 QR info */}
            {bill.status === 'pending' && (
              <div className="px-6 pb-5">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4" data-testid="sep7-section">
                  <p className="font-heading font-semibold text-yellow-800 text-sm mb-2">
                    🔗 Pay with Stellar Wallet
                  </p>
                  <p className="text-yellow-700 text-xs font-body mb-2">
                    Scan the QR code or click the SEP-7 link to complete payment from your Stellar wallet.
                    Memo: <span className="font-mono font-semibold">{bill.memoRef}</span>
                  </p>
                  <p className="text-yellow-600 text-xs font-mono break-all">
                    web+stellar:pay?destination=GDEMOHOUSEHOLD...&amount={bill.amountUsdc}&memo={bill.memoRef}&memo_type=MEMO_TEXT
                  </p>
                </div>
              </div>
            )}

            {/* Proof of payment certificate */}
            {(isSettled || isPaid) && (
              <div className="px-6 pb-6">
                <div
                  className="border-2 border-dashed border-yellow-300 rounded-xl p-6 text-center"
                  data-testid="proof-certificate"
                >
                  <p className="text-4xl mb-2">🏆</p>
                  <h3 className="font-heading font-bold text-xl text-gray-900 mb-1">
                    Proof of Payment
                  </h3>
                  <p className="font-heading font-semibold text-yellow-600 text-lg mb-3">
                    {bill.billerName}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-left mb-4">
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-gray-500 text-xs">Amount</p>
                      <p className="font-heading font-bold text-gray-900">
                        ₱{bill.amountPhp.toLocaleString('en-PH')}
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-gray-500 text-xs">USDC</p>
                      <p className="font-heading font-bold text-gray-900">
                        {parseFloat(bill.amountUsdc).toFixed(4)}
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-gray-500 text-xs">Payer</p>
                      <p className="font-heading font-semibold text-gray-900">{bill.userName}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-gray-500 text-xs">Memo Ref</p>
                      <p className="font-heading font-semibold text-gray-900 text-xs">{bill.memoRef}</p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs">
                    Settled via SEP-24 anchor off-ramp on Stellar Testnet
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

import Link from 'next/link';
import { Sidebar } from '@/ui/components/Sidebar';
import { RecentPaymentsFeed } from '@/ui/components/RecentPaymentsFeed';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="bg-gradient-to-br from-yellow-50 to-amber-50 px-4 py-10 md:px-8 md:py-16 border-b border-yellow-100">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 text-xs font-heading font-semibold px-3 py-1.5 rounded-full mb-6">
              <span>⭐</span> Stellar APAC Hackathon 2025 — Track A: Payments
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Pay bills.<br />
              <span className="text-yellow-600">Keep USDC.</span><br />
              No bank needed.
            </h1>
            <p className="text-gray-600 text-lg mb-8 font-body leading-relaxed">
              BayadinBills lets underbanked Filipino households pay electricity, water,
              internet, and gas bills directly from their USDC wallet on Stellar.
              Our anchor off-ramps USDC to PHP and pays the biller — with on-chain proof.
            </p>
            <div className="flex flex-wrap gap-3 md:gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-heading font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                ⚡ Pay a Bill Now
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-white border border-yellow-200 text-yellow-700 font-heading font-semibold px-6 py-3 rounded-xl hover:bg-yellow-50 transition-colors"
              >
                📊 View Dashboard
              </Link>
            </div>
          </div>
        </section>

        <div className="flex flex-1 flex-col lg:flex-row">
          {/* How it works */}
          <section className="flex-1 px-4 py-8 md:px-8 md:py-10">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">
              How it works
            </h2>
            <div className="grid gap-4">
              {[
                {
                  step: '1',
                  icon: '💱',
                  title: 'Get a SEP-38 rate quote',
                  desc: 'We fetch the live USDC → PHP exchange rate from our anchor partner. Today: 1 USDC = ₱162.50',
                },
                {
                  step: '2',
                  icon: '🔖',
                  title: 'Memo-tagged payment',
                  desc: 'Your bill reference (e.g. MERALCO-123456789-2600) is encoded as a Stellar text memo. The transaction proves which bill you paid.',
                },
                {
                  step: '3',
                  icon: '📡',
                  title: 'SEP-7 pay URI + Horizon SSE',
                  desc: 'Scan the QR or click the pay link. We stream your payment confirmation live via Horizon SSE — no polling needed.',
                },
                {
                  step: '4',
                  icon: '🏦',
                  title: 'SEP-24 anchor off-ramp',
                  desc: 'Our anchor converts USDC → PHP and pays the biller directly. You get an on-chain tx_hash as proof of payment.',
                },
                {
                  step: '5',
                  icon: '✅',
                  title: 'Proof of Payment',
                  desc: 'Download your payment certificate with the tx_hash, memo ref, and settlement timestamp. No receipt can be forged.',
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 bg-white rounded-xl p-4 border border-yellow-100 shadow-sm">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 font-heading font-bold text-sm">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-gray-900">
                      {item.icon} {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1 font-body">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              {[
                { value: '₱4,379', label: 'Paid this month', sub: 'by Nida Reyes' },
                { value: '26.95 USDC', label: 'Total USDC used', sub: '~₱4,379 @ ₱162.50' },
                { value: '4 bills', label: 'Household bills', sub: 'PH utilities' },
              ].map((s) => (
                <div key={s.label} className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center">
                  <p className="font-heading font-bold text-2xl text-yellow-700">{s.value}</p>
                  <p className="font-heading font-medium text-gray-700 text-sm">{s.label}</p>
                  <p className="text-gray-500 text-xs font-body">{s.sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Live payments feed */}
          <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-yellow-100 px-4 md:px-6 py-8 lg:py-10">
            <h2 className="font-heading text-lg font-bold text-gray-900 mb-4">
              🔴 Live Payments
            </h2>
            <RecentPaymentsFeed />
          </aside>
        </div>
      </main>
    </div>
  );
}

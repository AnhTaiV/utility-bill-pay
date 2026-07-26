import { Suspense } from 'react';
import { Sidebar } from '@/ui/components/Sidebar';
import { BillHistory } from '@/ui/components/BillHistory';
import { BillPayForm } from '@/ui/components/BillPayForm';
import { RateWidget } from '@/ui/components/RateWidget';

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-yellow-100 px-4 md:px-8 py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold text-gray-900">
                Bill Payment Dashboard
              </h1>
              <p className="text-gray-500 text-sm font-body mt-0.5">
                Nida Reyes — Davao City, Philippines
              </p>
            </div>
            <Suspense fallback={<div className="h-10 w-40 bg-yellow-50 rounded-lg animate-pulse" />}>
              <RateWidget />
            </Suspense>
          </div>
        </div>

        <div className="flex flex-1 flex-col md:flex-row gap-0">
          {/* Bill pay form */}
          <section className="w-full md:w-96 border-b md:border-b-0 md:border-r border-yellow-100 bg-white px-4 md:px-6 py-6">
            <h2 className="font-heading text-lg font-bold text-gray-900 mb-4">
              ⚡ Pay a Bill
            </h2>
            <BillPayForm />
          </section>

          {/* Bill history */}
          <section className="flex-1 min-w-0 px-4 md:px-6 py-6 bg-yellow-50/30">
            <h2 className="font-heading text-lg font-bold text-gray-900 mb-4">
              📋 Bill History
            </h2>
            <Suspense fallback={<div className="h-64 bg-white rounded-xl animate-pulse" />}>
              <BillHistory />
            </Suspense>
          </section>
        </div>
      </main>
    </div>
  );
}

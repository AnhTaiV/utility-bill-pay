'use client';

type Status = 'pending' | 'paid' | 'settled' | 'failed';

const statusConfig: Record<Status, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
  paid: { label: 'Paid', className: 'bg-blue-100 text-blue-800 border border-blue-200' },
  settled: { label: 'Settled ✓', className: 'bg-green-100 text-green-800 border border-green-200' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800 border border-red-200' },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status as Status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

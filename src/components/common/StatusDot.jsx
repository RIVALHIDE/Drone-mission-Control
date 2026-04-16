const STATUS_COLORS = {
  nominal: 'bg-green-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
}

export default function StatusDot({ status = 'nominal' }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.nominal
  const isCritical = status === 'critical'

  return (
    <div className="flex items-center gap-2">
      <span className={`relative flex h-2.5 w-2.5`}>
        {isCritical && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
      </span>
      <span className="text-[10px] uppercase tracking-widest text-gray-400">
        {status}
      </span>
    </div>
  )
}

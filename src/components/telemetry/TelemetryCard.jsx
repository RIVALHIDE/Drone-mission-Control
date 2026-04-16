export default function TelemetryCard({ label, children, className = '' }) {
  return (
    <div className={`bg-gray-900/50 backdrop-blur-md border border-gray-700/40 rounded-xl p-3 ${className}`}>
      {label && (
        <div className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">
          {label}
        </div>
      )}
      {children}
    </div>
  )
}

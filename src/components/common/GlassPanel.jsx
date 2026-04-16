export default function GlassPanel({ label, children, className = '' }) {
  return (
    <div className={`bg-gray-900/50 backdrop-blur-md border border-gray-700/40 rounded-xl p-4 ${className}`}>
      {label && (
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-3 font-medium">
          {label}
        </div>
      )}
      {children}
    </div>
  )
}

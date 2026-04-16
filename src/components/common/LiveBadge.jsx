export default function LiveBadge() {
  return (
    <div className="flex items-center gap-1.5 bg-red-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
      </span>
      LIVE
    </div>
  )
}

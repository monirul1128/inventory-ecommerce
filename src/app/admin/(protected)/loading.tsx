export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[40vh]">
      <div className="text-center">
        <div className="inline-block w-10 h-10 border-4 border-amber-900 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-gray-500 text-sm">লোড হচ্ছে...</p>
      </div>
    </div>
  )
}

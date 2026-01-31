export default function StatusMessage({ message, bgColor }: { message: string; bgColor: string }) {
  return (
    <div className={`p-2 mt-2 text-white text-sm rounded-lg transition-opacity duration-300 ${bgColor}`}>{message}</div>
  )
}

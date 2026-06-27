import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string) {
  const parts = name.trim().split(" ")
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function getAvatarColor(name: string) {
  const colors = [
    "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
    "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
    "bg-orange-500", "bg-cyan-500"
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function formatMessageTime(dateString: string) {
  const date = new Date(dateString)
  if (isToday(date)) {
    return format(date, "HH:mm")
  }
  if (isYesterday(date)) {
    return "Yesterday"
  }
  return format(date, "dd/MM/yyyy")
}

export function formatLastSeen(dateString: string | null | undefined) {
  if (!dateString) return ""
  const date = new Date(dateString)
  return `last seen ${formatDistanceToNow(date, { addSuffix: true })}`
}

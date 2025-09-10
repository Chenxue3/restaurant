import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseTime12h(timeStr: string) {
  if (!timeStr) return null
  // support 12:00pm、12:00 pm、12:00PM、12:00 PM
  const match = timeStr.trim().toLowerCase().match(/(\d{1,2}):(\d{2})\s*(am|pm)/)
  if (!match) return null
  let hour = parseInt(match[1], 10)
  const minute = parseInt(match[2], 10)
  const ampm = match[3]
  if (ampm === 'pm' && hour < 12) hour += 12
  if (ampm === 'am' && hour === 12) hour = 0
  return { hour, minute }
}
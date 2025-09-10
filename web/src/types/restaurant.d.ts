// Types
interface Restaurant {
  _id: string
  name: string
  description: string
  address?: string
  logoImage?: string
  images: string[]
  cuisineType: string[]
  priceRange: string
  rating: number
  hasStudentDiscount: boolean
  openingHours?: {
    day: string
    open: string
    close: string
    isClosed: boolean
  }[]
}
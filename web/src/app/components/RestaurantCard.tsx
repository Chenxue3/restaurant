import Link from 'next/link'
import Image from 'next/image'

import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import {
  MapPin,
  Star,
  Coffee,
  Clock,
} from 'lucide-react'
import { parseTime12h } from '@/lib/utils'

interface Address {
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

interface OpeningHour {
  day: string
  open: string
  close: string
  isClosed: boolean
}

interface Restaurant {
  _id: string
  name: string
  description?: string
  address?: string | Address
  images?: string[]
  logoImage?: string
  priceRange: string
  rating: number
  hasStudentDiscount: boolean
  cuisineType?: string[]
  openingHours?: OpeningHour[] | Record<string, Array<{ open: string; close: string }>>
}

export default function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
 

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'bg-green-500'
    if (rating >= 4) return 'bg-green-400'
    if (rating >= 3.5) return 'bg-yellow-400'
    return 'bg-yellow-300'
  }

  const getAddress = () => {
    if (typeof restaurant.address === 'string') return restaurant.address
    if (restaurant.address && typeof restaurant.address === 'object') {
      const { street, city, state, zipCode, country } = restaurant.address as Address
      return [street, city, state, zipCode, country].filter(Boolean).join(', ')
    }
    return 'Location not specified'
  }

  const getOpenStatus = () => {
    const now = new Date()
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const today = days[now.getDay()]

    let todayHoursArr: Array<{ open: string; close: string }> = []
    if (Array.isArray(restaurant.openingHours)) {
      todayHoursArr = restaurant.openingHours
        .filter(h => h.day.toLowerCase() === today && !h.isClosed)
        .map(h => ({ open: h.open, close: h.close }))
    } else if (typeof restaurant.openingHours === 'object' && restaurant.openingHours) {
      todayHoursArr = restaurant.openingHours[today] || []
    }

    if (!todayHoursArr.length) return { status: 'Closed', color: 'text-red-500 bg-red-100' }
    const { open: start, close: end } = todayHoursArr[0]
    if (!start || !end || start === 'Closed' || end === 'Closed') return { status: 'Closed', color: 'text-red-500 bg-red-100' }
    const open = parseTime12h(start)
    const close = parseTime12h(end)
    if (!open || !close) return { status: 'Closed', color: 'text-red-500 bg-red-100' }
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const openMinutes = open.hour * 60 + open.minute
    const closeMinutes = close.hour * 60 + close.minute
    let isOpen = false
    if (closeMinutes > openMinutes) {
      isOpen = nowMinutes >= openMinutes && nowMinutes < closeMinutes
    } else {
      isOpen = nowMinutes >= openMinutes || nowMinutes < closeMinutes
    }

    return isOpen
      ? { status: 'Open Now', color: 'text-green-600 bg-green-100' }
      : { status: 'Closed', color: 'text-red-500 bg-red-100' }
  }

  const openStatus = getOpenStatus()

  return (
    <Link href={`/restaurants/${restaurant._id}`}>
      <Card className="overflow-hidden rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 py-0 cursor-pointer">
        <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
          {restaurant.images?.[0] ? (
            <Image
              src={restaurant.images[0]}
              alt={restaurant.name}
              fill
              sizes="100vw"
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : restaurant.logoImage ? (
            <Image
              src={restaurant.logoImage}
              alt={restaurant.name}
              fill
              sizes="100vw"
              className="object-contain p-4"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <Coffee size={48} className="text-gray-400" />
            </div>
          )}

          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="font-semibold">{restaurant.priceRange}</Badge>
          </div>

          {restaurant.hasStudentDiscount && (
            <Badge variant="destructive" className="absolute top-3 left-3">Student Discount</Badge>
          )}
        </div>

        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg mb-1 line-clamp-1">{restaurant.name}</h3>
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <MapPin size={14} className="mr-1" />
                <span className="break-words max-w-xs leading-snug line-clamp-2">{getAddress()}</span>
              </div>
            </div>
            <div className={`flex items-center ${getRatingColor(restaurant.rating)} text-white px-2 py-1 rounded-md`}>
              <Star size={12} className="mr-1" />
              <span className="font-bold text-sm">{restaurant.rating.toFixed(1)}</span>
            </div>
          </div>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{restaurant.description || 'No description yet'}</p>

          {restaurant.cuisineType && restaurant.cuisineType.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {restaurant.cuisineType.slice(0, 3).map((cuisine) => (
                <Badge key={cuisine} variant="outline" className="text-xs font-medium">
                  {cuisine}
                </Badge>
              ))}
              {restaurant.cuisineType.length > 3 && (
                <Badge variant="outline" className="text-xs font-medium">
                  +{restaurant.cuisineType.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <div className={`flex items-center text-xs px-2 py-1 rounded-full font-semibold ${openStatus.color}`}>
            <Clock size={14} className="mr-1" />
            {openStatus.status}
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}

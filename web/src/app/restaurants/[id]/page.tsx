"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import restaurantsAPI from "@/services/restaurants"
import { Skeleton } from "@/components/ui/skeleton"
import { Star } from "lucide-react"
import Link from "next/link"
import { ROUTES } from "@/lib/constants"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import Menu from "./components/Menu"
import RestaurantInfo from "./components/RestaurantInfo"
import Photos from "./components/Photos"
import { Dish } from '@/types/dish'

interface Address {
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

interface Restaurant {
  _id: string
  name: string
  description: string
  address: string | Address
  contactInfo: {
    phone?: string
    email?: string
    website?: string
  }
  cuisineType: string[]
  priceRange: string
  openingHours: {
    day: string
    open: string
    close: string
    isClosed: boolean
  }[]
  images: string[]
  logoImage?: string
  rating: number
  hasStudentDiscount: boolean
  menuLanguage?: string
}

interface FoodCategory {
  _id: string
  name: string
  description?: string
  displayOrder: number
}

interface dishByCategory {
  [categoryId: string]: {
    categoryInfo: FoodCategory
    dishItems: Dish[]
  }
}

export default function RestaurantDetail() {
  const { id } = useParams()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [dishByCategory, setdishByCategory] = useState<dishByCategory | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRestaurantData = async () => {
      setIsLoading(true)
      try {
        const { data } = await restaurantsAPI.getRestaurant(id as string)
        if (data.success) {
          setRestaurant(data.data.restaurant)
          setdishByCategory(data.data.dishByCategory)
        } else {
          setError("Failed to load restaurant data")
        }
      } catch (err) {
        console.error(err)
        setError("An error occurred while fetching restaurant data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRestaurantData()
  }, [id])

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <Skeleton className="h-64 w-full mb-6" data-testid="skeleton" />
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-full">
            <Skeleton className="h-10 w-3/4 mb-4" data-testid="skeleton" />
            <Skeleton className="h-4 w-full mb-2" data-testid="skeleton" />
            <Skeleton className="h-4 w-full mb-2" data-testid="skeleton" />
            <Skeleton className="h-4 w-3/4 mb-6" data-testid="skeleton" />

            <div className="mb-6">
              <Skeleton className="h-8 w-1/3 mb-3" data-testid="skeleton" />
              {Array(3).fill(0).map((_, idx) => (
                <div key={idx} className="mb-4">
                  <Skeleton className="h-6 w-1/2 mb-2" data-testid="skeleton" />
                  <Skeleton className="h-4 w-full mb-1" data-testid="skeleton" />
                  <Skeleton className="h-4 w-1/2" data-testid="skeleton" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || "Restaurant not found"}
        </div>
        <Link href={ROUTES.HOME} className="text-indigo-600 hover:text-indigo-800">
          &larr; Back to home
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with cover image */}
      <div className="relative h-64 mb-6 rounded-lg overflow-hidden">
        <Image
          src={restaurant.images[0] || "/default_restaurant.jpg"}
          alt={restaurant.name}
          className="object-cover"
          fill
          sizes="(max-width: 768px) 100vw, 1200px"
        />
        <div className="absolute inset-0 bg-opacity-40 flex items-end">
          <div className="p-6 w-full">
            <div className="flex items-center">
              {restaurant.logoImage && (
                <div className="w-16 h-16 bg-white rounded-lg overflow-hidden mr-4 shadow-lg relative">
                  <Image
                    src={restaurant.logoImage}
                    alt={`${restaurant.name} logo`}
                    className="object-cover"
                    fill
                    sizes="64px"
                  />
                </div>
              )}
              <div>
                <div className="flex items-end gap-2">
                  <h1 className="text-3xl font-bold text-white">{restaurant.name}</h1>
                </div>
                <div className="flex items-center text-white mt-1">
                  <Star className="text-yellow-400 mr-1" size={16} />
                  <span className="mr-2">{restaurant.rating.toFixed(1)}</span>
                  <span className="mr-2">•</span>
                  <span className="mr-2">{restaurant.cuisineType.join(", ")}</span>
                  <span className="mr-2">•</span>
                  <span>{restaurant.priceRange}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="w-full">
        {/* Tabs */}
        <Tabs defaultValue="menu" className="w-full">
          <TabsList className="mb-6 w-full">
            <TabsTrigger
              value="menu"
            >
              Menu
            </TabsTrigger>
            <TabsTrigger
              value="info"
            >
              Information
            </TabsTrigger>
            <TabsTrigger
              value="photos"
            >
              Photos
            </TabsTrigger>

          </TabsList>

          <TabsContent value="menu" className="w-full mt-6">
            <Menu
              dishByCategory={dishByCategory}
              defaultMenuLanguage={restaurant.menuLanguage}
            />
          </TabsContent>

          <TabsContent value="info" className="w-full mt-6">
            <RestaurantInfo
              description={restaurant.description}
              address={restaurant.address}
              contactInfo={restaurant.contactInfo}
              openingHours={restaurant.openingHours}
              cuisineType={restaurant.cuisineType}
              priceRange={restaurant.priceRange}
              rating={restaurant.rating}
              hasStudentDiscount={restaurant.hasStudentDiscount}
            />
          </TabsContent>

          <TabsContent value="photos" className="w-full mt-6">
            <Photos
              images={restaurant.images}
              restaurantName={restaurant.name}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 
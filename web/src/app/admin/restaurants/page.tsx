'use client'

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import Image from "next/image"
import restaurantsAPI from "@/services/restaurants"
import { ROUTES } from "@/lib/constants"
import Link from "next/link"
import { ChevronRight, Star, Coffee, DollarSign } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import CreateRestaurantDialog from "@/components/restaurants/CreateRestaurantDialog"


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
  menu?: { name: string; price: number; description?: string }[]
  image?: string
}

export default function RestaurantAdminPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Fetch restaurants owned by the user
  useEffect(() => {
    // Check if user is authenticated
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN)
      return
    }

    const fetchRestaurants = async () => {
      try {
        const { data } = await restaurantsAPI.getMyRestaurants()
        if (data.success) {
          setRestaurants(data.data)
        } else {
          console.error("Failed to load restaurants")
        }
      } catch (err) {
        console.error("Error fetching restaurants:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRestaurants()
  }, [isAuthenticated, authLoading, router])

  const refreshRestaurants = async () => {
    try {
      const { data } = await restaurantsAPI.getMyRestaurants()
      if (data.success) {
        setRestaurants(data.data)
      }
    } catch (err) {
      console.error("Error refreshing restaurants:", err)
    }
  }

  // Helper function to render price range
  const renderPriceRange = (priceRange: string) => {
    const count = priceRange.split('$').length - 1
    return (
      <div className="flex items-center">
        {Array(count).fill(0).map((_, i) => (
          <DollarSign key={i} size={14} className="text-gray-600" />
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-6 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-1" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Your Restaurants</h1>
        {restaurants.length > 0 && (
          <CreateRestaurantDialog
            onSuccess={refreshRestaurants}
            buttonText="Add New Restaurant"
            open={dialogOpen}
            onOpenChange={setDialogOpen}
          />
        )}
      </div>

      {restaurants.length > 0 ? (
        <div className="space-y-4">
          {restaurants.map(restaurant => (
            <Link
              href={ROUTES.RESTAURANT_ADMIN_DETAIL(restaurant._id)}
              key={restaurant._id}
              title="View Restaurant"
              className="block"
            >
              <div className="mb-4 border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex flex-col md:flex-row w-full">
                  {/* Restaurant image - vertical on mobile, horizontal on desktop */}
                  <div className="w-full md:w-64 h-48 md:h-40 relative bg-gray-100 flex-shrink-0">
                    {restaurant.images && restaurant.images.length > 0 ? (
                      <Image
                        src={restaurant.images[0]}
                        alt={restaurant.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 256px"
                        className="object-cover"
                      />
                    ) : restaurant.logoImage ? (
                      <Image
                        src={restaurant.logoImage}
                        alt={restaurant.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 256px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Coffee size={36} />
                      </div>
                    )}
                  </div>

                  {/* Restaurant details */}
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="flex justify-between items-start">
                      <h2 className="text-lg font-bold text-gray-800 mb-1 line-clamp-2">{restaurant.name}</h2>
                      <ChevronRight size={20} className="text-gray-400 mt-1 ml-2 flex-shrink-0" />
                    </div>

                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full">
                        <Star size={16} className="text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">{restaurant.rating.toFixed(1)}</span>
                      </div>

                      <div className="bg-gray-50 px-2 py-1 rounded-full">
                        {renderPriceRange(restaurant.priceRange)}
                      </div>

                      {restaurant.hasStudentDiscount && (
                        <div className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                          Student Discount
                        </div>
                      )}
                    </div>

                    {restaurant.cuisineType.length > 0 && (
                      <div className="flex gap-2 flex-wrap mb-2">
                        {restaurant.cuisineType.map((cuisine, index) => (
                          <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                            {cuisine}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-sm text-gray-600 line-clamp-2 mt-2 md:mt-auto">
                      {restaurant.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">You don&apos;t have any restaurants yet</p>
          <CreateRestaurantDialog
            onSuccess={refreshRestaurants}
            buttonText="Create Your First Restaurant"
            open={dialogOpen}
            onOpenChange={setDialogOpen}
          />
        </div>
      )}
    </>
  )
}
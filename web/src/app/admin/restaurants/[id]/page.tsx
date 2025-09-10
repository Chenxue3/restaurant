"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

// UI Components
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// API
import restaurantsAPI from "@/services/restaurants"
import { ROUTES } from "@/lib/constants"
import RestaurantSkeleton from './components/RestaurantSkeleton'

// Custom components
import RestaurantInfo from "./components/RestaurantInfo"
import Menu from "./components/Menu"
import QRCode from "./components/QRCode"

// Types
import { Dish } from "@/types/dish"
import { ArrowLeft } from 'lucide-react'

interface OpeningHours {
  [key: string]: { start: string; end: string }[]
}

interface CategoryInfo {
  _id: string
  name: string
  description?: string
  displayOrder: number
}

interface DishCategory {
  categoryInfo: CategoryInfo
  dishItems: Dish[]
}

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
  openingHours?: OpeningHours
  menu?: Dish[]
  dishByCategory?: Record<string, DishCategory>
}

export default function RestaurantAdminPage() {
  // Get the restaurant ID from route params
  const params = useParams()
  const restaurantId = params.id as string

  const router = useRouter()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for menu items
  const [localMenuItems, setLocalMenuItems] = useState<Dish[]>([])

  // Initialize menu items when restaurant data is loaded
  useEffect(() => {
    // Try to build menu data from dishByCategory
    const menuItems: Dish[] = []

    if (restaurant) {
      // Extract menu items from dishByCategory
      if (restaurant.dishByCategory) {
        Object.values(restaurant.dishByCategory).forEach(category => {
          if (category.dishItems && Array.isArray(category.dishItems)) {
            category.dishItems.forEach(item => {
              menuItems.push(item)
            })
          }
        })
      }
    }

    setLocalMenuItems(menuItems)
  }, [restaurant])

  // Handler to update menu items
  const handleMenuItemsUpdate = (updatedMenuItems: Dish[]) => {
    setLocalMenuItems(updatedMenuItems)
  }

  // Fetch restaurant data
  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!restaurantId) {
        setError("Restaurant ID is missing")
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const { data } = await restaurantsAPI.getRestaurant(restaurantId)
        if (data.success) {
          const restaurantData = data.data.restaurant

          // Save dishByCategory data
          if (data.data.dishByCategory) {
            restaurantData.dishByCategory = data.data.dishByCategory
          }

          // Process opening hours data - convert from backend format to frontend format
          if (restaurantData.openingHours && Array.isArray(restaurantData.openingHours)) {
            const formattedOpeningHours: OpeningHours = {}

            // Convert array format to key-value format: { monday: [...], tuesday: [...] }
            restaurantData.openingHours.forEach((item: {
              day: string
              open: string
              close: string
              isClosed: boolean
              _id?: string
              id?: string
            }) => {
              if (!item.day) {
                console.warn('Missing day in opening hours item:', item)
                return
              }

              if (!item.isClosed) {
                const day = item.day.toLowerCase() // Convert "Monday" to "monday"
                formattedOpeningHours[day] = [
                  {
                    start: item.open,
                    end: item.close
                  }
                ]
              } else {
                const day = item.day.toLowerCase()
                formattedOpeningHours[day] = [] // Set closed days as empty array
              }
            })

            // Ensure all days are defined
            const allDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
            allDays.forEach(day => {
              if (!formattedOpeningHours[day]) {
                formattedOpeningHours[day] = [] // Default to closed day
              }
            })

            // Update restaurant data with converted format
            restaurantData.openingHours = formattedOpeningHours
          }

          setRestaurant(restaurantData)
        } else {
          setError("Failed to load restaurant data")
          toast.error("Failed to load restaurant data")
        }
      } catch (err) {
        console.error("Error fetching restaurant:", err)
        setError("An error occurred while fetching restaurant")
        toast.error("An error occurred while fetching restaurant")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRestaurant()
  }, [restaurantId])

  const handleBack = () => {
    router.back()
  }

  // Handle restaurant update
  const handleRestaurantUpdate = async (updatedData: Partial<Restaurant>) => {
    if (!restaurantId) {
      toast.error("Restaurant ID is missing")
      return
    }

    try {
      setIsLoading(true)

      // Prepare data object to send
      const dataToSend = { ...updatedData }

      // Special handling for openingHours field
      if (updatedData.openingHours) {
        interface BackendOpeningHour {
          day: string
          open: string
          close: string
          isClosed: boolean
        }

        const convertedOpeningHours: BackendOpeningHour[] = []

        // Iterate through each day
        Object.entries(updatedData.openingHours).forEach(([day, hours]) => {
          // If there are opening hours for the day
          if (hours && hours.length > 0) {
            convertedOpeningHours.push({
              day: day.charAt(0).toUpperCase() + day.slice(1), // Capitalize first letter
              open: hours[0].start,
              close: hours[0].end,
              isClosed: false
            })
          } else {
            // If the day is closed
            convertedOpeningHours.push({
              day: day.charAt(0).toUpperCase() + day.slice(1),
              open: '',
              close: '',
              isClosed: true
            })
          }
        })

        // Replace original openingHours
        dataToSend.openingHours = convertedOpeningHours as unknown as typeof updatedData.openingHours
      }

      // Use restaurantsAPI
      const { data } = await restaurantsAPI.updateRestaurantJson(restaurantId, dataToSend)

      if (data.success) {
        setRestaurant(prev => prev ? { ...prev, ...updatedData } : null)
        toast.success("Restaurant updated successfully")
      } else {
        toast.error(data.message || "Failed to update restaurant")
      }
    } catch (err) {
      console.error("Error updating restaurant:", err)
      toast.error("An error occurred while updating restaurant")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <RestaurantSkeleton />
  }

  if (error || !restaurant) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
        <p className="text-gray-700">{error || "Restaurant not found"}</p>
        <Button
          className="mt-4"
          onClick={() => router.push(ROUTES.RESTAURANT_ADMIN)}
        >
          Back to Restaurants
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={handleBack} className="mr-3">
          <ArrowLeft size={24} />
        </Button>
        <h1 className="text-2xl font-bold">Manage Restaurant</h1>
      </div>

      {/* Restaurant Information Card */}
      <Tabs defaultValue="info" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="info">Restaurant Info</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="qrcode">QR Code</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <RestaurantInfo
            restaurant={restaurant}
            onUpdate={handleRestaurantUpdate}
          />
        </TabsContent>

        <TabsContent value="menu">
          <Menu
            restaurantId={restaurantId}
            menuItems={localMenuItems}
            onUpdate={handleMenuItemsUpdate}
          />
        </TabsContent>

        <TabsContent value="qrcode">
          <QRCode
            url={`${window.location.origin}/restaurants/${restaurant._id}`}
            logoImage={restaurant.logoImage}
            restaurantName={restaurant.name}
          />
        </TabsContent>
      </Tabs>
    </>
  )
}



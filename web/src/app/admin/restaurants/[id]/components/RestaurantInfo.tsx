import React from "react"
import Image from "next/image"

// UI Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Icons
import { Coffee } from "lucide-react"

// Restaurant Components
import { RestaurantManagementDialog } from "@/components/restaurants/RestaurantManagementDialog"
import DeleteRestaurantBtn from "./DeleteRestaurantBtn"

interface OpeningHours {
  [key: string]: { start: string; end: string }[]
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
}

interface RestaurantInfoProps {
  restaurant: Restaurant
  onUpdate: (updatedData: Partial<Restaurant>) => Promise<void>
}

export default function RestaurantInfo({ restaurant, onUpdate }: RestaurantInfoProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle>Restaurant Information</CardTitle>
          <CardDescription>View and manage your restaurant details</CardDescription>
        </div>
        <RestaurantManagementDialog
          restaurant={restaurant}
          onUpdate={onUpdate}
        />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-md bg-gray-200 overflow-hidden relative mb-4">
              {restaurant.images && restaurant.images.length > 0 ? (
                <Image
                  src={restaurant.images[0]}
                  alt={restaurant.name}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              ) : restaurant.logoImage ? (
                <Image
                  src={restaurant.logoImage}
                  alt={restaurant.name}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Coffee size={48} />
                </div>
              )}
            </div>
            <h2 className="text-xl font-semibold text-center">{restaurant.name}</h2>
            <div className="mt-2 text-center text-sm text-gray-500">
              <p>{restaurant.cuisineType?.join(", ") || "No cuisine type specified"}</p>
              <p>{restaurant.priceRange || "No price range specified"}</p>
            </div>
          </div>

          <div className="w-full md:w-1/3 mt-6 md:mt-0">
            <div className="grid gap-4">
              {[
                { label: "Name", value: restaurant.name },
                { label: "Description", value: restaurant.description },
                { label: "Address", value: restaurant.address || "No address specified" },
                { label: "Rating", value: restaurant.rating ? restaurant.rating.toFixed(1) : "N/A" },
                { label: "Student Discount", value: restaurant.hasStudentDiscount ? "Yes" : "No" }
              ].map((field) => (
                <div key={field.label} className="flex flex-col gap-1">
                  <Label>{field.label}</Label>
                  <Input value={field.value} readOnly className="bg-gray-50" />
                </div>
              ))}
            </div>
          </div>

          <div className="w-full md:w-1/3 flex flex-col mt-6 md:mt-0">
            {restaurant.openingHours && (
              <div className="flex flex-col gap-1">
                <Label>Opening Hours</Label>
                <div className="grid gap-2 bg-gray-50 p-3 rounded-md">
                  {[
                    { key: "monday", label: "Mon" },
                    { key: "tuesday", label: "Tue" },
                    { key: "wednesday", label: "Wed" },
                    { key: "thursday", label: "Thur" },
                    { key: "friday", label: "Fri" },
                    { key: "saturday", label: "Sat" },
                    { key: "sunday", label: "Sun" },
                  ].map(({ key, label }) => {
                    const hours = restaurant.openingHours?.[key] || []
                    return (
                      <div key={key} className="flex justify-between items-center whitespace-nowrap">
                        <span className="font-normal text-sm text-gray-900 w-16">{label}</span>
                        {hours.length > 0 ? (
                          <span className="font-normal text-sm text-gray-900 text-right w-32 whitespace-nowrap overflow-hidden text-ellipsis">{hours[0].start} <span className="mx-1 text-gray-500">to</span> {hours[0].end}</span>
                        ) : (
                          <span className="font-normal text-sm text-gray-500 text-right w-32 whitespace-nowrap overflow-hidden text-ellipsis">Day Off</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t">
        <div className="text-xs text-gray-500 break-all">
          Restaurant ID: {restaurant._id}
        </div>
        <DeleteRestaurantBtn restaurant={restaurant} />
      </CardFooter>
    </Card>
  )
}

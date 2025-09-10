import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import restaurantsAPI from "@/services/restaurants"
import { placesAPI } from "@/services/places"

interface CreateRestaurantDialogProps {
  onSuccess?: () => void
  buttonText?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface GooglePlace {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

interface GooglePlaceDetails {
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  address_components: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
  name: string
  place_id: string
  rating?: number
  user_ratings_total?: number
  opening_hours?: {
    weekday_text?: string[]
    open_now?: boolean
  }
}

interface OpeningHours {
  day: string
  open: string
  close: string
  isClosed: boolean
}

function ensureAmPm(time: string) {
  if (!time) return ""
  // Return directly if AM/PM already exists
  if (time.toLowerCase().includes("am") || time.toLowerCase().includes("pm")) return time
  // Consider 12:00 as noon/midnight, default to PM (can be adjusted based on actual needs)
  const [h, m] = time.split(":")
  const hour = parseInt(h, 10)
  if (hour === 0) return `12:${m} AM`
  if (hour > 0 && hour < 12) return `${hour}:${m} AM`
  if (hour === 12) return `${hour}:${m} PM`
  if (hour > 12) return `${hour - 12}:${m} PM`
  return time
}

export default function CreateRestaurantDialog({ onSuccess, buttonText = "Add Restaurant", open, onOpenChange }: CreateRestaurantDialogProps) {
  const [restaurantName, setRestaurantName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<GooglePlace[]>([])
  const [selectedPlace, setSelectedPlace] = useState<GooglePlace | null>(null)
  const [placeDetails, setPlaceDetails] = useState<GooglePlaceDetails | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setRestaurantName(value)
    setSelectedPlace(null)
    setPlaceDetails(null)

    if (value.length > 2) {
      try {
        const { data, success, message } = await placesAPI.getAutocomplete(value)

        if (!success) {
          throw new Error(message || "Failed to fetch suggestions")
        }

        setSuggestions(data)
        setShowSuggestions(true)
      } catch (error) {
        console.error("Error fetching suggestions:", error)
        toast.error("Failed to fetch restaurant suggestions")
        setSuggestions([])
        setShowSuggestions(false)
      }
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handlePlaceSelect = async (place: GooglePlace) => {
    setSelectedPlace(place)
    setRestaurantName(place.structured_formatting.main_text)
    setShowSuggestions(false)
    setIsLoading(true)

    try {
      const { data, success, message } = await placesAPI.getDetails(place.place_id)

      if (!success) {
        throw new Error(message || "Failed to fetch place details")
      }

      setPlaceDetails(data)
    } catch (error) {
      console.error("Error fetching place details:", error)
      toast.error("Failed to fetch restaurant details")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPlace || !placeDetails) {
      toast.error("Please pick a restaurant from the suggestions")
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('name', restaurantName)
      formData.append('address', placeDetails.formatted_address)
      formData.append('rating', placeDetails.rating?.toString() || '0')
      formData.append('totalReviews', placeDetails.user_ratings_total?.toString() || '0')
      formData.append('googlePlaceId', selectedPlace.place_id)

      // Opening hours array
      let openingHoursArr: OpeningHours[] = []
      if (placeDetails.opening_hours?.weekday_text) {
        openingHoursArr = placeDetails.opening_hours.weekday_text.map((text: string) => {
          const [day, hours] = text.split(': ')
          if (!hours || hours.toLowerCase().includes('closed')) {
            return { day, open: '', close: '', isClosed: true }
          }
          
          const [open, close] = hours.split(/–|—|-/).map(s => {
            const time = s.trim()
            // If the time contains multiple times, only keep the first one
            if (time.includes(',') || time.includes('，')) {
              return time.split(/[,，]/)[0].trim()
            }
            return time
          })
          
          return {
            day,
            open: ensureAmPm(open),
            close: ensureAmPm(close),
            isClosed: false
          }
        })
      }
      formData.append('openingHours', JSON.stringify(openingHoursArr))

      const { data } = await restaurantsAPI.createRestaurant(formData)

      if (data.success) {
        toast.success("Restaurant created successfully")
        setRestaurantName("")
        setSelectedPlace(null)
        setPlaceDetails(null)
        onSuccess?.()
        onOpenChange?.(false)
      } else {
        toast.error(data.message || "Failed to create restaurant")
      }
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } }
      console.error("Error creating restaurant:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        response: apiError.response?.data
      })
      toast.error(apiError.response?.data?.message || "Failed to create restaurant")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus size={16} className="mr-2" /> {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Restaurant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 relative">
            <Label htmlFor="restaurantName">Restaurant Name</Label>
            <div ref={inputRef}>
              <Input
                id="restaurantName"
                value={restaurantName}
                onChange={handleInputChange}
                placeholder="Start typing restaurant name..."
                disabled={isLoading}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                  {suggestions.map((place) => (
                    <div
                      key={place.place_id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handlePlaceSelect(place)}
                    >
                      <div className="font-medium">{place.structured_formatting.main_text}</div>
                      <div className="text-sm text-gray-500">{place.structured_formatting.secondary_text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {isLoading && (
            <div className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading restaurant details...
            </div>
          )}
          {placeDetails && (
            <div className="space-y-2 p-4 bg-gray-50 rounded-md">
              <div>
                <span className="font-medium">Address:</span> {placeDetails.formatted_address}
              </div>
              {placeDetails.rating && (
                <div>
                  <span className="font-medium">Rating:</span> {placeDetails.rating} ({placeDetails.user_ratings_total} reviews)
                </div>
              )}
              {placeDetails.opening_hours?.weekday_text && (
                <div>
                  <span className="font-medium">Opening Hours:</span>
                  <ul className="mt-1 text-sm">
                    {placeDetails.opening_hours.weekday_text.map((text: string, index: number) => (
                      <li key={index}>{text}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || !selectedPlace}>
              {isLoading ? "Creating..." : "Create Restaurant"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
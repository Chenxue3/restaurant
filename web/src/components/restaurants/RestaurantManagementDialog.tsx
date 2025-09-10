"use client"

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useState } from "react"
import { Edit, Loader2, ImagePlus, Image as ImageIcon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogDescription
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import Image from "next/image"
import { Trash } from "lucide-react"
import restaurantsAPI from "@/services/restaurants"

interface MenuItem {
  id: string
  name: string
  price: number
  description: string
  ingredients: string[]
  texture: string[]
  allergens: string[]
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
  openingHours?: {
    [key: string]: { start: string; end: string }[]
  }
  menu?: MenuItem[]
}

interface RestaurantManagementDialogProps {
  restaurant: Restaurant
  onUpdate?: (updated: Partial<Restaurant>) => void
}

export function RestaurantManagementDialog({ restaurant, onUpdate }: RestaurantManagementDialogProps) {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

  const timeOptions = [
    "Closed",
    "1:00am", "1:30am", "2:00am", "2:30am", "3:00am", "3:30am", "4:00am", "4:30am",
    "5:00am", "5:30am", "6:00am", "6:30am", "7:00am", "7:30am", "8:00am", "8:30am",
    "9:00am", "9:30am", "10:00am", "10:30am", "11:00am", "11:30am", "12:00pm",
    "12:30pm", "1:00pm", "1:30pm", "2:00pm", "2:30pm", "3:00pm", "3:30pm", "4:00pm",
    "4:30pm", "5:00pm", "5:30pm", "6:00pm", "6:30pm", "7:00pm", "7:30pm", "8:00pm",
    "8:30pm", "9:00pm", "9:30pm", "10:00pm", "10:30pm", "11:00pm", "11:30pm", "12:00am"
  ];

  const [formData, setFormData] = useState<Partial<Restaurant>>({ ...restaurant })
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanged, setHasChanged] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showDiscardAlert, setShowDiscardAlert] = useState(false)
  const [errors, setErrors] = useState({
    name: "",
    description: "",
    address: "",
    openingHours: ""
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      openingHours: convertOpeningHoursArrayToObject(restaurant.openingHours)
    }))
  }, [restaurant])

  const validateForm = () => {
    const newErrors = {
      name: "",
      description: "",
      address: "",
      openingHours: ""
    }
    let isValid = true

    if (!formData.name || formData.name.trim() === "") {
      newErrors.name = "Restaurant name is required"
      isValid = false
    }

    if (!formData.description || formData.description.trim() === "") {
      newErrors.description = "Description is required"
      isValid = false
    }

    if (!formData.address || formData.address.trim() === "") {
      newErrors.address = "Address is required"
      isValid = false
    }

    if (formData.openingHours) {
      for (const day of days) {
        const hours = formData.openingHours[day]

        if (hours && hours.length > 0) {
          const { start, end } = hours[0]

          if (start && end && start !== "Closed" && end !== "Closed") {
            const startIndex = timeOptions.indexOf(start)
            const endIndex = timeOptions.indexOf(end)

            if (startIndex >= endIndex && startIndex > 0 && endIndex > 0) {
              newErrors.openingHours = `End time must be after start time for ${day}`
              isValid = false
              break
            }
          }
        }
      }
    }

    setErrors(newErrors)
    return isValid
  }

  const handleTimeChange = (day: string, field: "start" | "end", value: string) => {
    if (field === "start" && value === "Closed") {
      setFormData(prev => ({
        ...prev,
        openingHours: {
          ...prev.openingHours,
          [day]: []
        }
      }))
      setHasChanged(true)
      return
    }

    const currentHours = formData.openingHours?.[day]?.find(h => h.start !== "Closed" && h.end !== "Closed") || { start: "9:00am", end: "6:00pm" }

    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: [{
          ...currentHours,
          [field]: value
        }]
      }
    }))
    setHasChanged(true)
  }

  const handleInputChange = (
    field: keyof Restaurant,
    value: string | string[] | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setHasChanged(true)
  }

  const handleDialogClose = () => {
    if (hasChanged) {
      setShowDiscardAlert(true)
    } else {
      setDialogOpen(false)
    }
  }

  const handleDiscardChanges = () => {
    setFormData({ ...restaurant })
    setHasChanged(false)
    setShowDiscardAlert(false)
    setDialogOpen(false)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Store the selected files for later upload
    setSelectedFiles(files)

    // Create URL for preview of the first image
    if (files[0]) {
      setImagePreview(URL.createObjectURL(files[0]))
    }

    setHasChanged(true)
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Handle image upload first if there are selected files
      if (selectedFiles && selectedFiles.length > 0) {
        // First upload the images
        const imageFormData = new FormData()
        for (let i = 0; i < selectedFiles.length; i++) {
          imageFormData.append('images', selectedFiles[i])
        }

        setUploading(true)
        const { data } = await restaurantsAPI.uploadRestaurantImages(restaurant._id, imageFormData)

        if (data.success) {
          // Update form data with new images
          const updatedImages = [...(restaurant.images || []), ...data.images]
          setFormData(prev => ({
            ...prev,
            images: updatedImages
          }))

          // Now update the rest of the restaurant data with a separate call
          const updatedFormData = {
            ...formData,
            images: updatedImages
          }

          await restaurantsAPI.updateRestaurantJson(restaurant._id, updatedFormData)
          
          // Notify parent component of the update
          onUpdate?.(updatedFormData)
          toast.success("Restaurant information and images updated successfully")
        } else {
          toast.error(data.message || "Failed to upload images")
          setIsLoading(false)
          return
        }

        setUploading(false)
        // Clear selected files after upload
        setSelectedFiles(null)
        setImagePreview(null)
      } else {
        // Just update restaurant info without images
        console.log('Updating restaurant with data:', formData)
        const response = await restaurantsAPI.updateRestaurantJson(restaurant._id, formData)
        console.log('Update response:', response)
        onUpdate?.(formData)
        toast.success("Restaurant information updated successfully")
      }

      // Trigger custom event to notify main page to refresh data
      console.log('Dispatching restaurantUpdated event')
      const event = new CustomEvent('restaurantUpdated')
      window.dispatchEvent(event)
      console.log('restaurantUpdated event dispatched')

      setDialogOpen(false)
      setHasChanged(false)
    } catch (error) {
      console.error("Error updating restaurant:", error)
      toast.error("Failed to update restaurant information")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteImage = async (imageUrl: string) => {
    try {
      const { data } = await restaurantsAPI.deleteRestaurantImage(restaurant._id, imageUrl)

      if (data.success) {
        setFormData(prev => ({
          ...prev,
          images: prev.images?.filter(img => img !== imageUrl) || []
        }))
        setHasChanged(true)
        toast.success("Image deleted successfully")

        // Update the parent component
        onUpdate?.({
          ...restaurant,
          images: restaurant.images?.filter(img => img !== imageUrl) || []
        })
      } else {
        toast.error(data.message || "Failed to delete image")
      }
    } catch (error) {
      console.error("Error deleting image:", error)
      toast.error("An error occurred while deleting the image")
    }
  }

  const normalizeTime = (t?: string) =>
    t ? t.toLowerCase().replace(/\s/g, "") : undefined

  return (
    <Dialog open={dialogOpen} onOpenChange={open => {
      if (!open) {
        handleDialogClose()
      } else {
        setDialogOpen(true)
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Restaurant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Restaurant Information</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="hours">Opening Hours</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="h-full">
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Restaurant Name"
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cuisineType">Cuisines (comma separated)</Label>
                  <Input
                    id="cuisineType"
                    value={formData.cuisineType?.join(", ") || ""}
                    onChange={(e) => handleInputChange("cuisineType", e.target.value.split(",").map(s => s.trim()))}
                    placeholder="Italian, Chinese, Indian, etc."
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Restaurant Description"
                    rows={3}
                  />
                  {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address || ""}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="123 Main St, City, Country"
                  />
                  {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceRange">Price Range</Label>
                  <Select
                    value={formData.priceRange || ""}
                    onValueChange={(value) => handleInputChange("priceRange", value)}
                  >
                    <SelectTrigger id="priceRange">
                      <SelectValue placeholder="Select price range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="$">$ (Inexpensive)</SelectItem>
                      <SelectItem value="$$">$$ (Moderate)</SelectItem>
                      <SelectItem value="$$$">$$$ (Expensive)</SelectItem>
                      <SelectItem value="$$$$">$$$$ (Very Expensive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 mt-8">
                  <Checkbox
                    id="studentDiscount"
                    checked={formData.hasStudentDiscount}
                    onCheckedChange={(checked) =>
                      handleInputChange("hasStudentDiscount", checked === true)
                    }
                  />
                  <Label htmlFor="studentDiscount">Offers student discount</Label>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <h3 className="text-lg font-semibold">Restaurant Images</h3>
                <div className="grid gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full flex justify-center items-center"
                        disabled={uploading || isLoading}
                      >
                        {uploading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ImagePlus className="mr-2 h-4 w-4" />
                        )}
                        <Label htmlFor="basic-image-upload" className="cursor-pointer">
                          {uploading ? "Uploading..." : "Upload Restaurant Images"}
                        </Label>
                        <Input
                          id="basic-image-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageSelect}
                          disabled={uploading || isLoading}
                        />
                      </Button>
                    </div>

                    {imagePreview && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">Preview:</p>
                        <div className="relative w-full h-40 mt-1 rounded-md overflow-hidden">
                          <Image
                            src={imagePreview}
                            alt="Image preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Current Images</Label>
                    {formData.images && formData.images.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                        {formData.images.map((img, idx) => (
                          <div key={idx} className="relative group rounded-md overflow-hidden">
                            <div className="relative h-32 w-full">
                              <Image
                                src={img}
                                alt={`Restaurant image ${idx + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDeleteImage(img)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                            {formData.logoImage === img && (
                              <div className="absolute top-1 left-1 bg-primary text-white text-xs px-1 py-0.5 rounded">
                                Logo
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute bottom-1 right-1 text-xs"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  logoImage: img
                                }))
                                setHasChanged(true)
                              }}
                            >
                              {formData.logoImage === img ? 'Main Image' : 'Set as Main'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md mt-2">
                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">No images uploaded yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hours" className="h-full">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Opening Hours</h3>
              {errors.openingHours && <p className="text-sm text-red-500">{errors.openingHours}</p>}

              <div className="space-y-2">
                {days.map((day) => {
                  const hours = formData.openingHours?.[day] || []
                  const isClosed = hours.length === 0
                  const currentHours = isClosed ? { start: "Closed", end: "Closed" } : hours[0]

                  return (
                    <div key={day} className="flex items-center gap-2 pl-2 pr-2 hover:bg-accent/50 transition-colors">
                      <div className="font-medium text-sm">{day}</div>

                      <div className="flex items-center gap-2">
                        <Select
                          value={isClosed ? "Closed" : normalizeTime(currentHours?.start) || "9:00am"}
                          onValueChange={(value) => {
                            if (value === "Closed") {
                              handleTimeChange(day, "start", "Closed")
                              handleTimeChange(day, "end", "Closed")
                            } else {
                              handleTimeChange(day, "start", value)
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {timeOptions.map((time) => (
                              <SelectItem key={`${day}-start-${time}`} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground">to</span>
                        <Select
                          value={isClosed ? "Closed" : normalizeTime(currentHours?.end) || "5:00pm"}
                          onValueChange={(value) => {
                            if (value === "Closed") {
                              handleTimeChange(day, "start", "Closed")
                              handleTimeChange(day, "end", "Closed")
                            } else {
                              handleTimeChange(day, "end", value)
                            }
                          }}
                          disabled={isClosed}
                        >
                          <SelectTrigger className="h-8 w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {timeOptions.slice(1).map((time) => (
                              <SelectItem key={`${day}-end-${time}`} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleDialogClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !hasChanged}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={showDiscardAlert} onOpenChange={setShowDiscardAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardChanges}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

function convertOpeningHoursArrayToObject(arr: Array<{ day: string; isClosed: boolean; open: string; close: string }> | Record<string, { start: string; end: string }[]> | undefined): Record<string, { start: string; end: string }[]> {
  // If arr is undefined, return an empty object
  if (!arr) {
    return {
      Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: []
    }
  }

  // If arr is already in the correct format (an object), return it
  if (!Array.isArray(arr)) {
    return arr as Record<string, { start: string; end: string }[]>
  }

  const dayMap: Record<string, string> = {
    Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu",
    Friday: "Fri", Saturday: "Sat", Sunday: "Sun"
  }
  const result: Record<string, { start: string; end: string }[]> = {}
  arr.forEach(item => {
    const key = dayMap[item.day] || item.day
    if (!item.isClosed) {
      result[key] = [{ start: item.open, end: item.close }]
    } else {
      result[key] = []
    }
  })
  // Ensure every day is included
  Object.values(dayMap).forEach(day => {
    if (!result[day]) result[day] = []
  })
  console.log('openingHours for form:', result)
  return result
}
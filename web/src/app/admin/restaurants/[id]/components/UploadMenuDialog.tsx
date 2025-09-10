import React, { useState } from "react"
import { toast } from "sonner"
import { Dish } from "@/types/dish"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// API
import restaurantsAPI from "@/services/restaurants"

interface CategoryWithDishItems {
  categoryInfo: {
    _id: string
    name: string
  }
  dishItems: Dish[]
}

interface DishByCategory {
  [categoryId: string]: CategoryWithDishItems
}

interface UploadMenuDialogProps {
  restaurantId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onMenuItemsCreated: (newMenuItems: Dish[]) => void
}

export default function UploadMenuDialog({
  restaurantId,
  open,
  onOpenChange,
  onMenuItemsCreated
}: UploadMenuDialogProps) {
  const [menuImage, setMenuImage] = useState<File | null>(null)
  const [menuAnalysisLoading, setMenuAnalysisLoading] = useState(false)
  const [analysisLanguage, setAnalysisLanguage] = useState('en')

  // Helper function to extract menu items from dishByCategory
  const extractMenuItemsFromDishByCategory = (dishByCategory: DishByCategory): Dish[] => {
    if (!dishByCategory) return []

    return Object.values(dishByCategory).flatMap((category: CategoryWithDishItems) =>
      category.dishItems.map((dish: Dish) => ({
        ...dish,
        texture: Array.isArray(dish.texture) ? dish.texture :
          (typeof dish.texture === 'string' ? [dish.texture] : [])
      }))
    )
  }

  // Handle menu upload and analysis
  const handleMenuUpload = async () => {
    if (!menuImage) {
      toast.error("Please select a menu image to upload")
      return
    }

    setMenuAnalysisLoading(true)
    try {
      // Step 1: Upload and analyze the menu image
      const formData = new FormData()
      formData.append('menuImage', menuImage)
      formData.append('language', analysisLanguage)

      const { data: analysisData } = await restaurantsAPI.analyzeMenuImage(restaurantId, formData)

      if (!analysisData.success) {
        toast.error(analysisData.message || "Failed to analyze menu image")
        return
      }

      // Step 2: Create dish items from the analysis
      const { data: createData } = await restaurantsAPI.createDishesFromAnalysis(restaurantId, {
        menuData: analysisData.data
      })

      if (createData.success) {
        toast.success("Menu items created successfully from the image")

        // Refresh menu data
        const { data: restaurantData } = await restaurantsAPI.getRestaurant(restaurantId)
        if (restaurantData.success && restaurantData.data.dishByCategory) {
          // Extract and update menu items
          const newMenuItems = extractMenuItemsFromDishByCategory(restaurantData.data.dishByCategory)
          onMenuItemsCreated(newMenuItems)
        }

        // Reset menu image
        setMenuImage(null)
        // Close dialog
        onOpenChange(false)
      } else {
        toast.error(createData.message || "Failed to create menu items from analysis")
      }
    } catch (error) {
      console.error("Error uploading and analyzing menu:", error)
      toast.error("An error occurred while processing the menu image")
    } finally {
      setMenuAnalysisLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Upload Menu Image</DialogTitle>
          <DialogDescription>
            Upload a menu image to automatically create menu items
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="analysisLanguage">Menu Language</Label>
            <Select
              value={analysisLanguage}
              onValueChange={setAnalysisLanguage}
            >
              <SelectTrigger id="analysisLanguage">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
                <SelectItem value="ko">Korean</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="menuImage">Menu Image</Label>
            <Input
              id="menuImage"
              type="file"
              onChange={(e) => setMenuImage(e.target.files ? e.target.files[0] : null)}
              accept="image/*"
            />
          </div>

          <p className="text-sm text-gray-500">
            The system will analyze the menu image and try to extract menu items automatically.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleMenuUpload}
            disabled={!menuImage || menuAnalysisLoading}
          >
            {menuAnalysisLoading ? 'Processing...' : 'Upload & Analyze'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

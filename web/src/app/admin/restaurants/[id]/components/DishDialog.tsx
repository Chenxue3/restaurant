import React, { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Dish } from "@/types/dish"
import Image from "next/image"

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2 } from "lucide-react"

// API
import restaurantsAPI from "@/services/restaurants"

interface Category {
  _id: string
  name: string
  description?: string
  displayOrder: number
}

interface DishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restaurantId: string
  dish?: Dish | null  // If dish is provided, we're editing; if null, we're creating
  onDishSaved: (dish: Dish) => void
  onDishDeleted?: (dishId: string) => void
}

export default function DishDialog({
  open,
  onOpenChange,
  restaurantId,
  dish = null,
  onDishSaved,
  onDishDeleted
}: DishDialogProps) {
  const isEditing = !!dish?._id

  // State for categories
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [foodImages, setFoodImages] = useState<FileList | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // State for dish data
  const [dishData, setDishData] = useState<Dish>({
    name: '',
    description: '',
    price: 0,
    ingredients: [],
    allergens: [],
    flavor_profile: '',
    texture: [],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    spicyLevel: 0,
    category: '',
    isAvailable: true,
    displayOrder: 0
  })

  // create text state for comma-separated fields
  const [ingredientsText, setIngredientsText] = useState('')
  const [allergensText, setAllergensText] = useState('')
  const [textureText, setTextureText] = useState('')

  // Function to fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const { data: categoriesData } = await restaurantsAPI.getCategories(restaurantId)
      if (categoriesData.success) {
        setCategories(categoriesData.data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast.error("Failed to load categories")
    }
  }, [restaurantId])

  // Fetch categories when dialog opens
  useEffect(() => {
    if (open) {
      fetchCategories()

      // If editing, initialize form with dish data
      if (dish) {
        setDishData({
          ...dish,
          // Always use category _id for select value
          category: (typeof dish.category === 'object' && dish.category !== null && '_id' in dish.category)
            ? (dish.category as { _id: string })._id
            : dish.category,
          ingredients: dish.ingredients || [],
          allergens: dish.allergens || [],
          texture: dish.texture || [],
          flavor_profile: dish.flavor_profile || '',
          isVegetarian: dish.isVegetarian || false,
          isVegan: dish.isVegan || false,
          isGlutenFree: dish.isGlutenFree || false,
          spicyLevel: dish.spicyLevel || 0,
          isAvailable: dish.isAvailable !== false, // default to true
          displayOrder: dish.displayOrder || 0
        })

        // if the input value is already in string array format (e.g. ["1","2","3"]), process it
        const processArrayValue = (arr: string[]) => {
          // check if it's an array string
          if (arr.length === 1 && arr[0].startsWith('[') && arr[0].endsWith(']')) {
            try {
              // try to parse the array string
              const parsed = JSON.parse(arr[0])
              if (Array.isArray(parsed)) {
                return parsed.join(', ')
              }
            } catch {
              // parsing failed, return the original concatenated string
            }
          }
          return arr.join(', ')
        }

        // set the initial value of the text field, handle possible double encoding
        setIngredientsText(processArrayValue(dish.ingredients))
        setAllergensText(processArrayValue(dish.allergens))
        setTextureText(processArrayValue(dish.texture))
      } else {
        // Reset form for new dish
        setDishData({
          name: '',
          description: '',
          price: 0,
          ingredients: [],
          allergens: [],
          flavor_profile: '',
          texture: [],
          isVegetarian: false,
          isVegan: false,
          isGlutenFree: false,
          spicyLevel: 0,
          category: '',
          isAvailable: true,
          displayOrder: 0
        })

        // reset the text field
        setIngredientsText('')
        setAllergensText('')
        setTextureText('')
      }

      // Clear file input
      setFoodImages(null)
    }
  }, [open, dish, fetchCategories])

  // process text inputs before submitting the form
  const processTextInputs = () => {
    // convert text to array and update dishData
    const ingredients = ingredientsText
      .split(',')
      .map(item => item.trim())
      .filter(item => item !== '')

    const allergens = allergensText
      .split(',')
      .map(item => item.trim())
      .filter(item => item !== '')

    const texture = textureText
      .split(',')
      .map(item => item.trim())
      .filter(item => item !== '')

    setDishData(prev => ({
      ...prev,
      ingredients,
      allergens,
      texture
    }))

    return { ingredients, allergens, texture }
  }

  const handleSaveDish = async () => {
    // first process text inputs
    const { ingredients, allergens, texture } = processTextInputs()

    // Validate required fields
    if (!dishData.name || !dishData.category || dishData.price <= 0) {
      toast.error("Please fill all required fields")
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()

      // Add text fields
      formData.append('name', dishData.name)
      formData.append('description', dishData.description)
      formData.append('price', dishData.price.toString())
      formData.append('category', String(dishData.category))
      formData.append('isVegetarian', String(dishData.isVegetarian))
      formData.append('isVegan', String(dishData.isVegan))
      formData.append('isGlutenFree', String(dishData.isGlutenFree))
      formData.append('isAvailable', String(dishData.isAvailable))
      formData.append('spicyLevel', dishData.spicyLevel.toString())
      formData.append('displayOrder', dishData.displayOrder.toString())

      // add array fields - create separate field names for each element, backend needs to support this format
      // ingredients[0]=value1&ingredients[1]=value2
      ingredients.forEach((item, index) => {
        formData.append(`ingredients[${index}]`, item)
      })

      allergens.forEach((item, index) => {
        formData.append(`allergens[${index}]`, item)
      })

      texture.forEach((item, index) => {
        formData.append(`texture[${index}]`, item)
      })

      if (dishData.flavor_profile) {
        formData.append('flavor_profile', dishData.flavor_profile)
      }

      // Add images if any
      if (foodImages) {
        for (let i = 0; i < foodImages.length; i++) {
          formData.append('images', foodImages[i])
        }
      }

      let result
      if (isEditing && dish?._id) {
        // Update existing dish
        result = await restaurantsAPI.updateDish(restaurantId, dish._id, formData)
      } else {
        // Create new dish
        result = await restaurantsAPI.createDish(restaurantId, formData)
      }

      if (result.data.success) {
        toast.success(`Dish ${isEditing ? 'updated' : 'created'} successfully`)
        onOpenChange(false) // Close dialog
        onDishSaved(result.data.data) // Notify parent with updated/created dish
      } else {
        toast.error(result.data.message || `Failed to ${isEditing ? 'update' : 'create'} dish`)
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} dish:`, error)
      toast.error(`An error occurred while ${isEditing ? 'updating' : 'creating'} the dish`)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle dish deletion
  const handleDeleteDish = async () => {
    if (!dish?._id) return

    setIsDeleting(true)
    try {
      const { data } = await restaurantsAPI.deleteDish(restaurantId, dish._id)

      if (data.success) {
        toast.success("Dish deleted successfully")
        setIsDeleteDialogOpen(false)
        onOpenChange(false) // Close main dialog

        // Notify parent component
        if (onDishDeleted) {
          onDishDeleted(dish._id)
        }
      } else {
        toast.error(data.message || "Failed to delete dish")
      }
    } catch (error) {
      console.error("Error deleting dish:", error)
      toast.error("An error occurred while deleting the dish")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle>{isEditing ? 'Edit' : 'Create New'} Dish</DialogTitle>
                <DialogDescription>
                  {isEditing
                    ? 'Update the details of this dish'
                    : 'Add a new dish to your menu'}
                </DialogDescription>
              </div>
              {isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 size={18} />
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Basic Information Section */}
            <div className="grid grid-cols-1 gap-6">
              <h3 className="font-medium text-sm">Basic Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={dishData.name}
                    onChange={(e) => setDishData({ ...dishData, name: e.target.value })}
                    placeholder="Dish name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={dishData.price || ''}
                    onChange={(e) => setDishData({ ...dishData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={dishData.description}
                  onChange={(e) => setDishData({ ...dishData, description: e.target.value })}
                  placeholder="Dish description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={dishData.category}
                  onValueChange={(value) => setDishData({ ...dishData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ingredients & Allergens Section */}
            <div className="grid grid-cols-1 gap-6 pt-2">
              <h3 className="font-medium text-sm">Ingredients & Allergens</h3>

              <div className="space-y-2">
                <Label htmlFor="ingredients">Ingredients (comma separated)</Label>
                <Textarea
                  id="ingredients"
                  value={ingredientsText}
                  onChange={(e) => setIngredientsText(e.target.value)}
                  placeholder="Enter ingredients separated by commas"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergens">Allergens (comma separated)</Label>
                <Textarea
                  id="allergens"
                  value={allergensText}
                  onChange={(e) => setAllergensText(e.target.value)}
                  placeholder="Enter allergens separated by commas"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="flavor_profile">Flavor Profile</Label>
                <Input
                  id="flavor_profile"
                  value={dishData.flavor_profile}
                  onChange={(e) => setDishData({ ...dishData, flavor_profile: e.target.value })}
                  placeholder="Sweet, savory, spicy, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="texture">Texture (comma separated)</Label>
                <Textarea
                  id="texture"
                  value={textureText}
                  onChange={(e) => setTextureText(e.target.value)}
                  placeholder="Crispy, soft, creamy, etc."
                />
              </div>
            </div>

            {/* Dietary & Availability Section */}
            <div className="grid grid-cols-1 gap-6 pt-2">
              <h3 className="font-medium text-sm">Dietary Information & Availability</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="spicyLevel">Spicy Level</Label>
                  <Select
                    value={dishData.spicyLevel.toString()}
                    onValueChange={(value) => setDishData({ ...dishData, spicyLevel: parseInt(value) })}
                  >
                    <SelectTrigger id="spicyLevel">
                      <SelectValue placeholder="Select spicy level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Not Spicy</SelectItem>
                      <SelectItem value="1">Mild</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">Hot</SelectItem>
                      <SelectItem value="4">Very Hot</SelectItem>
                      <SelectItem value="5">Extremely Hot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={dishData.displayOrder || ''}
                    onChange={(e) => setDishData({ ...dishData, displayOrder: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isAvailable"
                    checked={dishData.isAvailable}
                    onCheckedChange={(checked) => setDishData({ ...dishData, isAvailable: checked })}
                  />
                  <Label htmlFor="isAvailable">Available on Menu</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isVegetarian"
                    checked={dishData.isVegetarian}
                    onCheckedChange={(checked) => setDishData({ ...dishData, isVegetarian: checked })}
                  />
                  <Label htmlFor="isVegetarian">Vegetarian</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isVegan"
                    checked={dishData.isVegan}
                    onCheckedChange={(checked) => setDishData({ ...dishData, isVegan: checked })}
                  />
                  <Label htmlFor="isVegan">Vegan</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isGlutenFree"
                    checked={dishData.isGlutenFree}
                    onCheckedChange={(checked) => setDishData({ ...dishData, isGlutenFree: checked })}
                  />
                  <Label htmlFor="isGlutenFree">Gluten Free</Label>
                </div>
              </div>
            </div>

            {/* Images Section */}
            <div className="grid grid-cols-1 gap-6 pt-2">
              <h3 className="font-medium text-sm">Images</h3>

              <div className="space-y-2">
                <Label htmlFor="images">Dish Images</Label>
                <Input
                  id="images"
                  type="file"
                  multiple
                  onChange={(e) => setFoodImages(e.target.files)}
                  accept="image/*"
                />
              </div>

              {/* Display existing images if editing */}
              {isEditing && dish?.images && dish.images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Existing Images</p>
                  <div className="flex flex-wrap gap-2">
                    {dish.images.map((image, index) => (
                      <div key={index} className="relative w-20 h-20 rounded overflow-hidden border">
                        <Image
                          src={image}
                          alt={`${dish.name} image ${index + 1}`}
                          className="object-cover"
                          fill
                          sizes="80px"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Note: Uploading new images will replace existing ones
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveDish} disabled={isLoading}>
              {isLoading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dish Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dish</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{dish?.name}&quot;?
              <br /><br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDish}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

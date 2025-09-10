import React, { useState } from "react"
import { Dish } from "@/types/dish"

// UI Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Icons
import { ImageOff, Upload, ListFilter, Plus, Pencil } from "lucide-react"

// Restaurant Components
import UploadMenuDialog from "./UploadMenuDialog"
import CategoriesDialog from "./CategoriesDialog"
import DishDialog from "./DishDialog"

// API
import { toast } from "sonner"

interface MenuProps {
  restaurantId: string
  menuItems: Dish[]
  onUpdate?: (menuItems: Dish[]) => void
}

export default function Menu({ restaurantId, menuItems, onUpdate }: MenuProps) {
  // State
  const [uploadMenuDialogOpen, setUploadMenuDialogOpen] = useState(false)
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false)
  const [dishDialogOpen, setDishDialogOpen] = useState(false)
  const [editingDish, setEditingDish] = useState<Dish | null>(null)

  // Handle dish creation/update
  const handleDishSaved = (dish: Dish) => {
    // If dish.category is empty, retain the original category
    if (!dish.category && editingDish?.category) {
      dish.category = editingDish.category
    }

    let updatedMenuItems: Dish[]

    if (editingDish) {
      // Update existing dish in the menuItems array
      updatedMenuItems = menuItems.map(item =>
        item._id === dish._id ? dish : item
      )
      toast.success("Dish updated successfully")
    } else {
      // Add new dish to the menuItems array
      updatedMenuItems = [...menuItems, dish]
      toast.success("Dish created successfully")
    }

    // Update parent component state
    if (onUpdate) {
      onUpdate(updatedMenuItems)
    }

    // Reset editing state
    setEditingDish(null)
  }

  // Handle dish deletion
  const handleDishDeleted = (dishId: string) => {
    // Remove the dish from the menuItems array
    const updatedMenuItems = menuItems.filter(item => item._id !== dishId)

    // Update parent component state
    if (onUpdate) {
      onUpdate(updatedMenuItems)
    }

    toast.success("Dish deleted successfully")
  }

  // Open dialog for editing a dish
  const handleEditDish = (dish: Dish) => {
    setEditingDish(dish)
    setDishDialogOpen(true)
  }

  // Open dialog for creating a new dish
  const handleAddDish = () => {
    setEditingDish(null)
    setDishDialogOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Menu</CardTitle>
            <CardDescription>Manage your restaurant&apos;s menu items</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setCategoriesDialogOpen(true)}
            >
              <ListFilter className="h-4 w-4 mr-2" />
              Categories
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setUploadMenuDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Menu
            </Button>
            <Button
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleAddDish}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Dish
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {menuItems.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems.map(item => (
                  <div key={item._id} className="border rounded-md p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                        <div className="mt-2 text-sm font-medium">${item.price.toFixed(2)}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditDish(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>

                    {!item.isAvailable && (
                      <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded inline-block">
                        Not Available
                      </div>
                    )}

                    {(item.isVegetarian || item.isVegan || item.isGlutenFree) && (
                      <div className="flex gap-2 flex-wrap">
                        {item.isVegetarian && (
                          <div className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded">
                            Vegetarian
                          </div>
                        )}
                        {item.isVegan && (
                          <div className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded">
                            Vegan
                          </div>
                        )}
                        {item.isGlutenFree && (
                          <div className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded">
                            Gluten-Free
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 items-center justify-center py-12">
              <ImageOff className="w-16 h-16 text-gray-400" />
              <p className="text-sm text-gray-500">
                No menu items yet. Add menu items to reach your customers.
              </p>
              <Button
                onClick={handleAddDish}
                variant="outline"
              >
                Add Menu Items
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Menu Dialog */}
      <UploadMenuDialog
        restaurantId={restaurantId}
        open={uploadMenuDialogOpen}
        onOpenChange={setUploadMenuDialogOpen}
        onMenuItemsCreated={(items) => {
          if (onUpdate) {
            onUpdate(items as Dish[])
          }
        }}
      />

      {/* Categories Dialog */}
      <CategoriesDialog
        restaurantId={restaurantId}
        open={categoriesDialogOpen}
        onOpenChange={setCategoriesDialogOpen}
      />

      {/* Dish Dialog - for both creating and editing dishes */}
      <DishDialog
        open={dishDialogOpen}
        onOpenChange={setDishDialogOpen}
        restaurantId={restaurantId}
        dish={editingDish}
        onDishSaved={handleDishSaved}
        onDishDeleted={handleDishDeleted}
      />
    </>
  )
}

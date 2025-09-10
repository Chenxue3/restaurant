import React, { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { Trash2 } from "lucide-react"

// API
import restaurantsAPI from "@/services/restaurants"

// Types for API error handling
interface ApiErrorResponse {
  response?: {
    status: number
    data?: {
      message?: string
    }
  }
}

interface Category {
  _id: string
  name: string
  description?: string
  displayOrder: number
}

interface CategoriesDialogProps {
  restaurantId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CategoriesDialog({ restaurantId, open, onOpenChange }: CategoriesDialogProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    displayOrder: 0
  })
  const [submitting, setSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Define fetchCategories function with useCallback
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data: categoriesData } = await restaurantsAPI.getCategories(restaurantId)
      if (categoriesData.success) {
        setCategories(categoriesData.data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast.error("Failed to load categories")
    } finally {
      setIsLoading(false)
    }
  }, [restaurantId])

  // Fetch categories on component mount and when dialog opens
  useEffect(() => {
    if (open) {
      fetchCategories()
    }
  }, [restaurantId, open, fetchCategories])

  // Handle category creation
  const handleCreateCategory = async () => {
    if (!newCategory.name) {
      toast.error("Category name is required")
      return
    }

    setSubmitting(true)
    try {
      const { data } = await restaurantsAPI.createCategory(restaurantId, newCategory)

      if (data.success) {
        toast.success("Category created successfully")

        // Refresh categories
        fetchCategories()

        // Reset form
        setNewCategory({
          name: '',
          description: '',
          displayOrder: 0
        })
      } else {
        toast.error(data.message || "Failed to create category")
      }
    } catch (error) {
      console.error("Error creating category:", error)
      toast.error("An error occurred while creating category")
    } finally {
      setSubmitting(false)
    }
  }

  // Handle category deletion
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return

    setIsDeleting(true)
    try {
      const { data } = await restaurantsAPI.deleteCategory(categoryToDelete._id)

      if (data.success) {
        toast.success("Category deleted successfully")
        setCategoryToDelete(null)
        fetchCategories()
      } else {
        toast.error(data.message || "Failed to delete category")
      }
    } catch (error: Error | ApiErrorResponse | unknown) {
      console.error("Error deleting category:", error)

      // Handle specific error for categories with dishes
      const apiError = error as ApiErrorResponse
      if (apiError.response?.status === 400) {
        toast.error("Cannot delete category with dishes. Move or delete dishes first.")
      } else {
        toast.error("An error occurred while deleting category")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Manage Menu Categories</DialogTitle>
            <DialogDescription>
              View and create categories for organizing your menu items
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-8">
            {/* List of existing categories */}
            <div>
              <h3 className="text-lg font-medium mb-4">Existing Categories</h3>
              {isLoading ? (
                <div className="py-8 flex justify-center">
                  <p>Loading categories...</p>
                </div>
              ) : categories.length > 0 ? (
                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {categories.map((category) => (
                    <div key={category._id} className="border rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{category.name}</h4>
                          <p className="text-sm text-gray-500">{category.description || 'No description'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-gray-500">
                            Display Order: {category.displayOrder}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setCategoryToDelete(category)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 py-3">No categories created yet.</p>
              )}
            </div>

            {/* Create new category form */}
            <div>
              <h3 className="text-lg font-medium mb-4">Create New Category</h3>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">
                    Name *
                  </Label>
                  <Input
                    id="categoryName"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="Category name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryDescription">Description</Label>
                  <Textarea
                    id="categoryDescription"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    placeholder="Category description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={newCategory.displayOrder || ''}
                    onChange={(e) => setNewCategory({ ...newCategory, displayOrder: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="mt-4">
                <Button onClick={handleCreateCategory} disabled={submitting || !newCategory.name}>
                  {submitting ? 'Creating...' : 'Create Category'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category &quot;{categoryToDelete?.name}&quot;?
              <br />
              <br />
              This action cannot be undone. If this category contains dishes, you must move or delete them first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
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

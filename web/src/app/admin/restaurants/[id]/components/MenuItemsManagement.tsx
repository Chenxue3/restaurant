'use client'

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Pencil } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

// Define proper types
interface MenuItem {
  id: string
  name: string
  price: number
  description: string
  ingredients: string[]
  texture: string[]
  allergens: string[]
}

interface MenuPage {
  pageNumber?: number
  image?: string
  items: MenuItem[][]
}

interface MenuItemsManagementProps {
  rawMenu: MenuPage[]
  itemsPerPage?: number
  onUpdate?: (updatedMenu: MenuPage[]) => void
}

export default function MenuItemsManagement({
  rawMenu,
  itemsPerPage = 4,
  onUpdate
}: MenuItemsManagementProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const items = rawMenu[0]?.items.flat() || []
  const totalPages = Math.ceil(items.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentItems = items.slice(startIndex, startIndex + itemsPerPage)

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [editedItem, setEditedItem] = useState<MenuItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Pagination controls
  const handlePrev = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  const handleNext = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }

  // Save edited menu item
  const handleSave = async () => {
    if (!editedItem) return

    setIsLoading(true)

    try {
      // Update the item in the rawMenu array
      const updatedMenu = rawMenu.map(page => {
        const updatedItems = page.items.map(group =>
          group.map(item => item.id === editedItem.id ? editedItem : item)
        )
        return { ...page, items: updatedItems }
      })

      // Call the onUpdate callback if provided
      if (onUpdate) {
        await onUpdate(updatedMenu)
      }

      toast.success("Menu item updated successfully")
      setEditingItem(null)
    } catch (error) {
      console.error("Error updating menu item:", error)
      toast.error("Failed to update menu item")
    } finally {
      setIsLoading(false)
    }
  }

  // If no menu data, show empty state
  if (!rawMenu || rawMenu.length === 0 || items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No menu items available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {currentItems.map((item) => (
        <div key={item.id} className="bg-white rounded-lg shadow p-4 border">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="text-primary font-medium">${item.price.toFixed(2)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingItem(item)
                setEditedItem({ ...item })
              }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-gray-600 my-2">{item.description}</p>

          <div className="space-y-2 mt-3">
            {item.ingredients.length > 0 && (
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-sm font-medium mr-2">Ingredients:</span>
                <span className="text-sm text-gray-600">{item.ingredients.join(', ')}</span>
              </div>
            )}

            {item.texture.length > 0 && (
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-sm font-medium mr-2">Texture:</span>
                <div className="flex flex-wrap gap-1">
                  {item.texture.map((t) => (
                    <Badge key={t} variant="outline" className="text-xs break-words">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {item.allergens.length > 0 && (
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-sm font-medium mr-2">Allergens:</span>
                <div className="flex flex-wrap gap-1">
                  {item.allergens.map((a) => (
                    <Badge key={a} variant="destructive" className="text-xs break-words">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-4 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Dialog for editing menu items */}
      <Dialog open={!!editingItem} onOpenChange={open => !open && setEditingItem(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Name</Label>
                <Input
                  id="editName"
                  value={editedItem?.name || ''}
                  onChange={(e) => setEditedItem(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPrice">Price</Label>
                <Input
                  id="editPrice"
                  type="number"
                  value={editedItem?.price || ''}
                  onChange={(e) => setEditedItem(prev => prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null)}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={editedItem?.description || ''}
                onChange={(e) => setEditedItem(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editIngredients">Ingredients (comma separated)</Label>
              <Textarea
                id="editIngredients"
                value={editedItem?.ingredients?.join(', ') || ''}
                onChange={(e) => setEditedItem(prev => prev ? { ...prev, ingredients: e.target.value.split(',').map(i => i.trim()) } : null)}
                placeholder="Enter ingredients separated by commas"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editTexture">Texture (comma separated)</Label>
              <Textarea
                id="editTexture"
                value={editedItem?.texture?.join(', ') || ''}
                onChange={(e) => setEditedItem(prev => prev ? { ...prev, texture: e.target.value.split(',').map(i => i.trim()) } : null)}
                placeholder="Enter texture descriptions separated by commas"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editAllergens">Allergens (comma separated)</Label>
              <Textarea
                id="editAllergens"
                value={editedItem?.allergens?.join(', ') || ''}
                onChange={(e) => setEditedItem(prev => prev ? { ...prev, allergens: e.target.value.split(',').map(i => i.trim()) } : null)}
                placeholder="Enter allergens separated by commas"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

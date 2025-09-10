"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import restaurantsAPI from "@/services/restaurants"
import { ROUTES } from "@/lib/constants"

interface Restaurant {
  _id: string
  name: string
}

interface DeleteRestaurantBtnProps {
  restaurant: Restaurant
  onDelete?: () => void
  variant?: "destructive" | "outline" | "default"
  size?: "default" | "sm" | "lg" | "icon"
  fullWidth?: boolean
}

export default function DeleteRestaurantBtn({
  restaurant,
  onDelete,
  variant = "destructive",
  size = "default",
  fullWidth = false,
}: DeleteRestaurantBtnProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!restaurant?._id) return

    try {
      setIsDeleting(true)
      const { data } = await restaurantsAPI.deleteRestaurant(restaurant._id)

      if (data.success) {
        toast.success(`Restaurant "${restaurant.name}" has been deleted`)
        setIsOpen(false)

        if (onDelete) {
          // If callback provided, use that (for list views)
          onDelete()
        } else {
          // If no callback, redirect to restaurants list
          router.push(ROUTES.RESTAURANT_ADMIN)
        }
      } else {
        toast.error("Failed to delete restaurant")
      }
    } catch (err) {
      console.error("Error deleting restaurant:", err)
      toast.error("An error occurred while deleting the restaurant")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`${fullWidth ? "w-full" : ""} whitespace-nowrap`}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Delete Restaurant</span>
          <span className="sm:hidden">Delete</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the restaurant &quot;{restaurant?.name}&quot;.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
          <AlertDialogCancel disabled={isDeleting} className="sm:mt-0">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

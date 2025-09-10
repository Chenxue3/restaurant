"use client"

import { useState, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import Image from "next/image"
import postsAPI from "@/services/posts"
import { ROUTES } from "@/lib/constants"
import { Camera, X, Plus, Star } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

export default function CreatePostPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [content, setContent] = useState("")
  const [title, setTitle] = useState("")
  const [restaurantTags, setRestaurantTags] = useState<string[]>([])
  const [foodTags, setFoodTags] = useState<string[]>([])
  const [newRestaurantTag, setNewRestaurantTag] = useState("")
  const [newFoodTag, setNewFoodTag] = useState("")
  const [rating, setRating] = useState<number>(0)
  const [images, setImages] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if user is authenticated
  if (!authLoading && !isAuthenticated) {
    router.push(ROUTES.LOGIN)
    return null
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)

      // Limit to 4 images
      if (images.length + newFiles.length > 4) {
        setError("You can upload maximum 4 images")
        return
      }

      // Create preview URLs
      const newUrls = newFiles.map(file => URL.createObjectURL(file))

      setImages([...images, ...newFiles])
      setImageUrls([...imageUrls, ...newUrls])
      setError(null)
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    const newUrls = [...imageUrls]

    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(newUrls[index])

    newImages.splice(index, 1)
    newUrls.splice(index, 1)

    setImages(newImages)
    setImageUrls(newUrls)
  }

  const handleAddRestaurantTag = () => {
    if (!newRestaurantTag.trim()) return

    if (!restaurantTags.includes(newRestaurantTag)) {
      setRestaurantTags([...restaurantTags, newRestaurantTag])
    }

    setNewRestaurantTag("")
  }

  const handleAddFoodTag = () => {
    if (!newFoodTag.trim()) return

    if (!foodTags.includes(newFoodTag)) {
      setFoodTags([...foodTags, newFoodTag])
    }

    setNewFoodTag("")
  }

  const removeRestaurantTag = (tag: string) => {
    setRestaurantTags(restaurantTags.filter(t => t !== tag))
  }

  const removeFoodTag = (tag: string) => {
    setFoodTags(foodTags.filter(t => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      setError("Post content is required")
      return
    }

    if (images.length === 0) {
      setError("At least one image is required")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("content", content)

      if (title) {
        formData.append("title", title)
      }

      if (rating > 0) {
        formData.append("rating", rating.toString())
      }

      restaurantTags.forEach(tag => {
        formData.append("restaurantTags", tag)
      })

      foodTags.forEach(tag => {
        formData.append("foodTags", tag)
      })

      images.forEach(image => {
        formData.append("images", image)
      })

      const { data } = await postsAPI.createPost(formData)

      if (data.success) {
        router.push(ROUTES.POST_DETAIL(data.data._id))
      } else {
        setError("Failed to create post")
      }
    } catch (error: unknown) {
      console.error("Error creating post:", error)
      const errorMessage = error instanceof Error
        ? error.message
        : "An error occurred while creating the post"
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-card rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Create Post</h1>
          <Link
            href={ROUTES.HOME}
            className="text-primary hover:text-primary/80"
          >
            Cancel
          </Link>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
              Title (Optional)
            </label>
            <Input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a title to your post"
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="content" className="block text-sm font-medium text-foreground mb-1">
              Content*
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content..."
              rows={4}
              className="resize-none"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-1">
              Images* (Maximum 4)
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-input">
                  <Image
                    src={url}
                    alt={`Preview ${index + 1}`}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-full hover:bg-destructive/90"
                    onClick={() => removeImage(index)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <button
                  type="button"
                  className="aspect-square rounded-md border-2 border-dashed border-input flex flex-col items-center justify-center hover:bg-accent"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  <Camera size={24} className="text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Add Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {images.length}/4 images uploaded. Recommended size: 1200x800 pixels.
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-1">
              Rating (Optional)
            </label>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1"
                  onClick={() => setRating(star)}
                  disabled={isSubmitting}
                >
                  <Star
                    size={24}
                    className={`${star <= rating ? "text-yellow-400 fill-current" : "text-muted"}`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">{rating} out of 5</span>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-1">
              Restaurant Tags (Optional)
            </label>
            <div className="flex items-center">
              <Input
                type="text"
                value={newRestaurantTag}
                onChange={(e) => setNewRestaurantTag(e.target.value)}
                placeholder="Add restaurant tag"
                className="rounded-r-none"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                className="rounded-l-none"
                onClick={handleAddRestaurantTag}
                disabled={!newRestaurantTag.trim() || isSubmitting}
              >
                <Plus size={20} />
              </Button>
            </div>
            {restaurantTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {restaurantTags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1 bg-primary/10">
                    <span>{tag}</span>
                    <button
                      type="button"
                      className="text-foreground hover:text-foreground/80"
                      onClick={() => removeRestaurantTag(tag)}
                      disabled={isSubmitting}
                    >
                      <X size={14} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-1">
              Food Tags (Optional)
            </label>
            <div className="flex items-center">
              <Input
                type="text"
                value={newFoodTag}
                onChange={(e) => setNewFoodTag(e.target.value)}
                placeholder="Add food tag"
                className="rounded-r-none"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                className="rounded-l-none"
                variant="secondary"
                onClick={handleAddFoodTag}
                disabled={!newFoodTag.trim() || isSubmitting}
              >
                <Plus size={20} />
              </Button>
            </div>
            {foodTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {foodTags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    <span>{tag}</span>
                    <button
                      type="button"
                      className="text-secondary-foreground hover:text-secondary-foreground/80"
                      onClick={() => removeFoodTag(tag)}
                      disabled={isSubmitting}
                    >
                      <X size={14} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim() || images.length === 0}
            >
              {isSubmitting ? "Creating..." : "Create Post"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import postsAPI from "@/services/posts"
import { Skeleton } from "@/components/ui/skeleton"
import { Heart, MessageCircle, Share, User, Calendar, MapPin, ArrowLeft } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import Link from "next/link"
import { ROUTES } from "@/lib/constants"

interface PostComment {
  _id: string
  content: string
  user: {
    _id: string
    name: string
    profileImage?: string
  }
  createdAt: string
}

interface Post {
  _id: string
  user: {
    _id: string
    name: string
    profileImage?: string
  }
  content: string
  title?: string
  images: string[]
  createdAt: string
  restaurantTags: string[]
  foodTags: string[]
  likes: number
  liked?: boolean
}

interface RestaurantInfo {
  _id: string
  name: string
  address: string
  contactInfo: {
    phone?: string
    email?: string
    website?: string
  }
}

interface FoodInfo {
  _id: string
  name: string
  price: number
  images: string[]
}

export default function PostDetail() {
  const { id } = useParams()
  const router = useRouter()
  const { user: currentUser, isAuthenticated } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<PostComment[]>([])
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo[]>([])
  const [foodInfo, setFoodInfo] = useState<FoodInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    const fetchPostData = async () => {
      setIsLoading(true)
      try {
        const { data } = await postsAPI.getPost(id as string)
        if (data.success) {
          setPost(data.data.post)
          setComments(data.data.comments || [])
          setRestaurantInfo(data.data.restaurantInfo || [])
          setFoodInfo(data.data.foodInfo || [])
          setLiked(data.data.post.liked || false)
        } else {
          setError("Failed to load post data")
        }
      } catch (err) {
        console.error(err)
        setError("An error occurred while fetching post data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPostData()
  }, [id])

  const handleLike = async () => {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN)
      return
    }

    try {
      const { data } = await postsAPI.likePost(post?._id as string)
      if (data.success) {
        setLiked(data.data.liked)
        setPost(prev => prev ? {
          ...prev,
          likes: data.data.likes
        } : null)
      }
    } catch (err) {
      console.error("Error liking post:", err)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN)
      return
    }

    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const { data } = await postsAPI.addComment(post?._id as string, newComment)
      if (data.success) {
        setComments(prev => [data.data, ...prev])
        setNewComment("")
      }
    } catch (err) {
      console.error("Error adding comment:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    try {
      const { data } = await postsAPI.deleteComment(commentId)
      if (data.success) {
        setComments(prev => prev.filter(comment => comment._id !== commentId))
      }
    } catch (err) {
      console.error("Error deleting comment:", err)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="ml-3">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-4 w-3/4 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-1/2 mb-6" />
          <Skeleton className="aspect-video w-full rounded-md mb-6" />
          <div className="flex justify-between">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            {Array(3).fill(0).map((_, idx) => (
              <div key={idx} className="flex">
                <Skeleton className="h-10 w-10 rounded-full mr-3" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || "Post not found"}
        </div>
        <Link href={ROUTES.HOME} className="text-indigo-600 hover:text-indigo-800">
          &larr; Back to home
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={ROUTES.HOME}
        className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
      >
        <ArrowLeft size={18} className="mr-1" />
        Back to home
      </Link>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {/* User info */}
        <div className="flex items-center mb-4">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
            {post.user?.profileImage ? (
              <Image
                src={post.user.profileImage}
                alt={post.user.name}
                width={40}
                height={40}
                className="h-10 w-10 object-cover"
              />
            ) : (
              <User size={20} />
            )}
          </div>
          <div className="ml-3">
            <p className="font-semibold">{post.user?.name || "User"}</p>
            <div className="flex items-center text-gray-500 text-xs">
              <Calendar size={12} className="mr-1" />
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Post content */}
        {post.title && <h1 className="text-xl font-bold mb-3">{post.title}</h1>}
        <p className="text-gray-700 mb-4 whitespace-pre-line">{post.content}</p>

        {/* Tags */}
        {(post.restaurantTags.length > 0 || post.foodTags.length > 0) && (
          <div className="mb-4">
            {post.restaurantTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {post.restaurantTags.map((tag, index) => (
                  <span key={index} className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {post.foodTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.foodTags.map((tag, index) => (
                  <span key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Images */}
        {post.images.length > 0 && (
          <div className="mb-6">
            <div className="relative aspect-video mb-2 rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={post.images[activeImageIndex]}
                alt={`Post image ${activeImageIndex + 1}`}
                width={640}
                height={360}
                className="w-full h-full object-contain"
              />
            </div>
            {post.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {post.images.map((image, idx) => (
                  <button
                    key={idx}
                    className={`w-16 h-16 rounded-md overflow-hidden flex-shrink-0 ${idx === activeImageIndex ? 'ring-2 ring-indigo-500' : ''
                      }`}
                    onClick={() => setActiveImageIndex(idx)}
                  >
                    <Image
                      src={image}
                      alt={`Thumbnail ${idx + 1}`}
                      width={64}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Restaurant and food info */}
        {restaurantInfo.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-2">Tagged Restaurants</h3>
            <div className="space-y-2">
              {restaurantInfo.map(restaurant => (
                <Link
                  key={restaurant._id}
                  href={ROUTES.RESTAURANT_DETAIL(restaurant._id)}
                  className="flex items-start hover:bg-gray-100 p-2 rounded-md"
                >
                  <MapPin size={16} className="text-gray-500 mt-1 mr-2" />
                  <div>
                    <p className="font-medium">{restaurant.name}</p>
                    {restaurant.address && (
                      <p className="text-sm text-gray-600">{restaurant.address}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {foodInfo.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-2">Tagged Food Items</h3>
            <div className="grid grid-cols-2 gap-2">
              {foodInfo.map(food => (
                <div key={food._id} className="flex items-center bg-white p-2 rounded-md">
                  {food.images?.length > 0 && (
                    <div className="w-10 h-10 rounded-md overflow-hidden mr-2">
                      <Image
                        src={food.images[0]}
                        alt={food.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{food.name}</p>
                    <p className="text-xs text-gray-600">${food.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-between border-t pt-3">
          <button
            className={`flex items-center ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            onClick={handleLike}
          >
            <Heart size={20} className="mr-1" fill={liked ? "currentColor" : "none"} />
            <span>{post.likes} {post.likes === 1 ? 'Like' : 'Likes'}</span>
          </button>
          <button
            className="flex items-center text-gray-500 hover:text-blue-500"
            onClick={() => document.getElementById('comment-input')?.focus()}
          >
            <MessageCircle size={20} className="mr-1" />
            <span>{comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}</span>
          </button>
          <button className="flex items-center text-gray-500 hover:text-green-500">
            <Share size={20} className="mr-1" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Comments section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>

        {/* Comment form */}
        {isAuthenticated ? (
          <form onSubmit={handleAddComment} className="mb-6">
            <div className="flex">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden mr-3">
                {currentUser?.profileImage ? (
                  <Image
                    src={currentUser.profileImage}
                    alt={currentUser.name || "User"}
                    width={40}
                    height={40}
                    className="h-10 w-10 object-cover"
                  />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div className="flex-1">
                <textarea
                  id="comment-input"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={2}
                  disabled={isSubmitting}
                ></textarea>
                <button
                  type="submit"
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                  disabled={isSubmitting || !newComment.trim()}
                >
                  {isSubmitting ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <p className="text-gray-700">
              Please <Link href={ROUTES.LOGIN} className="text-indigo-600 hover:text-indigo-800">log in</Link> to post comments.
            </p>
          </div>
        )}

        {/* Comments list */}
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment._id} className="flex">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden mr-3">
                  {comment.user?.profileImage ? (
                    <Image
                      src={comment.user.profileImage}
                      alt={comment.user.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 object-cover"
                    />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{comment.user?.name || "User"}</p>
                        <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                      </div>
                      {(currentUser?._id === comment.user._id || currentUser?._id === post.user._id) && (
                        <button
                          className="text-gray-400 hover:text-red-500 text-xs"
                          onClick={() => handleDeleteComment(comment._id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-gray-700">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  )
} 
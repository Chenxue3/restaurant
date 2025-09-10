import { format } from "date-fns"
import Link from "next/link"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2 } from "lucide-react"
import { ROUTES } from "@/lib/constants"

export interface PostCardProps {
  id?: string
  username: string
  userAvatar?: string
  date: string | Date
  content: string
  images?: string[]
  location?: string
  tags?: string[]
  likes?: number
  comments?: number
  isLoading?: boolean
}

export function PostCard({
  id,
  username,
  userAvatar,
  date,
  content,
  images,
  location,
  tags,
  likes = 0,
  comments = 0,
  isLoading = false,
}: PostCardProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg p-4 space-y-4 mb-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
        <div className="flex space-x-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    )
  }

  const formattedDate = date instanceof Date
    ? format(date, "MMMM d, yyyy")
    : format(new Date(date), "MMMM d, yyyy")

  const postContent = (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3 hover:bg-gray-50 transition-colors mb-4">
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10 border">
          <AvatarImage src={userAvatar} alt={username} />
          <AvatarFallback>{username.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-gray-900">{username}</h3>
          <p className="text-xs text-gray-500">{formattedDate}</p>
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-800 whitespace-pre-line">{content}</p>

        {(location || tags?.length) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {location && (
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                📍 {location}
              </span>
            )}

            {tags?.map((tag, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 px-2 py-1 rounded-full text-blue-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {images && images.length > 0 && (
        <div className={`grid ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mt-2`}>
          {images.map((image, index) => (
            <div key={index} className="relative rounded-xl overflow-hidden aspect-video">
              <Image
                src={image}
                alt={`Post image ${index + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
        <div className="flex space-x-6">
          <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-500 hover:text-red-500">
            <Heart className="h-4 w-4" />
            <span className="text-xs font-medium">{likes}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-500 hover:text-blue-500">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs font-medium">{comments}</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-green-500">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return id ? (
    <Link href={ROUTES.POST_DETAILS(id)} className="block">
      {postContent}
    </Link>
  ) : (
    postContent
  )
} 
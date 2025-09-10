import { Skeleton } from "../../../components/ui/skeleton"
import Link from "next/link"
import Image from "next/image"
import { ROUTES } from "@/lib/constants"
import { Flame, MapPin, Tag } from "lucide-react"

export interface RestaurantCardProps {
  name: string
  location: string
  tags: Array<{
    label: string
    score: number
  }>
  mainImage: string
  thumbnails: string[]
  views?: number
  isLoading?: boolean
  id?: string
}

export function RestaurantCard({
  name,
  location,
  tags,
  mainImage,
  thumbnails,
  views,
  isLoading = false,
  id
}: RestaurantCardProps) {
  if (isLoading) {
    return (
      <div className="mb-6 bg-white rounded-lg overflow-hidden shadow-md">
        <Skeleton className="h-48 w-full" />
        <div className="p-4">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <div className="flex gap-2 mb-3">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="flex gap-1 mt-3">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      </div>
    )
  }

  const CardContent = () => (
    <>
      <div className="relative h-48 overflow-hidden">
        {mainImage ? (
          <div className="relative w-full h-full">
            <Image
              src={mainImage}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image available</span>
          </div>
        )}
        {views !== undefined && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-black font-bold rounded-full p-1 px-2 text-sm z-10">
            {views.toFixed(1)}★
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold mb-1 flex items-center">
          {name}
          <span className="ml-2 text-orange-500">
            <Flame size={18} />
          </span>
        </h3>
        <div className="flex items-center mb-3">
          <MapPin size={16} className="mr-1 text-gray-500" />
          <span className="text-sm">{location}</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag, i) => (
            <div key={i} className="flex items-center bg-gray-100 rounded-md px-2 py-1">
              <span className="text-xs font-medium">{tag.label}</span>
              {tag.score > 0 && (
                <>
                  <Tag size={12} className="mx-1 text-gray-500" />
                  <span className="text-xs text-green-600">{tag.score}%</span>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-1 mt-3">
          {thumbnails.slice(0, 4).map((thumb, i) => (
            <div key={i} className="w-14 h-14 overflow-hidden rounded-md relative">
              <Image
                src={thumb}
                alt={`Thumbnail ${i + 1}`}
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
          ))}
          {thumbnails.length === 0 && (
            <div className="w-14 h-14 bg-gray-100 rounded-md flex items-center justify-center">
              <span className="text-gray-400 text-xs">No photos</span>
            </div>
          )}
        </div>
      </div>
    </>
  )

  return (
    <div className="mb-6 bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      {id ? (
        <Link href={ROUTES.RESTAURANT_DETAIL(id)}>
          <CardContent />
        </Link>
      ) : (
        <CardContent />
      )}
    </div>
  )
} 
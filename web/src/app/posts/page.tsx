"use client"

import { useEffect, useState } from "react"
import { NavigationTabs } from "@/app/posts/components/NavigationTabs"
import { RestaurantCard } from "@/app/posts/components/RestaurantCard"
import { PostCard } from "@/components/posts/PostCard"
import { ChevronDown, Utensils } from "lucide-react"
import { API_URL } from "@/lib/constants"

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
  comments?: number
  location?: string
}

interface Restaurant {
  _id: string
  name: string
  location?: string
  cuisineType: string[]
  priceRange: string
  description: string
  images: string[]
  logoImage?: string
  rating: number
  hasStudentDiscount: boolean
}

export default function Posts() {
  const [isLoading, setIsLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch posts
        const postsResponse = await fetch(`${API_URL}/api/posts?limit=5`)
        const postsData = await postsResponse.json()

        if (postsData.success) {
          setPosts(postsData.data)
        } else {
          throw new Error(postsData.message || 'Failed to fetch posts')
        }

        // Fetch restaurants
        const restaurantsResponse = await fetch(`${API_URL}/api/restaurants?limit=3&sort=rating`)
        const restaurantsData = await restaurantsResponse.json()

        if (restaurantsData.success) {
          setRestaurants(restaurantsData.data)
        } else {
          throw new Error(restaurantsData.message || 'Failed to fetch restaurants')
        }

        setIsLoading(false)
      } catch (err: unknown) {
        console.error('Error fetching data:', err)
        const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching data'
        setError(errorMessage)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Extract address info for restaurant location
  const getRestaurantLocation = (restaurant: Restaurant) => {
    if (restaurant.location) return restaurant.location
    return `${restaurant.cuisineType?.join(', ') || 'Restaurant'}`
  }

  // Convert restaurant info to tags for display
  const getRestaurantTags = (restaurant: Restaurant) => {
    const tags = []

    if (restaurant.priceRange) {
      tags.push({ label: restaurant.priceRange, score: 100 })
    }

    if (restaurant.hasStudentDiscount) {
      tags.push({ label: 'Student Discount', score: 90 })
    }

    return tags
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <NavigationTabs />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          // Show loading skeletons
          Array(3).fill(0).map((_, index) => (
            <PostCard
              key={`skeleton-${index}`}
              username=""
              content=""
              date=""
              isLoading={true}
            />
          ))
        ) : posts.length > 0 ? (
          // Show actual posts
          posts.map(post => (
            <PostCard
              key={post._id}
              id={post._id}
              username={post.user?.name || "User"}
              userAvatar={post.user?.profileImage}
              content={post.content}
              date={post.createdAt}
              images={post.images}
              tags={[...post.restaurantTags, ...post.foodTags]}
              location={post.location}
              likes={post.likes}
              comments={post.comments || 0}
            />
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">No posts found</p>
        )}
      </div>

      <div className="md:col-span-1">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          Food Choice
          <Utensils size={20} className="mx-2" />
          <ChevronDown size={16} />
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          // Show loading skeletons for restaurant cards
          Array(2).fill(0).map((_, index) => (
            <RestaurantCard
              key={`skeleton-card-${index}`}
              name=""
              location=""
              tags={[]}
              mainImage=""
              thumbnails={[]}
              isLoading={true}
            />
          ))
        ) : restaurants.length > 0 ? (
          // Show actual restaurant cards
          restaurants.map(restaurant => (
            <RestaurantCard
              key={restaurant._id}
              name={restaurant.name}
              location={getRestaurantLocation(restaurant)}
              tags={getRestaurantTags(restaurant)}
              mainImage={restaurant.logoImage || (restaurant.images.length > 0 ? restaurant.images[0] : '')}
              thumbnails={restaurant.images.slice(0, 4)}
              views={restaurant.rating}
              id={restaurant._id}
            />
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">No restaurants found</p>
        )}
      </div>
    </div>
  )
}

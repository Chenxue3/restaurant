import { User } from './user'

export interface Post {
  _id: string
  user: User
  content: string
  title: string
  images: string[]
  createdAt: string
  restaurantTags: string[]
  foodTags: string[]
  likes: number
  comments: number
  location: string
} 
interface Dish {
  _id?: string
  name: string
  description: string
  price: number
  images?: string[]
  ingredients: string[]
  allergens: string[]
  flavor_profile?: string
  texture: string[]
  isVegetarian: boolean
  isVegan: boolean
  isGlutenFree: boolean
  spicyLevel: number
  category: string
  isAvailable: boolean
  displayOrder: number
  rating?: number
  totalReviews?: number
  popularityScore?: number
}

export type { Dish }

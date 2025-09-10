'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Chatbot from '@/components/Chatbot'
import { useAuth } from "@/hooks/useAuth"

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import {
  Coffee,
} from 'lucide-react'

// API and components
import restaurantsAPI from '@/services/restaurants'
import RestaurantCardSkeleton from './components/RestaurantCardSkeleton'
import RestaurantCard from './components/RestaurantCard'
import RestaurantsFilter from './components/RestaurantsFilter'

interface SearchParams {
  search?: string
  cuisine?: string
  sort?: 'name' | 'rating' | 'priceAsc' | 'priceDesc'
  priceRange?: string
}

interface FiltersState {
  searchQuery: string
  selectedCuisine: string
  selectedPrice: string
  sortOption: string
}

export default function Home() {
  const { isAuthenticated } = useAuth()
  const [filters, setFilters] = useState<FiltersState>({
    searchQuery: '',
    selectedCuisine: '',
    selectedPrice: '',
    sortOption: 'rating'
  })
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [initialized, setInitialized] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!initialized) {
      const initialQuery = searchParams.get('search') || ''
      const initialCuisine = searchParams.get('cuisine') || ''
      const initialPrice = searchParams.get('price') || ''
      const initialSort = searchParams.get('sort') || 'rating'
      setFilters({
        searchQuery: initialQuery,
        selectedCuisine: initialCuisine,
        selectedPrice: initialPrice === 'any' ? '' : initialPrice,
        sortOption: initialSort
      })
      setDebouncedSearchQuery(initialQuery)
      setInitialized(true)
    }
    // eslint-disable-next-line
  }, [])

  // Debounce search query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(filters.searchQuery)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [filters.searchQuery])

  // get restaurants
  const fetchRestaurants = useCallback(async () => {
    if (!initialized) return
    setIsLoading(true)
    const params: SearchParams = {
      search: debouncedSearchQuery,
      cuisine: filters.selectedCuisine,
      sort: filters.sortOption as 'name' | 'rating' | 'priceAsc' | 'priceDesc',
    }
    if (filters.selectedPrice && filters.selectedPrice !== 'any') {
      params.priceRange = filters.selectedPrice
    }
    try {
    
      const { data } = await restaurantsAPI.getRestaurants(params)
      if (data.success) {
        
        setRestaurants(data.data)
        setFilteredRestaurants(data.data)
      }
    } catch {
      console.error('Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearchQuery, filters.selectedCuisine, filters.selectedPrice, filters.sortOption, initialized])

  // fetch restaurants
  useEffect(() => {
    
    fetchRestaurants()

    const handleRestaurantUpdate = () => {
      
      fetchRestaurants()
    }

    window.addEventListener('restaurantUpdated', handleRestaurantUpdate)
    return () => {
      window.removeEventListener('restaurantUpdated', handleRestaurantUpdate)
    }
  }, [fetchRestaurants])

  // Define applyFilters for manual filter application (used by RestaurantsFilter component)
  const applyFilters = useCallback(() => {
    // This function now just triggers the search immediately
    setDebouncedSearchQuery(filters.searchQuery)
  }, [filters.searchQuery])

  // Handle filter changes
  const handleFilterChange = (newFilters: FiltersState) => {
    setFilters(newFilters)
  }

  const clearAllFilters = () => {
    setFilters({
      searchQuery: '',
      selectedCuisine: '',
      selectedPrice: '',
      sortOption: 'rating'
    })
    setDebouncedSearchQuery('')
  }

  // Available cuisines derived from all restaurants
  const cuisines = [...new Set(restaurants.flatMap(r => r.cuisineType || []))].filter(Boolean)

  const handleSearch = () => {
    setDebouncedSearchQuery(filters.searchQuery)
  }

  return (
    <div className="min-h-screen">
      {isAuthenticated ? (
        <>
          {/* Chatbot functionality */}
          <Chatbot />
        </>
      ) : (
        <p>Please log in to access the chatbot feature.</p>
      )}

      {/* Main Content */}
      <section className="container mx-auto max-w-6xl px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4 md:flex-nowrap mb-6">
          {/* Search Input */}
          <div className="flex w-full items-center">
            <div className="relative flex-1 mr-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search restaurants or foods..."
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange({ ...filters, searchQuery: e.target.value })}
                className="pl-10 w-full"
              />
            </div>
            <Button onClick={handleSearch}>
              Search
            </Button>
          </div>

          {/* Filters Section */}
          <RestaurantsFilter
            filters={filters}
            onFilterChange={handleFilterChange}
            onApplyFilters={applyFilters}
            onClearFilters={clearAllFilters}
            cuisines={cuisines}
          />
        </div>

        {/* Restaurant Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <RestaurantCardSkeleton key={item} />
            ))}
          </div>
        ) : filteredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant._id} restaurant={restaurant} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Coffee className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Restaurants Found</h3>
            <p className="text-muted-foreground mb-6">Try changing your filters or search criteria</p>
            <Button
              variant="outline"
              onClick={clearAllFilters}
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}

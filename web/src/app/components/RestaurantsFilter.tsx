'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Filter, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet"

interface FiltersState {
  searchQuery: string
  selectedCuisine: string
  selectedPrice: string
  sortOption: string
}

interface RestaurantsFilterProps {
  filters: FiltersState
  onFilterChange: (newFilters: FiltersState) => void
  onApplyFilters: () => void
  onClearFilters: () => void
  cuisines: string[]
}

export default function RestaurantsFilter({
  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  cuisines
}: RestaurantsFilterProps) {
  const handleCuisineChange = (value: string) => {
    onFilterChange({ ...filters, selectedCuisine: value === 'all' ? '' : value })
  }

  const handlePriceChange = (value: string) => {
    onFilterChange({ ...filters, selectedPrice: value === 'any' ? '' : value })
  }

  const handleSortChange = (value: string) => {
    onFilterChange({ ...filters, sortOption: value })
  }

  const hasActiveFilters = filters.selectedCuisine || filters.selectedPrice

  // For desktop view
  const FilterControls = () => (
    <div className="flex flex-col gap-3 w-full">
      <Select value={filters.selectedCuisine === '' ? 'all' : filters.selectedCuisine} onValueChange={handleCuisineChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Cuisine Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Cuisines</SelectItem>
          {cuisines.map((cuisine) => (
            <SelectItem key={cuisine} value={cuisine}>{cuisine}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.selectedPrice === '' ? 'any' : filters.selectedPrice} onValueChange={handlePriceChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Price Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any Price</SelectItem>
          <SelectItem value="$">$ (Inexpensive)</SelectItem>
          <SelectItem value="$$">$$ (Moderate)</SelectItem>
          <SelectItem value="$$$">$$$ (Expensive)</SelectItem>
          <SelectItem value="$$$$">$$$$ (Very Expensive)</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.sortOption} onValueChange={handleSortChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="rating">Top Rated</SelectItem>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="priceAsc">Price: Low to High</SelectItem>
          <SelectItem value="priceDesc">Price: High to Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      {/* Desktop filters */}
      <div className="hidden sm:flex sm:space-x-2">
        <Select value={filters.selectedCuisine === '' ? 'all' : filters.selectedCuisine} onValueChange={handleCuisineChange}>
          <SelectTrigger>
            <SelectValue placeholder="Cuisine Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cuisines</SelectItem>
            {cuisines.map((cuisine) => (
              <SelectItem key={cuisine} value={cuisine}>{cuisine}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.selectedPrice === '' ? 'any' : filters.selectedPrice} onValueChange={handlePriceChange}>
          <SelectTrigger>
            <SelectValue placeholder="Price Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Price</SelectItem>
            <SelectItem value="$">$ (Inexpensive)</SelectItem>
            <SelectItem value="$$">$$ (Moderate)</SelectItem>
            <SelectItem value="$$$">$$$ (Expensive)</SelectItem>
            <SelectItem value="$$$$">$$$$ (Very Expensive)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.sortOption} onValueChange={handleSortChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Top Rated</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="priceAsc">Price: Low to High</SelectItem>
            <SelectItem value="priceDesc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile filter button and sheet */}
      <div className="sm:hidden w-full">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full flex items-center justify-center"
            >
              <Filter className="mr-2 h-4 w-4" />
              {hasActiveFilters ? 'Filters (Active)' : 'Filters'}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-xl p-4">
            <SheetHeader className="pb-4 border-b">
              <SheetTitle>Restaurant Filters</SheetTitle>
              <SheetDescription>
                Filter restaurants by cuisine, price range, and sort options.
              </SheetDescription>
            </SheetHeader>

            <div className="py-6 space-y-6">
              <FilterControls />
            </div>

            <SheetFooter className="flex-col gap-3">
              <SheetClose asChild>
                <Button onClick={onApplyFilters} className="w-full">
                  Apply Filters
                </Button>
              </SheetClose>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={onClearFilters}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              )}
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Filter Tags - only shown when filters are active */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          {filters.selectedCuisine && (
            <Badge variant="outline" className="px-2 py-1 bg-primary/10">
              {filters.selectedCuisine}
              <button
                className="ml-1.5 hover:text-primary"
                onClick={() => onFilterChange({ ...filters, selectedCuisine: '' })}
              >
                <X size={14} />
              </button>
            </Badge>
          )}
          {filters.selectedPrice && (
            <Badge variant="outline" className="px-2 py-1 bg-primary/10">
              {filters.selectedPrice}
              <button
                className="ml-1.5 hover:text-primary"
                onClick={() => onFilterChange({ ...filters, selectedPrice: '' })}
              >
                <X size={14} />
              </button>
            </Badge>
          )}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onClearFilters}
            >
              Clear All
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

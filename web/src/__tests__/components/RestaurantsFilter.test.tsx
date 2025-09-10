import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import RestaurantsFilter from '@/app/components/RestaurantsFilter'

const mockFilters = {
  searchQuery: '',
  selectedCuisine: '',
  selectedPrice: '',
  sortOption: 'rating'
}

const mockCuisines = ['Italian', 'Chinese', 'Japanese', 'Mexican']

describe('RestaurantsFilter Component', () => {
  const mockOnFilterChange = vi.fn()
  const mockOnApplyFilters = vi.fn()
  const mockOnClearFilters = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all filter controls', () => {
    render(
      <RestaurantsFilter
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
        onApplyFilters={mockOnApplyFilters}
        onClearFilters={mockOnClearFilters}
        cuisines={mockCuisines}
      />
    )

    expect(screen.getByText('All Cuisines')).toBeInTheDocument()
    expect(screen.getByText('Any Price')).toBeInTheDocument()
    expect(screen.getByText('Top Rated')).toBeInTheDocument()
  })

  it('handles cuisine selection', () => {
    render(
      <RestaurantsFilter
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
        onApplyFilters={mockOnApplyFilters}
        onClearFilters={mockOnClearFilters}
        cuisines={mockCuisines}
      />
    )

    const cuisineSelect = screen.getAllByRole('combobox')[0]
    fireEvent.click(cuisineSelect)
    
    const italianOption = screen.getByText('Italian')
    fireEvent.click(italianOption)

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...mockFilters,
      selectedCuisine: 'Italian'
    })
  })

  it('handles price range selection', () => {
    render(
      <RestaurantsFilter
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
        onApplyFilters={mockOnApplyFilters}
        onClearFilters={mockOnClearFilters}
        cuisines={mockCuisines}
      />
    )

    const priceSelect = screen.getAllByRole('combobox')[1]
    fireEvent.click(priceSelect)
    
    const moderateOption = screen.getByText('$$ (Moderate)')
    fireEvent.click(moderateOption)

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...mockFilters,
      selectedPrice: '$$'
    })
  })

  it('handles sort option selection', () => {
    render(
      <RestaurantsFilter
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
        onApplyFilters={mockOnApplyFilters}
        onClearFilters={mockOnClearFilters}
        cuisines={mockCuisines}
      />
    )

    const sortSelect = screen.getAllByRole('combobox')[2]
    fireEvent.click(sortSelect)
    
    const nameOption = screen.getByText('Name')
    fireEvent.click(nameOption)

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...mockFilters,
      sortOption: 'name'
    })
  })

  it('calls onClearFilters when clear all button is clicked', () => {
    const filtersWithSelections = {
      ...mockFilters,
      selectedCuisine: 'Italian',
      selectedPrice: '$$'
    }

    render(
      <RestaurantsFilter
        filters={filtersWithSelections}
        onFilterChange={mockOnFilterChange}
        onApplyFilters={mockOnApplyFilters}
        onClearFilters={mockOnClearFilters}
        cuisines={mockCuisines}
      />
    )

    const clearAllButton = screen.getByText('Clear All')
    fireEvent.click(clearAllButton)

    expect(mockOnClearFilters).toHaveBeenCalled()
  })

  it('shows mobile filter button on small screens', () => {
    render(
      <RestaurantsFilter
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
        onApplyFilters={mockOnApplyFilters}
        onClearFilters={mockOnClearFilters}
        cuisines={mockCuisines}
      />
    )

    const mobileFilterButton = screen.getByText('Filters')
    expect(mobileFilterButton).toBeInTheDocument()
    expect(mobileFilterButton.closest('div')).toHaveClass('sm:hidden')
  })

  it('shows "Filters (Active)" when filters are applied', () => {
    const filtersWithSelections = {
      ...mockFilters,
      selectedCuisine: 'Italian'
    }

    render(
      <RestaurantsFilter
        filters={filtersWithSelections}
        onFilterChange={mockOnFilterChange}
        onApplyFilters={mockOnApplyFilters}
        onClearFilters={mockOnClearFilters}
        cuisines={mockCuisines}
      />
    )

    expect(screen.getByText('Filters (Active)')).toBeInTheDocument()
  })
}) 
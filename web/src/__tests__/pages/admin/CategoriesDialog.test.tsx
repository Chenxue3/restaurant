import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CategoriesDialog from '@/app/admin/restaurants/[id]/components/CategoriesDialog'
import restaurantsAPI from '../../../services/restaurants'
import { AxiosResponse } from 'axios'
import { toast } from 'sonner'

// Mock restaurantsAPI
vi.mock('@/services/restaurants', () => ({
  default: {
    getCategories: vi.fn(),
    createCategory: vi.fn(),
    deleteCategory: vi.fn()
  }
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('CategoriesDialog', () => {
  const mockRestaurantId = '123'
  const mockCategories = [
    { _id: '1', name: 'Appetizers', description: 'Starters', displayOrder: 1 },
    { _id: '2', name: 'Main Course', description: 'Main dishes', displayOrder: 2 }
  ]

  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(restaurantsAPI.getCategories).mockResolvedValue({
      data: { success: true, data: mockCategories },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as unknown
    } as AxiosResponse)
  })

  it('renders dialog with correct title and description', () => {
    render(
      <CategoriesDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        restaurantId={mockRestaurantId}
      />
    )

    expect(screen.getByText('Manage Menu Categories')).toBeInTheDocument()
    expect(screen.getByText('View and create categories for organizing your menu items')).toBeInTheDocument()
  })

  it('loads and displays existing categories', async () => {
    render(
      <CategoriesDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        restaurantId={mockRestaurantId}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Appetizers')).toBeInTheDocument()
      expect(screen.getByText('Starters')).toBeInTheDocument()
      expect(screen.getByText('Main Course')).toBeInTheDocument()
      expect(screen.getByText('Main dishes')).toBeInTheDocument()
    })
  })

  it('shows loading state while fetching categories', () => {
    vi.mocked(restaurantsAPI.getCategories).mockImplementation(
      () => new Promise(() => {})
    )

    render(
      <CategoriesDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        restaurantId={mockRestaurantId}
      />
    )

    expect(screen.getByText('Loading categories...')).toBeInTheDocument()
  })

  it('shows empty state when no categories exist', async () => {
    vi.mocked(restaurantsAPI.getCategories).mockResolvedValue({
      data: { success: true, data: [] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as unknown
    } as AxiosResponse)

    render(
      <CategoriesDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        restaurantId={mockRestaurantId}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('No categories created yet.')).toBeInTheDocument()
    })
  })

  it('handles category creation', async () => {
    const mockCreateCategory = vi.fn().mockResolvedValue({ data: { success: true } })
    vi.mocked(restaurantsAPI.createCategory).mockImplementation(mockCreateCategory)

    render(
      <CategoriesDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        restaurantId={mockRestaurantId}
      />
    )

    // Fill in category form
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'New Category' } })
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'New Description' } })
    fireEvent.change(screen.getByLabelText('Display Order'), { target: { value: '3' } })

    // Submit form
    fireEvent.click(screen.getByText('Create Category'))

    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalledWith(mockRestaurantId, {
        name: 'New Category',
        description: 'New Description',
        displayOrder: 3
      })
      expect(toast.success).toHaveBeenCalledWith('Category created successfully')
    })
  })

  
}) 
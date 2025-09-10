import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DishDialog from '@/app/admin/restaurants/[id]/components/DishDialog'
import restaurantsAPI from '@/services/restaurants'
import { toast } from 'sonner'
import { AxiosResponse } from 'axios'

// Mock next/image
vi.mock('next/image', () => ({
  default: () => <></>
}))

// Mock restaurantsAPI
vi.mock('@/services/restaurants', () => ({
  default: {
    getCategories: vi.fn(),
    createDish: vi.fn(),
    updateDish: vi.fn(),
    deleteDish: vi.fn()
  }
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('DishDialog', () => {
  const mockRestaurantId = '123'
  const mockCategories = [
    { _id: '1', name: 'Appetizers', description: 'Starters', displayOrder: 1 },
    { _id: '2', name: 'Main Course', description: 'Main dishes', displayOrder: 2 }
  ]

  const mockDish = {
    _id: '1',
    name: 'Test Dish',
    description: 'Test Description',
    price: 9.99,
    ingredients: ['ingredient1', 'ingredient2'],
    allergens: ['allergen1'],
    flavor_profile: 'spicy',
    texture: ['crispy'],
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: true,
    spicyLevel: 2,
    category: '1',
    isAvailable: true,
    displayOrder: 1,
    images: ['https://example.com/image1.jpg']
  }

  const mockOnDishSaved = vi.fn()
  const mockOnDishDeleted = vi.fn()
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock the API response for categories
    vi.mocked(restaurantsAPI.getCategories).mockResolvedValue({
      data: { success: true, data: mockCategories },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as unknown
    } as AxiosResponse)
  })

  it('renders create dish dialog correctly', async () => {
    render(
      <DishDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        restaurantId={mockRestaurantId}
        onDishSaved={mockOnDishSaved}
      />
    )

    expect(screen.getByText('Create New Dish')).toBeInTheDocument()
    expect(screen.getByText('Add a new dish to your menu')).toBeInTheDocument()
    
    // Basic information section
    expect(screen.getByText('Basic Information')).toBeInTheDocument()
    expect(screen.getByLabelText(/Name \*/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Price \*/)).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText(/Category \*/)).toBeInTheDocument()
    
    // Wait for categories to be loaded
    await waitFor(() => {
      expect(restaurantsAPI.getCategories).toHaveBeenCalledWith(mockRestaurantId)
    })
  })

  it('loads categories when dialog opens', async () => {
    render(
      <DishDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        restaurantId={mockRestaurantId}
        onDishSaved={mockOnDishSaved}
      />
    )

    await waitFor(() => {
      expect(restaurantsAPI.getCategories).toHaveBeenCalledWith(mockRestaurantId)
    })
  })

  it('handles dish update successfully', async () => {
    // Mock successful dish update
    vi.mocked(restaurantsAPI.updateDish).mockResolvedValue({
      data: { success: true, data: { ...mockDish, name: 'Updated Dish' } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as unknown
    } as AxiosResponse)

    render(
      <DishDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        restaurantId={mockRestaurantId}
        dish={mockDish}
        onDishSaved={mockOnDishSaved}
      />
    )

    // Update dish name
    const nameInput = screen.getByLabelText(/Name \*/)
    fireEvent.change(nameInput, { target: { value: 'Updated Dish' } })

    // Save changes
    const updateButton = screen.getByRole('button', { name: /Update/i })
    fireEvent.click(updateButton)

    await waitFor(() => {
      expect(restaurantsAPI.updateDish).toHaveBeenCalledWith(
        mockRestaurantId,
        mockDish._id,
        expect.any(FormData)
      )
      expect(mockOnOpenChange).toHaveBeenCalledWith(false) // Dialog should close
      expect(mockOnDishSaved).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('Dish updated successfully')
    })
  })

  it('handles dish deletion successfully', async () => {
    // Mock successful dish deletion
    vi.mocked(restaurantsAPI.deleteDish).mockResolvedValue({
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as unknown
    } as AxiosResponse)

    render(
      <DishDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        restaurantId={mockRestaurantId}
        dish={mockDish}
        onDishSaved={mockOnDishSaved}
        onDishDeleted={mockOnDishDeleted}
      />
    )

    // Find the first button without text (Trash icon button)
    const trashButton = screen.getAllByRole('button', { name: '' })[0];
    // Locate Trash button by className or order (usually first or second)
    fireEvent.click(trashButton)

    // Confirm deletion in the alert dialog
    const confirmDeleteButton = screen.getByRole('button', { name: /Delete$/i }) // The one without "..."
    fireEvent.click(confirmDeleteButton)

    await waitFor(() => {
      expect(restaurantsAPI.deleteDish).toHaveBeenCalledWith(mockRestaurantId, mockDish._id)
      expect(mockOnOpenChange).toHaveBeenCalledWith(false) // Main dialog should close
      expect(mockOnDishDeleted).toHaveBeenCalledWith(mockDish._id)
      expect(toast.success).toHaveBeenCalledWith('Dish deleted successfully')
    })
  })

  it('validates required fields before submission', async () => {
    render(
      <DishDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        restaurantId={mockRestaurantId}
        onDishSaved={mockOnDishSaved}
      />
    )

    // Try to save without filling required fields
    const createButton = screen.getByRole('button', { name: /Create/i })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please fill all required fields')
      expect(restaurantsAPI.createDish).not.toHaveBeenCalled()
    })
  })

  it('handles toggles for dietary preferences correctly', async () => {
    render(
      <DishDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        restaurantId={mockRestaurantId}
        dish={mockDish} // Using mock dish that has isVegetarian=true
        onDishSaved={mockOnDishSaved}
      />
    )

    // Wait for form to be populated
    await waitFor(() => {
      // The Vegetarian switch should be checked based on mock data
      const vegetarianSwitch = screen.getByLabelText('Vegetarian')
      expect(vegetarianSwitch).toBeChecked()
      
      // The Vegan switch should not be checked based on mock data
      const veganSwitch = screen.getByLabelText('Vegan')
      expect(veganSwitch).not.toBeChecked()
    })
    
    // Toggle the Vegan switch
    const veganSwitch = screen.getByLabelText('Vegan')
    fireEvent.click(veganSwitch)
    
    // Verify it was toggled
    await waitFor(() => {
      expect(veganSwitch).toBeChecked()
    })
  })
})
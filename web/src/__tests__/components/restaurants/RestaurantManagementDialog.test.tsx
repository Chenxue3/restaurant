import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { RestaurantManagementDialog } from '@/components/restaurants/RestaurantManagementDialog'
import restaurantsAPI from '@/services/restaurants'
import { AxiosResponse } from 'axios'

interface Restaurant {
  _id: string
  name: string
  description: string
  address: string
  logoImage: string
  images: string[]
  cuisineType: string[]
  priceRange: string
  rating: number
  hasStudentDiscount: boolean
  openingHours: {
    [key: string]: Array<{ start: string; end: string }>
  }
}

// Mock the API
vi.mock('@/services/restaurants')

describe('RestaurantManagementDialog', () => {
  const mockRestaurant: Restaurant = {
    _id: '123',
    name: 'Test Restaurant',
    description: 'Test Description',
    address: '123 Test St',
    logoImage: '/images/test-logo.jpg',
    images: ['/images/test-image1.jpg', '/images/test-image2.jpg'],
    cuisineType: ['Italian', 'Pizza'],
    priceRange: '$$',
    rating: 4.5,
    hasStudentDiscount: true,
    openingHours: {
      monday: [{ start: '9:00am', end: '5:00pm' }],
      tuesday: [{ start: '9:00am', end: '5:00pm' }]
    }
  }

  const mockOnUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders restaurant information correctly', async () => {
    render(<RestaurantManagementDialog restaurant={mockRestaurant} />)
    const editButton = screen.getByRole('button', { name: /edit/i })
    await userEvent.click(editButton)
    
    expect(screen.getByDisplayValue('Test Restaurant')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument()
    expect(screen.getByDisplayValue('123 Test St')).toBeInTheDocument()
  })

  it('opens dialog when edit button is clicked', async () => {
    render(<RestaurantManagementDialog restaurant={mockRestaurant} />)
    const editButton = screen.getByRole('button', { name: /edit/i })
    await userEvent.click(editButton)
    expect(screen.getByText('Edit Restaurant')).toBeInTheDocument()
  })

  it('updates restaurant information successfully', async () => {
    vi.mocked(restaurantsAPI.updateRestaurant).mockResolvedValue({
      data: {
        success: true,
        message: 'Restaurant updated successfully'
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as unknown
    } as AxiosResponse)

    render(<RestaurantManagementDialog restaurant={mockRestaurant} onUpdate={mockOnUpdate} />)
    
    // Open dialog
    const editButton = screen.getByRole('button', { name: /edit/i })
    await userEvent.click(editButton)

    // Update name
    const nameInput = screen.getByLabelText(/name/i)
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Updated Restaurant')

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save/i })
    await userEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled()
    })
  })

  it('validates form fields', async () => {
    render(<RestaurantManagementDialog restaurant={mockRestaurant} />)
    
    // Open dialog
    const editButton = screen.getByRole('button', { name: /edit/i })
    await userEvent.click(editButton)

    // Clear required fields
    const nameInput = screen.getByLabelText(/name/i)
    await userEvent.clear(nameInput)

    // Try to save
    const saveButton = screen.getByRole('button', { name: /save/i })
    await userEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/restaurant name is required/i)).toBeInTheDocument()
    })
  })

  it('shows discard changes alert when closing with unsaved changes', async () => {
    render(<RestaurantManagementDialog restaurant={mockRestaurant} />)
    
    // Open dialog
    const editButton = screen.getByRole('button', { name: /edit/i })
    await userEvent.click(editButton)

    // Make changes
    const nameInput = screen.getByLabelText(/name/i)
    await userEvent.type(nameInput, 'New Name')

    // Try to close
    const closeButton = screen.getByRole('button', { name: /close/i })
    await userEvent.click(closeButton)

    await waitFor(() => {
      expect(screen.getByText(/discard changes/i)).toBeInTheDocument()
    })
  })
}) 
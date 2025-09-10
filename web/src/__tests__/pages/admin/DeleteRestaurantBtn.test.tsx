import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DeleteRestaurantBtn from '@/app/admin/restaurants/[id]/components/DeleteRestaurantBtn'
import restaurantsAPI from '../../../services/restaurants'
import { toast } from 'sonner'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock restaurantsAPI
vi.mock('@/services/restaurants', () => ({
  __esModule: true,
  default: {
    deleteRestaurant: vi.fn()
  }
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('DeleteRestaurantBtn', () => {
  const mockRestaurant = {
    _id: '123',
    name: 'Test Restaurant'
  }

  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders delete button with correct text', () => {
    render(<DeleteRestaurantBtn restaurant={mockRestaurant} />)

    expect(screen.getByText('Delete Restaurant')).toBeInTheDocument()
  })

  it('opens confirmation dialog when delete button is clicked', () => {
    render(<DeleteRestaurantBtn restaurant={mockRestaurant} />)

    fireEvent.click(screen.getByText('Delete Restaurant'))

    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('calls onDelete callback when deletion is successful', async () => {
    const mockDeleteRestaurant = vi.fn().mockResolvedValue({ data: { success: true } })
    vi.mocked(restaurantsAPI.deleteRestaurant).mockImplementation(mockDeleteRestaurant)

    render(<DeleteRestaurantBtn restaurant={mockRestaurant} onDelete={mockOnDelete} />)

    // Open dialog
    fireEvent.click(screen.getByText('Delete Restaurant'))

    // Click delete button
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(mockDeleteRestaurant).toHaveBeenCalledWith(mockRestaurant._id)
      expect(mockOnDelete).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith(`Restaurant "${mockRestaurant.name}" has been deleted`)
    })
  })

  it('shows error toast when deletion fails', async () => {
    const mockDeleteRestaurant = vi.fn().mockRejectedValue(new Error('Delete failed'))
    vi.mocked(restaurantsAPI.deleteRestaurant).mockImplementation(mockDeleteRestaurant)

    render(<DeleteRestaurantBtn restaurant={mockRestaurant} />)

    // Open dialog
    fireEvent.click(screen.getByText('Delete Restaurant'))

    // Click delete button
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('An error occurred while deleting the restaurant')
    })
  })

  it('redirects to restaurant admin page when no callback provided', async () => {
    const mockDeleteRestaurant = vi.fn().mockResolvedValue({ data: { success: true } })
    vi.mocked(restaurantsAPI.deleteRestaurant).mockImplementation(mockDeleteRestaurant)

    render(<DeleteRestaurantBtn restaurant={mockRestaurant} />)

    // Open dialog
    fireEvent.click(screen.getByText('Delete Restaurant'))

    // Click delete button
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/restaurants')
    })
  })
}) 
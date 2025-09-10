import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import RestaurantAdminPage from '@/app/admin/restaurants/page'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import restaurantsAPI from '@/services/restaurants'
import { AxiosResponse, AxiosHeaders } from 'axios'

vi.mock('@/hooks/useAuth')
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))
vi.mock('@/services/restaurants', () => ({
  restaurantsAPI: {
    getRestaurants: vi.fn(),
    deleteRestaurant: vi.fn()
  }
}))

interface Restaurant {
  _id: string
  name: string
  description: string
  images: string[]
  address: string
  rating: number
  userRatingsTotal: number
  openingHours?: string[]
}

describe('RestaurantAdminPage Component', () => {
  const mockRestaurants: Restaurant[] = [
    {
      _id: '1',
      name: 'Restaurant 1',
      description: 'Description 1',
      images: ['image1.jpg'],
      address: 'Address 1',
      rating: 4.5,
      userRatingsTotal: 100
    },
    {
      _id: '2',
      name: 'Restaurant 2',
      description: 'Description 2',
      images: ['image2.jpg'],
      address: 'Address 2',
      rating: 4.0,
      userRatingsTotal: 50
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn()
    })
    vi.mocked(restaurantsAPI.getRestaurants).mockResolvedValue({
      data: mockRestaurants,
      success: true,
      message: '',
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config: {
        headers: new AxiosHeaders()
      }
    } as AxiosResponse)
  })

  it('redirects to login when not authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      sendVerificationCode: vi.fn(),
      updateUserProfile: vi.fn(),
      quickLogin: vi.fn()
    })

    render(<RestaurantAdminPage />)

    await waitFor(() => {
      expect(useRouter().push).toHaveBeenCalledWith('/login')
    })
  })

  it('shows empty state when no restaurants', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      sendVerificationCode: vi.fn(),
      updateUserProfile: vi.fn(),
      quickLogin: vi.fn()
    })
    vi.mocked(restaurantsAPI.getRestaurants).mockResolvedValueOnce({
      data: [],
      success: true,
      message: '',
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config: {
        headers: new AxiosHeaders()
      }
    } as AxiosResponse)

    render(<RestaurantAdminPage />)

    await waitFor(() => {
      expect(screen.getByText("You don't have any restaurants yet")).toBeInTheDocument()
      expect(screen.getByText('Create Your First Restaurant')).toBeInTheDocument()
    })
  })

  it('renders restaurant list', async () => {
    render(<RestaurantAdminPage />)

    await waitFor(() => {
      expect(screen.getByText('Restaurant 1')).toBeInTheDocument()
      expect(screen.getByText('Restaurant 2')).toBeInTheDocument()
    })
  })

  it('handles restaurant deletion', async () => {
    render(<RestaurantAdminPage />)

    await waitFor(() => {
      expect(screen.getByText('Restaurant 1')).toBeInTheDocument()
    })

    const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0]
    await userEvent.click(deleteButton)

    await waitFor(() => {
      expect(restaurantsAPI.deleteRestaurant).toHaveBeenCalledWith('1')
    })
  })
}) 
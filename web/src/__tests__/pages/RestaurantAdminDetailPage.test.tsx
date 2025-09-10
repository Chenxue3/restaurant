import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import RestaurantAdminDetailPage from '@/app/admin/restaurants/[id]/page'
import { useParams, useRouter } from 'next/navigation'
import restaurantsAPI from '@/services/restaurants'
import { AxiosResponse, AxiosHeaders } from 'axios'

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

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn()
}))

describe('RestaurantAdminDetailPage', () => {
  const mockRestaurant: Restaurant = {
    _id: '123',
    name: 'Test Restaurant',
    description: 'Test Description',
    images: ['test.jpg'],
    address: '123 Test St',
    rating: 4.5,
    userRatingsTotal: 100
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders restaurant details', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '123' })
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn()
    })
    vi.mocked(restaurantsAPI.getRestaurant).mockResolvedValue({
      data: mockRestaurant,
      success: true,
      message: '',
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config: {
        headers: new AxiosHeaders()
      }
    } as AxiosResponse)

    render(<RestaurantAdminDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument()
      expect(screen.getByText('Test Description')).toBeInTheDocument()
    })
  })

  it('renders navigation tabs', async () => {
    render(<RestaurantAdminDetailPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Restaurant Info')).toBeInTheDocument()
      expect(screen.getByText('Menu')).toBeInTheDocument()
      expect(screen.getByText('QR Code')).toBeInTheDocument()
    })
  })

  it('shows error message when API fails', async () => {
    vi.mocked(restaurantsAPI.getRestaurant).mockRejectedValueOnce(new Error('API Error'))
    
    render(<RestaurantAdminDetailPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('An error occurred while fetching restaurant')).toBeInTheDocument()
    })
  })
}) 
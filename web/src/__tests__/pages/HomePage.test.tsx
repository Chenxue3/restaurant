import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { vi } from 'vitest'
import Home from '@/app/page'
import restaurantsAPI from '@/services/restaurants'
import { useAuth } from '@/hooks/useAuth'

vi.mock('@/services/restaurants')
vi.mock('@/hooks/useAuth')
vi.mock('next/image', () => ({
  __esModule: true,
  default: () => <></>
}))
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (param: string) => {
      const params: Record<string, string> = {
        search: '',
        cuisine: '',
        price: '',
        sort: ''
      }
      return params[param]
    }
  })
}))

interface Restaurant {
  _id: string
  name: string
  description: string
  address: string
  images: string[]
  cuisineType: string[]
  priceRange: string
  rating: number
  hasStudentDiscount: boolean
}

interface ApiResponse<T> {
  data: T
  success: boolean
  message: string
  status: number
  statusText: string
  headers: Record<string, string>
  config: Record<string, unknown>
}

describe('Home Component', () => {
  const mockRestaurants: Restaurant[] = [
    {
      _id: '1',
      name: 'Test Restaurant 1',
      description: 'Test description 1',
      address: 'Test address 1',
      images: ['/test-image1.jpg'],
      cuisineType: ['Italian'],
      priceRange: '$$',
      rating: 4.5,
      hasStudentDiscount: true
    },
    {
      _id: '2',
      name: 'Test Restaurant 2',
      description: 'Test description 2',
      address: 'Test address 2',
      images: ['/test-image2.jpg'],
      cuisineType: ['Chinese'],
      priceRange: '$$$',
      rating: 4.0,
      hasStudentDiscount: false
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isLoading: false
    })
    ;(restaurantsAPI.getRestaurants as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: mockRestaurants,
      success: true,
      message: '',
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {}
    } as ApiResponse<Restaurant[]>)
  })

  it('renders loading state initially', () => {
    render(<Home />)
    expect(screen.getAllByTestId('skeleton')).toHaveLength(12)
  })

  it('renders restaurants when data is loaded', async () => {
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Restaurant 1')).toBeInTheDocument()
      expect(screen.getByText('Test Restaurant 2')).toBeInTheDocument()
    })
  })

  it('renders error state when API call fails', async () => {
    ;(restaurantsAPI.getRestaurants as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('API Error'))

    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText('An error occurred while fetching restaurants')).toBeInTheDocument()
    })
  })

  it('renders empty state when no restaurants', async () => {
    ;(restaurantsAPI.getRestaurants as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: [],
      success: true,
      message: '',
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {}
    } as ApiResponse<Restaurant[]>)

    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText('No restaurants found')).toBeInTheDocument()
    })
  })

  it('shows chatbot for authenticated users', async () => {
    ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true
    })
    
    await act(async () => {
      render(<Home />)
    })
    
    expect(screen.getByTestId('chat-toggle-button')).toBeInTheDocument()
  })

  it('shows login prompt for unauthenticated users', async () => {
    ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false
    })
    
    await act(async () => {
      render(<Home />)
    })
    
    expect(screen.getByText('Please log in to access the chatbot feature.')).toBeInTheDocument()
  })
})
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import RestaurantDetail from '@/app/restaurants/[id]/page'
import { useParams } from 'next/navigation'
import restaurantsAPI from '@/services/restaurants'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn()
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: () => <></>
}))

interface Restaurant {
  _id: string
  name: string
  description: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  contactInfo: {
    phone: string
    email: string
    website: string
  }
  cuisineType: string[]
  priceRange: string
  openingHours: Array<{
    day: string
    open: string
    close: string
    isClosed: boolean
  }>
  images: string[]
  logoImage: string
  rating: number
  hasStudentDiscount: boolean
  menuLanguage: string
}

interface DishByCategory {
  [key: string]: {
    categoryInfo: {
      _id: string
      name: string
      description: string
      displayOrder: number
    }
    dishItems: Array<{
      _id: string
      name: string
      description: string
      price: number
      image: string
      category: string
      isAvailable: boolean
    }>
  }
}

interface ApiResponse<T> {
  data: {
    success: boolean
    data: T
  }
  status: number
  statusText: string
  headers: Record<string, string>
  config: Record<string, unknown>
}

describe('RestaurantDetail Component', () => {
  const mockRestaurant: Restaurant = {
    _id: '123',
    name: 'Test Restaurant',
    description: 'A test restaurant',
    address: {
      street: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      country: 'Test Country'
    },
    contactInfo: {
      phone: '123-456-7890',
      email: 'test@example.com',
      website: 'https://test.com'
    },
    cuisineType: ['Italian', 'Pizza'],
    priceRange: '$$',
    openingHours: [
      {
        day: 'Monday',
        open: '09:00',
        close: '22:00',
        isClosed: false
      }
    ],
    images: ['/test-image.jpg'],
    logoImage: '/test-logo.jpg',
    rating: 4.5,
    hasStudentDiscount: true,
    menuLanguage: 'en'
  }

  const mockDishByCategory: DishByCategory = {
    'category1': {
      categoryInfo: {
        _id: 'cat1',
        name: 'Appetizers',
        description: 'Start your meal',
        displayOrder: 1
      },
      dishItems: [
        {
          _id: 'dish1',
          name: 'Test Dish',
          description: 'A test dish',
          price: 9.99,
          image: '/test-dish.jpg',
          category: 'cat1',
          isAvailable: true
        }
      ]
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ id: '123' })
  })

  it('renders loading state initially', () => {
    render(<RestaurantDetail />)
    expect(screen.getAllByTestId('skeleton')).toHaveLength(15)
  })

  it('renders error state when API call fails', async () => {
    ;(restaurantsAPI.getRestaurant as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('API Error'))
    
    render(<RestaurantDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('An error occurred while fetching restaurant data')).toBeInTheDocument()
    })
  })

  it('renders restaurant details when data is loaded', async () => {
    ;(restaurantsAPI.getRestaurant as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          restaurant: mockRestaurant,
          dishByCategory: mockDishByCategory
        }
      }
    } as ApiResponse<{ restaurant: Restaurant; dishByCategory: DishByCategory }>)
    
    render(<RestaurantDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument()
      expect(screen.getByText('Italian, Pizza')).toBeInTheDocument()
      expect(screen.getByText('$$')).toBeInTheDocument()
      expect(screen.getByText('4.5')).toBeInTheDocument()
    })
  })

  it('renders tabs with correct content', async () => {
    ;(restaurantsAPI.getRestaurant as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          restaurant: mockRestaurant,
          dishByCategory: mockDishByCategory
        }
      }
    } as ApiResponse<{ restaurant: Restaurant; dishByCategory: DishByCategory }>)
    
    render(<RestaurantDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('Menu')).toBeInTheDocument()
      expect(screen.getByText('Information')).toBeInTheDocument()
      expect(screen.getByText('Photos')).toBeInTheDocument()
    })
  })

  it('displays restaurant images correctly', async () => {
    ;(restaurantsAPI.getRestaurant as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          restaurant: mockRestaurant,
          dishByCategory: mockDishByCategory
        }
      }
    } as ApiResponse<{ restaurant: Restaurant; dishByCategory: DishByCategory }>)
    
    render(<RestaurantDetail />)
    
    await waitFor(() => {
      const images = screen.getAllByRole('img')
      expect(images[0]).toHaveAttribute('src', '/test-image.jpg')
      expect(images[1]).toHaveAttribute('src', '/test-logo.jpg')
    })
  })
}) 
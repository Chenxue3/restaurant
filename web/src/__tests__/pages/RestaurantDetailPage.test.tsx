import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { vi } from 'vitest'
import RestaurantDetailPage from '@/app/restaurants/[id]/page'
import restaurantsAPI from '@/services/restaurants'
import { AxiosResponse, AxiosHeaders } from 'axios'

vi.mock('@/services/restaurants')
vi.mock('next/image', () => ({
  __esModule: true,
  default: () => <></>
}))
vi.mock('next/navigation', () => ({
  useParams: vi.fn()
}))

const mockRestaurant = {
  _id: 'test-restaurant-id',
  name: 'Test Restaurant',
  description: 'Test description',
  address: 'Test Address',
  contactInfo: {
    phone: '123-456-7890',
    email: 'test@test.com',
    website: 'https://test.com'
  },
  cuisineType: ['Italian', 'Chinese'],
  priceRange: '$$',
  openingHours: {
    monday: [{ start: '09:00', end: '17:00' }],
    tuesday: [{ start: '09:00', end: '17:00' }],
    wednesday: [{ start: '09:00', end: '17:00' }],
    thursday: [{ start: '09:00', end: '17:00' }],
    friday: [{ start: '09:00', end: '17:00' }],
    saturday: [],
    sunday: []
  },
  images: ['/test-image1.jpg'],
  logoImage: '/test-logo.jpg',
  rating: 4.5,
  hasStudentDiscount: true,
  menuLanguage: 'en'
}

const mockDishByCategory = {
  'category1': {
    categoryInfo: {
      _id: 'category1',
      name: 'Appetizers',
      description: 'Start your meal',
      displayOrder: 1
    },
    dishItems: [
      {
        _id: 'dish1',
        name: 'Test Dish 1',
        description: 'A test dish',
        price: 9.99,
        image: '/test-dish1.jpg',
        category: 'category1',
        isAvailable: true,
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        allergens: ['nuts'],
        calories: 500,
        preparationTime: 15
      }
    ]
  }
}

describe('RestaurantDetail Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(restaurantsAPI.getRestaurant).mockResolvedValue({
      data: {
        success: true,
        data: {
          restaurant: mockRestaurant,
          dishByCategory: mockDishByCategory
        }
      },
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config: {
        headers: new AxiosHeaders()
      }
    } as AxiosResponse)
  })

  it('renders error state when API call fails', async () => {
    vi.mocked(restaurantsAPI.getRestaurant).mockRejectedValueOnce(new Error('API Error'))
    
    await act(async () => {
      render(<RestaurantDetailPage />)
    })
    
    await waitFor(() => {
      expect(screen.getByText('An error occurred while fetching restaurant data')).toBeInTheDocument()
    })
  })

  it('renders restaurant details when data is loaded', async () => {
    await act(async () => {
      render(<RestaurantDetailPage />)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument()
      expect(screen.getByText('Italian, Chinese')).toBeInTheDocument()
      expect(screen.getByText('$$')).toBeInTheDocument()
      expect(screen.getByText('4.5')).toBeInTheDocument()
    })
  })

  it('displays restaurant images correctly', async () => {
    await act(async () => {
      render(<RestaurantDetailPage />)
    })
    
    await waitFor(() => {
      const images = screen.getAllByRole('img')
      expect(images[0]).toHaveAttribute('src', '/test-image1.jpg')
      expect(images[1]).toHaveAttribute('src', '/test-logo.jpg')
    })
  })

  it('displays menu items correctly', async () => {
    await act(async () => {
      render(<RestaurantDetailPage />)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Appetizers')).toBeInTheDocument()
      expect(screen.getByText('Test Dish 1')).toBeInTheDocument()
      expect(screen.getByText('A test dish')).toBeInTheDocument()
      expect(screen.getByText('$9.99')).toBeInTheDocument()
    })
  })

  it('displays restaurant information correctly', async () => {
    await act(async () => {
      render(<RestaurantDetailPage />)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Information')).toBeInTheDocument()
      expect(screen.getByText('Menu')).toBeInTheDocument()
      expect(screen.getByText('Photos')).toBeInTheDocument()
    })
  })
}) 
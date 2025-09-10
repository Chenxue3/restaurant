import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import RestaurantCard from '@/app/components/RestaurantCard'

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: () => <></>
}))

// Mock next/link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
}))

interface RestaurantAddress {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface OpeningHour {
  day: string
  open: string
  close: string
  isClosed: boolean
}

interface Restaurant {
  _id: string
  name: string
  description: string
  address: RestaurantAddress | string
  images: string[]
  priceRange: string
  rating: number
  hasStudentDiscount: boolean
  cuisineType: string[]
  openingHours: OpeningHour[]
}

const mockRestaurant: Restaurant = {
  _id: '1',
  name: 'Test Restaurant',
  description: 'A test restaurant description',
  address: {
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'Test Country'
  },
  images: ['/test-image.jpg'],
  priceRange: '$$',
  rating: 4.5,
  hasStudentDiscount: true,
  cuisineType: ['Italian', 'Mediterranean', 'Pizza', 'Pasta'],
  openingHours: [
    {
      day: 'monday',
      open: '9:00 AM',
      close: '10:00 PM',
      isClosed: false
    }
  ]
}

describe('RestaurantCard Component', () => {
  beforeEach(() => {
    // Mock Date to return a specific time
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders restaurant basic information correctly', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />)
    
    expect(screen.getByText(mockRestaurant.name)).toBeInTheDocument()
    expect(screen.getByText(mockRestaurant.description)).toBeInTheDocument()
    expect(screen.getByText('123 Test St, Test City, TS, 12345, Test Country')).toBeInTheDocument()
    expect(screen.getByText(mockRestaurant.priceRange)).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
  })

  it('displays student discount badge when available', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />)
    expect(screen.getByText('Student Discount')).toBeInTheDocument()
  })

  it('displays cuisine types with limit of 3', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />)
    
    expect(screen.getByText('Italian')).toBeInTheDocument()
    expect(screen.getByText('Mediterranean')).toBeInTheDocument()
    expect(screen.getByText('Pizza')).toBeInTheDocument()
    expect(screen.getByText('+1 more')).toBeInTheDocument()
  })

  it('handles string address format', () => {
    const restaurantWithStringAddress: Restaurant = {
      ...mockRestaurant,
      address: '123 Test St, Test City'
    }
    
    render(<RestaurantCard restaurant={restaurantWithStringAddress} />)
    expect(screen.getByText('123 Test St, Test City')).toBeInTheDocument()
  })

  it('shows open status correctly', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />)
    expect(screen.getByText('Open Now')).toBeInTheDocument()
  })

  it('shows closed status when restaurant is closed', () => {
    const closedRestaurant: Restaurant = {
      ...mockRestaurant,
      openingHours: [
        {
          day: 'monday',
          open: '9:00 AM',
          close: '10:00 PM',
          isClosed: true
        }
      ]
    }
    
    render(<RestaurantCard restaurant={closedRestaurant} />)
    expect(screen.getByText('Closed')).toBeInTheDocument()
  })

  it('applies correct rating color based on rating value', () => {
    const highRatingRestaurant: Restaurant = { ...mockRestaurant, rating: 4.5 }
    const mediumRatingRestaurant: Restaurant = { ...mockRestaurant, rating: 3.5 }
    const lowRatingRestaurant: Restaurant = { ...mockRestaurant, rating: 3.0 }

    const { rerender } = render(<RestaurantCard restaurant={highRatingRestaurant} />)
    expect(screen.getByText('4.5').closest('div')).toHaveClass('bg-green-500')

    rerender(<RestaurantCard restaurant={mediumRatingRestaurant} />)
    expect(screen.getByText('3.5').closest('div')).toHaveClass('bg-yellow-400')

    rerender(<RestaurantCard restaurant={lowRatingRestaurant} />)
    expect(screen.getByText('3.0').closest('div')).toHaveClass('bg-yellow-300')
  })
}) 
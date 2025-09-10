import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import RestaurantInfo from '@/app/admin/restaurants/[id]/components/RestaurantInfo'

// Mock next/image
vi.mock('next/image', () => ({
  default: () => <></>
}))

// Mock RestaurantManagementDialog
vi.mock('@/components/restaurants/RestaurantManagementDialog', () => ({
  RestaurantManagementDialog: () => <div data-testid="restaurant-management-dialog" />
}))

// Mock DeleteRestaurantBtn
vi.mock('@/app/admin/restaurants/[id]/components/DeleteRestaurantBtn', () => ({
  default: () => <button data-testid="delete-restaurant-btn">Delete</button>
}))

describe('RestaurantInfo', () => {
  const mockRestaurant = {
    _id: '123',
    name: 'Test Restaurant',
    description: 'A test restaurant',
    address: '123 Test St',
    logoImage: 'test-logo.jpg',
    images: ['test-image.jpg'],
    cuisineType: ['Italian', 'Pizza'],
    priceRange: '$$',
    rating: 4.5,
    hasStudentDiscount: true,
    openingHours: {
      monday: [{ start: '09:00', end: '22:00' }],
      tuesday: [{ start: '09:00', end: '22:00' }],
      wednesday: [{ start: '09:00', end: '22:00' }],
      thursday: [{ start: '09:00', end: '22:00' }],
      friday: [{ start: '09:00', end: '23:00' }],
      saturday: [{ start: '10:00', end: '23:00' }],
      sunday: [{ start: '10:00', end: '22:00' }]
    }
  }

  const mockOnUpdate = vi.fn()

  it('renders restaurant information correctly', () => {
    render(<RestaurantInfo restaurant={mockRestaurant} onUpdate={mockOnUpdate} />)

    // Check if basic information is rendered
    expect(screen.getByText('Restaurant Information')).toBeInTheDocument()
    expect(screen.getByText('View and manage your restaurant details')).toBeInTheDocument()
    expect(screen.getByText('Test Restaurant')).toBeInTheDocument()
    expect(screen.getByText('Italian, Pizza')).toBeInTheDocument()
    expect(screen.getByText('$$')).toBeInTheDocument()
  })

  it('renders restaurant image or logo', () => {
    render(<RestaurantInfo restaurant={mockRestaurant} onUpdate={mockOnUpdate} />)
    
    const image = screen.getByAltText('Test Restaurant')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'test-image.jpg')
  })

  it('renders restaurant details in input fields', () => {
    render(<RestaurantInfo restaurant={mockRestaurant} onUpdate={mockOnUpdate} />)

    expect(screen.getByDisplayValue('Test Restaurant')).toBeInTheDocument()
    expect(screen.getByDisplayValue('A test restaurant')).toBeInTheDocument()
    expect(screen.getByDisplayValue('123 Test St')).toBeInTheDocument()
    expect(screen.getByDisplayValue('4.5')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Yes')).toBeInTheDocument()
  })

  

  it('renders restaurant ID and delete button', () => {
    render(<RestaurantInfo restaurant={mockRestaurant} onUpdate={mockOnUpdate} />)

    expect(screen.getByText('Restaurant ID: 123')).toBeInTheDocument()
    expect(screen.getByTestId('delete-restaurant-btn')).toBeInTheDocument()
  })

  it('renders management dialog', () => {
    render(<RestaurantInfo restaurant={mockRestaurant} onUpdate={mockOnUpdate} />)

    expect(screen.getByTestId('restaurant-management-dialog')).toBeInTheDocument()
  })
}) 
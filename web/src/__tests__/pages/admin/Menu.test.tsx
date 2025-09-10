import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Menu from '@/app/admin/restaurants/[id]/components/Menu'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock data
const mockDishes = [
  {
    _id: '1',
    name: 'Test Dish 1',
    description: 'Test Description 1',
    price: 9.99,
    category: '1',
    isAvailable: true,
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    ingredients: ['ingredient1', 'ingredient2'],
    allergens: ['allergen1'],
    texture: ['crispy'],
    spicyLevel: 1,
    displayOrder: 1
  },
  {
    _id: '2',
    name: 'Test Dish 2',
    description: 'Test Description 2',
    price: 19.99,
    category: '2',
    isAvailable: false,
    isVegetarian: false,
    isVegan: true,
    isGlutenFree: true,
    ingredients: ['ingredient3', 'ingredient4'],
    allergens: ['allergen2'],
    texture: ['soft'],
    spicyLevel: 2,
    displayOrder: 2
  }
]

describe('Menu Component', () => {
  const mockRestaurantId = '123'

  it('renders menu with dishes', () => {
    render(<Menu restaurantId={mockRestaurantId} menuItems={mockDishes} />)
    
    expect(screen.getByText('Menu')).toBeInTheDocument()
    expect(screen.getByText('Manage your restaurant\'s menu items')).toBeInTheDocument()
    expect(screen.getByText('Test Dish 1')).toBeInTheDocument()
    expect(screen.getByText('Test Dish 2')).toBeInTheDocument()
  })

  it('renders empty state when no dishes', () => {
    render(<Menu restaurantId={mockRestaurantId} menuItems={[]} />)
    
    expect(screen.getByText('No menu items yet. Add menu items to reach your customers.')).toBeInTheDocument()
    expect(screen.getByText('Add Menu Items')).toBeInTheDocument()
  })

  it('shows dietary preferences badges', () => {
    render(<Menu restaurantId={mockRestaurantId} menuItems={mockDishes} />)
    
    expect(screen.getByText('Vegetarian')).toBeInTheDocument()
    expect(screen.getByText('Vegan')).toBeInTheDocument()
    expect(screen.getByText('Gluten-Free')).toBeInTheDocument()
  })

  it('shows not available badge for unavailable dishes', () => {
    render(<Menu restaurantId={mockRestaurantId} menuItems={mockDishes} />)
    
    expect(screen.getByText('Not Available')).toBeInTheDocument()
  })

  it('opens dish dialog when clicking add dish button', () => {
    render(<Menu restaurantId={mockRestaurantId} menuItems={mockDishes} />)
    
    const addButton = screen.getByText('Add Dish')
    fireEvent.click(addButton)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  

  it('opens upload menu dialog when clicking upload button', () => {
    render(<Menu restaurantId={mockRestaurantId} menuItems={mockDishes} />)
    
    const uploadButton = screen.getByText('Upload Menu')
    fireEvent.click(uploadButton)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('opens categories dialog when clicking categories button', () => {
    render(<Menu restaurantId={mockRestaurantId} menuItems={mockDishes} />)
    
    const categoriesButton = screen.getByText('Categories')
    fireEvent.click(categoriesButton)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
}) 
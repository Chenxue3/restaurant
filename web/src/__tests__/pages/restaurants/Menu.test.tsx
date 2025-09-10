import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import Menu from '@/app/restaurants/[id]/components/Menu'
import { Dish } from '@/types/dish'


const mockDish: Dish = {
  _id: '1',
  name: 'Test Dish',
  description: 'Test description',
  price: 9.99,
  images: ['test.jpg'],
  ingredients: ['ingredient1'],
  allergens: ['allergen1'],
  texture: ['texture1'],
  isVegetarian: false,
  isVegan: false,
  isGlutenFree: false,
  spicyLevel: 0,
  category: 'category1',
  isAvailable: true,
  displayOrder: 1
}

const mockDishByCategory = {
  'category1': {
    categoryInfo: {
      _id: 'cat1',
      name: 'Appetizers',
      description: 'Start your meal',
      displayOrder: 1
    },
    dishItems: [mockDish]
  }
}

vi.mock('next/image', () => ({
  __esModule: true,
  default: () => <></>
}))

describe('Menu Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('renders menu categories and items', () => {
    render(<Menu dishByCategory={mockDishByCategory} />)
    
    expect(screen.getByText('Appetizers')).toBeInTheDocument()
    expect(screen.getByText('Start your meal right')).toBeInTheDocument()
    expect(screen.getByText('Spring Rolls')).toBeInTheDocument()
    expect(screen.getByText('Chicken Wings')).toBeInTheDocument()
  })

  it('applies vegetarian filter correctly', () => {
    render(<Menu dishByCategory={mockDishByCategory} />)
    
    const vegetarianButton = screen.getByRole('button', { name: 'Vegetarian' })
    fireEvent.click(vegetarianButton)
    
    expect(screen.getByText('Spring Rolls')).toBeInTheDocument()
    expect(screen.queryByText('Chicken Wings')).not.toBeInTheDocument()
  })

  it('applies gluten free filter correctly', () => {
    render(<Menu dishByCategory={mockDishByCategory} />)
    
    const glutenFreeButton = screen.getByRole('button', { name: 'Gluten Free' })
    fireEvent.click(glutenFreeButton)
    
    expect(screen.queryByText('Spring Rolls')).not.toBeInTheDocument()
    expect(screen.getByText('Chicken Wings')).toBeInTheDocument()
  })

  it('handles language translation', async () => {
    const mockTranslationResponse = {
      success: true,
      translatedMenu: {
        'category1': {
          categoryInfo: {
            _id: 'cat1',
            name: 'Appetizers',
            description: 'Start your meal right',
            displayOrder: 1
          },
          dishItems: [
            {
              _id: 'dish1',
              name: 'Spring Rolls',
              description: 'Crispy vegetable rolls',
              price: 8.99,
              isVegetarian: true,
              isVegan: false,
              isGlutenFree: false,
              spicyLevel: 0,
              allergens: ['Peanuts'],
              images: ['/images/spring-rolls.jpg']
            }
          ]
        }
      }
    }

    ;(global.fetch as unknown as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTranslationResponse)
    })

    render(<Menu dishByCategory={mockDishByCategory} />)
    
    const languageSelect = screen.getByRole('combobox')
    fireEvent.click(languageSelect)
    
    const chineseOption = screen.getByText('Chinese')
    fireEvent.click(chineseOption)
    
    await waitFor(() => {
      expect(screen.getByText('Appetizers')).toBeInTheDocument()
      expect(screen.getByText('Spring Rolls')).toBeInTheDocument()
    })
  })

  it('shows loading state during translation', async () => {
    ;(global.fetch as unknown as jest.Mock).mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<Menu dishByCategory={mockDishByCategory} />)
    
    const languageSelect = screen.getByRole('combobox')
    fireEvent.click(languageSelect)
    
    const chineseOption = screen.getByText('Chinese')
    fireEvent.click(chineseOption)
    
    expect(screen.getByText('Loading translated menu...')).toBeInTheDocument()
  })

  it('displays dietary badges correctly', () => {
    render(<Menu dishByCategory={mockDishByCategory} />)
    
    expect(screen.getByText('Vegetarian')).toBeInTheDocument()
    expect(screen.getByText('Gluten Free')).toBeInTheDocument()
    expect(screen.getByText('Peanuts')).toBeInTheDocument()
  })

  it('shows empty state when no menu items', () => {
    render(<Menu dishByCategory={null} />)
    
    expect(screen.getByText('No menu items available for this restaurant')).toBeInTheDocument()
  })
}) 
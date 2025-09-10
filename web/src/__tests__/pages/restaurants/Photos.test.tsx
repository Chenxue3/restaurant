import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import Photos from '@/app/restaurants/[id]/components/Photos'

vi.mock('next/image', () => ({
  __esModule: true,
  default: () => <></>
}))

describe('Photos Component', () => {
  const mockImages = [
    '/images/restaurant1.jpg',
    '/images/restaurant2.jpg',
    '/images/restaurant3.jpg'
  ]
  const mockRestaurantName = 'Test Restaurant'

  it('renders the photos section title', () => {
    render(<Photos images={mockImages} restaurantName={mockRestaurantName} />)
    expect(screen.getByText('Photos')).toBeInTheDocument()
  })

  it('renders all images with correct alt text', () => {
    render(<Photos images={mockImages} restaurantName={mockRestaurantName} />)
    
    mockImages.forEach((_, index) => {
      const image = screen.getByAltText(`${mockRestaurantName} photo ${index + 1}`)
      expect(image).toBeInTheDocument()
    })
  })

  it('renders images in a grid layout', () => {
    const { container } = render(<Photos images={mockImages} restaurantName={mockRestaurantName} />)
    
    const gridContainer = container.querySelector('.grid')
    expect(gridContainer).toHaveClass('grid-cols-2', 'md:grid-cols-3')
  })

  it('handles empty images array', () => {
    const { container } = render(<Photos images={[]} restaurantName={mockRestaurantName} />)
    
    expect(screen.getByText('Photos')).toBeInTheDocument()
    const images = container.querySelectorAll('img')
    expect(images).toHaveLength(0)
  })
}) 
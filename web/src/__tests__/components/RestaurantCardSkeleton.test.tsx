import { render, screen } from '@testing-library/react'
import RestaurantCardSkeleton from '@/app/components/RestaurantCardSkeleton'

describe('RestaurantCardSkeleton Component', () => {
  it('renders all skeleton elements', () => {
    render(<RestaurantCardSkeleton />)
    
    // Find all skeleton elements using data-testid attribute
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons).toHaveLength(11) // Update to match actual number of skeleton elements
  })

  it('renders with correct layout structure', () => {
    const { container } = render(<RestaurantCardSkeleton />)
    
    // Check main layout structure
    expect(container.querySelector('.overflow-hidden')).toBeInTheDocument()
    expect(container.querySelector('.p-4')).toBeInTheDocument()
    expect(container.querySelector('.flex.justify-between')).toBeInTheDocument()
  })

  it('renders image skeleton with correct dimensions', () => {
    render(<RestaurantCardSkeleton />)
    
    const imageSkeleton = screen.getAllByTestId('skeleton')[0]
    expect(imageSkeleton).toHaveClass('w-full', 'h-48')
  })

  it('renders cuisine type skeletons with correct styling', () => {
    render(<RestaurantCardSkeleton />)
    
    // Update index to match actual cuisine type skeleton position
    const cuisineSkeletons = screen.getAllByTestId('skeleton').slice(6, 9)
    cuisineSkeletons.forEach(skeleton => {
      expect(skeleton).toHaveClass('h-6', 'w-16', 'rounded-full')
    })
  })

  it('renders footer skeletons with correct dimensions', () => {
    render(<RestaurantCardSkeleton />)
    
    const footerSkeletons = screen.getAllByTestId('skeleton').slice(-2)
    footerSkeletons.forEach(skeleton => {
      expect(skeleton).toHaveClass('h-8', 'w-24')
    })
  })
}) 
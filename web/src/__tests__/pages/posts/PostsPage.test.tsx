import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import Posts from '@/app/posts/page'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock data
const mockPosts = {
  success: true,
  data: [
    {
      _id: '1',
      user: {
        _id: 'user1',
        name: 'Test User',
        profileImage: '/test-avatar.jpg'
      },
      content: 'Test post content',
      title: 'Test Post',
      images: ['/test-image.jpg'],
      createdAt: '2024-03-20T00:00:00.000Z',
      restaurantTags: ['Italian'],
      foodTags: ['Pizza'],
      likes: 10,
      comments: 5,
      location: 'Test Location'
    }
  ]
}

const mockRestaurants = {
  success: true,
  data: [
    {
      _id: '1',
      name: 'Test Restaurant',
      location: 'Test Location',
      cuisineType: ['Italian'],
      priceRange: '$$',
      description: 'Test description',
      images: ['/test-image.jpg'],
      logoImage: '/test-logo.jpg',
      rating: 4.5,
      hasStudentDiscount: true
    }
  ]
}

describe('PostsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/posts')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockPosts)
        })
      }
      if (url.includes('/api/restaurants')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockRestaurants)
        })
      }
      return Promise.reject(new Error('Not found'))
    })
  })

  it('renders navigation tabs', () => {
    render(<Posts />)
    expect(screen.getByText('Top Hit Post')).toBeInTheDocument()
    expect(screen.getByText('Nearest Restaurant')).toBeInTheDocument()
  })

  it('displays posts after loading', async () => {
    render(<Posts />)
    
    await waitFor(() => {
      expect(screen.getByText('Test post content')).toBeInTheDocument()
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
  })

  it('displays restaurants after loading', async () => {
    render(<Posts />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument()
      expect(screen.getByText('Test Location')).toBeInTheDocument()
    })
  })

  it('shows no posts message when no data', async () => {
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      json: () => Promise.resolve({ success: true, data: [] })
    }))
    
    render(<Posts />)
    
    await waitFor(() => {
      expect(screen.getByText('No posts found')).toBeInTheDocument()
    })
  })

  it('shows no restaurants message when no data', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/posts')) {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] })
        })
      }
      if (url.includes('/api/restaurants')) {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] })
        })
      }
      return Promise.reject(new Error('Not found'))
    })
    
    render(<Posts />)
    
    await waitFor(() => {
      expect(screen.getByText('No restaurants found')).toBeInTheDocument()
    })
  })
}) 
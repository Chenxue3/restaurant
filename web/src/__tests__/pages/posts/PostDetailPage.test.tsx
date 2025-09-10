import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import PostDetail from '@/app/posts/[id]/page'
import { useParams, useRouter } from 'next/navigation'
import postsAPI from '@/services/posts'
import { vi } from 'vitest'
import { Post } from '@/types/post'
import { AxiosHeaders } from 'axios'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn()
}))

// Mock postsAPI
vi.mock('@/services/posts', () => ({
  default: {
    getPost: vi.fn(),
    likePost: vi.fn(),
    addComment: vi.fn(),
    deleteComment: vi.fn()
  }
}))

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { _id: '1', name: 'Test User' },
    isAuthenticated: true,
    isLoading: false
  })
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: () => <></>
}))

describe('Post Detail Page', () => {
  const mockPost: Post = {
    _id: '1',
    title: 'Test Post',
    content: 'Test content',
    images: ['test.jpg'],
    createdAt: '2024-01-01',
    user: {
      _id: '1',
      name: 'Test User',
      profileImage: 'test.jpg',
      email: 'test@example.com'
    },
    restaurantTags: ['Italian'],
    foodTags: ['Pizza'],
    likes: 0,
    comments: 0,
    location: 'Test Location'
  }

  const mockComments = [
    {
      _id: '1',
      content: 'Test comment',
      user: { _id: '1', name: 'Test User' },
      createdAt: '2024-03-20T00:00:00.000Z'
    }
  ]

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Mock useParams
    vi.mocked(useParams).mockReturnValue({ id: '1' })

    // Mock useRouter
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn()
    } as unknown as ReturnType<typeof useRouter>)

    // Mock postsAPI.getPost
    vi.mocked(postsAPI.getPost).mockResolvedValue({
      data: {
        success: true,
        data: {
          post: mockPost,
          comments: mockComments
        }
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: new AxiosHeaders() }
    })
  })

  it('should render post and comments when data is loaded', async () => {
    await act(async () => {
      render(<PostDetail />)
    })

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test content')).toBeInTheDocument()
      expect(screen.getByText('Test comment')).toBeInTheDocument()
    })

    // Verify API call
    expect(postsAPI.getPost).toHaveBeenCalledWith('1')
  })

  it('should handle like post', async () => {
    // Mock likePost response
    ;(postsAPI.likePost as unknown as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        data: {
          liked: true,
          likes: 1
        }
      }
    })

    await act(async () => {
      render(<PostDetail />)
    })

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    // Click like button
    const likeButton = screen.getByRole('button', { name: /like/i })
    await act(async () => {
      fireEvent.click(likeButton)
    })

    // Verify API call
    expect(postsAPI.likePost).toHaveBeenCalledWith('1')
  })

  it('should handle delete comment', async () => {
    // Mock deleteComment response
    ;(postsAPI.deleteComment as unknown as jest.Mock).mockResolvedValue({
      data: {
        success: true
      }
    })

    // Mock window.confirm
    window.confirm = vi.fn(() => true)

    await act(async () => {
      render(<PostDetail />)
    })

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test comment')).toBeInTheDocument()
    })

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    await act(async () => {
      fireEvent.click(deleteButton)
    })

    // Verify API call
    expect(postsAPI.deleteComment).toHaveBeenCalledWith('1')
  })

  it('should render error message when API calls fail', async () => {
    // Mock failed API response
    ;(postsAPI.getPost as unknown as jest.Mock).mockRejectedValue(new Error('API Error'))

    await act(async () => {
      render(<PostDetail />)
    })

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/An error occurred while fetching post data/)).toBeInTheDocument()
    })
  })
}) 
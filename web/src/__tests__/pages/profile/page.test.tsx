import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi } from 'vitest'
import ProfilePage from '@/app/profile/page'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import postsAPI from '@/services/posts'
import { User } from '@/types/user'
import { Post } from '@/types/post'
import { AxiosResponse, AxiosHeaders } from 'axios'
import userEvent from '@testing-library/user-event'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, code: string) => Promise<boolean>
  logout: () => void
  sendVerificationCode: (email: string) => Promise<boolean>
  updateUserProfile: (name: string) => Promise<boolean>
  quickLogin: () => void
}

// Mock the useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn()
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: () => <></>
}))

describe('ProfilePage', () => {
  const mockUser: User = {
    _id: '1',
    name: 'Test User',
    email: 'test@example.com',
    profileImage: 'test.jpg'
  }

  const mockPost: Post = {
    _id: '1',
    title: 'Test Post',
    content: 'Test content',
    images: ['test.jpg'],
    createdAt: '2024-01-01',
    user: mockUser,
    restaurantTags: ['Italian'],
    foodTags: ['Pizza'],
    likes: 0,
    comments: 0,
    location: 'Test Location'
  }

  const mockAuth: AuthContextType = {
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    sendVerificationCode: vi.fn(),
    updateUserProfile: vi.fn(),
    quickLogin: vi.fn()
  }

  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn()
  }

  const mockApiResponse: AxiosResponse = {
    data: {
      success: true,
      data: [mockPost]
    },
    status: 200,
    statusText: 'OK',
    headers: new AxiosHeaders(),
    config: {
      headers: new AxiosHeaders()
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue(mockAuth)
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    vi.mocked(postsAPI.getPosts).mockResolvedValue(mockApiResponse)
  })

  it('renders user profile information', async () => {
    render(<ProfilePage />)
    
    await waitFor(() => {
      expect(screen.getByText(mockUser.name)).toBeInTheDocument()
      expect(screen.getByText(mockUser.email)).toBeInTheDocument()
    })
  })

  it('renders user posts', async () => {
    render(<ProfilePage />)
    
    await waitFor(() => {
      expect(screen.getByText(mockPost.title)).toBeInTheDocument()
      expect(screen.getByText(mockPost.content)).toBeInTheDocument()
    })
  })

  it('handles logout', async () => {
    render(<ProfilePage />)
    
    const logoutButton = screen.getByRole('button', { name: /logout/i })
    await userEvent.click(logoutButton)
    
    expect(mockAuth.logout).toHaveBeenCalled()
    expect(mockRouter.push).toHaveBeenCalledWith('/')
  })

  it('redirects to login page when user is not authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue({
      ...mockAuth,
      isAuthenticated: false,
      user: null
    })

    render(<ProfilePage />)
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login')
    })
  })

  it('shows loading state while fetching posts', async () => {
    vi.mocked(postsAPI.getPosts).mockImplementation(() => new Promise(() => {}))
    
    render(<ProfilePage />)
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })

  it('displays empty state when user has no posts', async () => {
    vi.mocked(postsAPI.getPosts).mockResolvedValue({
      data: {
        success: true,
        data: []
      },
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() }
    })

    await act(async () => {
      render(<ProfilePage />)
    })

    await waitFor(() => {
      expect(screen.getByText('You haven\'t created any posts yet')).toBeInTheDocument()
    })
  })

  it('handles profile update cancellation', async () => {
    const mockUpdateUserProfile = vi.fn()
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
      updateUserProfile: mockUpdateUserProfile
    })

    vi.mocked(postsAPI.getPosts).mockResolvedValue({
      data: {
        success: true,
        data: []
      }
    })

    await act(async () => {
      render(<ProfilePage />)
    })

    await act(async () => {
      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)
    })

    await act(async () => {
      const nameInput = screen.getByLabelText('Name')
      fireEvent.change(nameInput, { target: { value: 'New Name' } })
    })

    await act(async () => {
      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)
    })

    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument()
    expect(mockUpdateUserProfile).not.toHaveBeenCalled()
  })

  it('displays user email as read-only', async () => {
    vi.mocked(postsAPI.getPosts).mockResolvedValue({
      data: {
        success: true,
        data: []
      }
    })

    await act(async () => {
      render(<ProfilePage />)
    })

    await act(async () => {
      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)
    })

    const emailInput = screen.getByLabelText('Email')
    expect(emailInput).toBeDisabled()
    expect(screen.getByText('Email cannot be changed')).toBeInTheDocument()
  })
}) 
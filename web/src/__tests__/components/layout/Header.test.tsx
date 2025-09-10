import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import Header from '@/components/layout/Header'
import { useAuth } from '@/hooks/useAuth'

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn()
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn()
  })
}))

// Mock LoginDialog component
vi.mock('@/components/LoginDialog', () => ({
  default: ({ open }: { open: boolean }) => (
    open ? <div role="dialog">Login Dialog</div> : null
  )
}))

interface AuthState {
  user: { name: string; profileImage: string } | null
  isAuthenticated: boolean
  logout: () => void
}

describe('Header Component', () => {
  const mockUser = {
    name: 'Test User',
    profileImage: 'test-image.jpg'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders logo and brand name', () => {
    ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn()
    } as AuthState)

    render(<Header />)
    
    expect(screen.getByText('SmartSavor')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /smartsavor/i })).toHaveAttribute('href', '/')
  })

  it('shows sign in button when user is not authenticated', () => {
    ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn()
    } as AuthState)

    render(<Header />)
    
    expect(screen.getByText('Sign in')).toBeInTheDocument()
  })

  it('shows user profile and logout button when user is authenticated', () => {
    ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: vi.fn()
    } as AuthState)

    render(<Header />)
    
    expect(screen.getByText(mockUser.name)).toBeInTheDocument()
    expect(screen.getByTitle('Logout')).toBeInTheDocument()
  })

  it('shows scan menu button when user is authenticated', () => {
    ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: vi.fn()
    } as AuthState)

    render(<Header />)
    
    expect(screen.getByText('Scan Menu')).toBeInTheDocument()
  })

  it('toggles mobile menu when menu button is clicked', () => {
    ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn()
    } as AuthState)

    render(<Header />)
    
    const menuButton = screen.getByRole('button', { name: /open main menu/i })
    expect(screen.queryByText('Home')).not.toBeInTheDocument()
    
    fireEvent.click(menuButton)
    expect(screen.getByText('Home')).toBeInTheDocument()
    
    fireEvent.click(menuButton)
    expect(screen.queryByText('Home')).not.toBeInTheDocument()
  })

  it('calls logout function when logout button is clicked', () => {
    const mockLogout = vi.fn()
    ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: mockLogout
    } as AuthState)

    render(<Header />)
    
    const logoutButton = screen.getByTitle('Logout')
    fireEvent.click(logoutButton)
    
    expect(mockLogout).toHaveBeenCalled()
  })

  it('shows login dialog when sign in button is clicked', () => {
    ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn()
    } as AuthState)

    render(<Header />)
    
    const signInButton = screen.getByText('Sign in')
    fireEvent.click(signInButton)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
}) 
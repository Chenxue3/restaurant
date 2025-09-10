import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import TopBar from '@/components/layout/TopBar'
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
  default: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
    open ? (
      <div role="dialog" aria-modal="true" onClick={() => onOpenChange(false)}>
        Login Dialog
      </div>
    ) : null
  )
}))

interface AuthState {
  isAuthenticated: boolean
}

describe('TopBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders navigation links', () => {
    ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false
    } as AuthState)

    render(<TopBar />)
    
    expect(screen.getByText('For Restaurants')).toBeInTheDocument()
    expect(screen.getByText('FAQs')).toBeInTheDocument()
  })

  it('navigates to restaurant admin when clicking restaurant link while authenticated', () => {
    ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true
    } as AuthState)

    render(<TopBar />)
    
    const restaurantLink = screen.getByText('For Restaurants')
    expect(restaurantLink).toHaveAttribute('href', '/admin/restaurants')
  })

  it('navigates to FAQs page when clicking FAQs link', () => {
    ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false
    } as AuthState)

    render(<TopBar />)
    
    const faqsLink = screen.getByText('FAQs')
    expect(faqsLink).toHaveAttribute('href', '/faqs')
  })
}) 
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import AdminLayout from '@/app/admin/layout'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

vi.mock('@/hooks/useAuth')

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
}

describe('AdminLayout Component', () => {
  const mockRouter = {
    push: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockRouter)
  })

  it('shows loading state while checking authentication', () => {
    ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isLoading: true
    } as AuthState)

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('redirects to home when not authenticated', async () => {
    ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isLoading: false
    } as AuthState)

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/')
    })
  })

  it('renders children when authenticated', () => {
    ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      isLoading: false
    } as AuthState)

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })
}) 
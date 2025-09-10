import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import LoginPage from '@/app/login/page'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'


interface User {
  _id: string
  email: string
  name?: string
  profileImage?: string
}
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

// Mock the hooks and API
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn()
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn()
  })
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  },
  Toaster: () => null
}))

// Mock the Dialog components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

// Mock the AlertDialog components
vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  AlertDialogAction: ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  )
}))

// Mock the InputOTP components
vi.mock('@/components/ui/input-otp', () => ({
  InputOTP: ({ children, onChange }: { children: React.ReactNode, onChange?: (value: string) => void }) => (
    <div onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}>{children}</div>
  ),
  InputOTPGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  InputOTPSlot: () => <input type="text" maxLength={1} />
}))

describe('LoginPage', () => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form', () => {
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      sendVerificationCode: vi.fn(),
      updateUserProfile: vi.fn(),
      quickLogin: vi.fn()
    } as AuthContextType)

    render(<LoginPage />)
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('handles login submission', async () => {
    const mockLogin = vi.fn()
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      login: mockLogin,
      logout: vi.fn(),
      sendVerificationCode: vi.fn(),
      updateUserProfile: vi.fn(),
      quickLogin: vi.fn()
    } as AuthContextType)

    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await userEvent.type(emailInput, 'test@example.com')
    await userEvent.type(passwordInput, 'password123')
    await userEvent.click(submitButton)

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('redirects to home when already authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { _id: '1', email: 'test@example.com' },
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      sendVerificationCode: vi.fn(),
      updateUserProfile: vi.fn(),
      quickLogin: vi.fn()
    } as AuthContextType)

    render(<LoginPage />)

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/')
    })
  })
}) 
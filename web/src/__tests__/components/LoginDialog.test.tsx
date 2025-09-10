import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import LoginDialog from '@/components/LoginDialog'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import authAPI from '@/services/auth'

// Mock the hooks and modules
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn()
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

vi.mock('@/services/auth', () => ({
  default: {
    sendVerificationCode: vi.fn()
  }
}))

// Mock sonner with all required exports
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  },
  Toaster: () => null // Mock Toaster component
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

describe('LoginDialog Component', () => {
  const mockLogin = vi.fn()
  const mockRouter = {
    push: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({ login: mockLogin })
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  it('renders login dialog with initial state', () => {
    render(<LoginDialog open={true} onOpenChange={() => {}} />)
    
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    expect(screen.getByText('Send Verification Code')).toBeInTheDocument()
  })

  it('validates email format before sending code', async () => {
    render(<LoginDialog open={true} onOpenChange={() => {}} />)
    
    const emailInput = screen.getByPlaceholderText('Enter your email')
    const sendButton = screen.getByText('Send Verification Code')
    
    // Test invalid email
    await userEvent.type(emailInput, 'invalid-email')
    await userEvent.click(sendButton)
    
    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument()
    
    // Test valid email
    await userEvent.clear(emailInput)
    await userEvent.type(emailInput, 'test@example.com')
    await userEvent.click(sendButton)
    
    expect(authAPI.sendVerificationCode).toHaveBeenCalledWith('test@example.com')
  })

  it('shows verification code input after sending code', async () => {
    ;(authAPI.sendVerificationCode as jest.Mock).mockResolvedValueOnce({ data: { success: true } })
    
    render(<LoginDialog open={true} onOpenChange={() => {}} />)
    
    const emailInput = screen.getByPlaceholderText('Enter your email')
    const sendButton = screen.getByText('Send Verification Code')
    
    await userEvent.type(emailInput, 'test@example.com')
    await userEvent.click(sendButton)
    
    await waitFor(() => {
      expect(screen.getByText('Verify')).toBeInTheDocument()
    })
  })

  it('shows countdown timer after sending code', async () => {
    ;(authAPI.sendVerificationCode as jest.Mock).mockResolvedValueOnce({ data: { success: true } })
    
    render(<LoginDialog open={true} onOpenChange={() => {}} />)
    
    const emailInput = screen.getByPlaceholderText('Enter your email')
    const sendButton = screen.getByText('Send Verification Code')
    
    await userEvent.type(emailInput, 'test@example.com')
    await userEvent.click(sendButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Resend in \d+s/)).toBeInTheDocument()
    })
  })

  it('handles API errors when sending code', async () => {
    ;(authAPI.sendVerificationCode as jest.Mock).mockRejectedValueOnce(new Error('API Error'))
    
    render(<LoginDialog open={true} onOpenChange={() => {}} />)
    
    const emailInput = screen.getByPlaceholderText('Enter your email')
    const sendButton = screen.getByText('Send Verification Code')
    
    await userEvent.type(emailInput, 'test@example.com')
    await userEvent.click(sendButton)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to send verification code. Please try again later.')).toBeInTheDocument()
    })
  })
}) 
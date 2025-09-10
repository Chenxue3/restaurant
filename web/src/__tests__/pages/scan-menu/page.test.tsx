import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import ScanMenuPage from '@/app/scan-menu/page'
import { toast } from 'sonner'
import restaurantsAPI from '@/services/restaurants'



// Mock the toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}))

// Mock the restaurantsAPI
vi.mock('@/services/restaurants', () => ({
  default: {
    scanMenu: vi.fn()
  }
}))

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: () => <></>
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

describe('ScanMenuPage', () => {
 
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the scan menu page correctly', () => {
    render(<ScanMenuPage />)

    expect(screen.getByText('Scan & Translate Menu')).toBeInTheDocument()
    expect(screen.getByText('Expected Language')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /expected language/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upload & translate/i })).toBeInTheDocument()
  })

  it('handles file upload and analysis', async () => {
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' })
    const mockAnalysisResult = {
      restaurantName: 'Test Restaurant',
      menuType: 'Dinner',
      categories: [
        {
          name: 'Appetizers',
          items: [
            {
              name: 'Test Item',
              price: 10.99,
              description: 'Test description'
            }
          ]
        }
      ]
    }

    ;(restaurantsAPI.scanMenu as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        data: mockAnalysisResult
      }
    })

    const { container } = render(<ScanMenuPage />)

    // Upload file
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    // Select language
    const languageSelect = screen.getByRole('combobox', { name: /expected language/i })
    fireEvent.click(languageSelect)
    fireEvent.click(screen.getByText('English'))

    // Click analyze button
    const analyzeButton = screen.getByRole('button', { name: /upload & translate/i })
    fireEvent.click(analyzeButton)

    // Wait for analysis result
    await waitFor(() => {
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument()
      expect(screen.getByText('Dinner')).toBeInTheDocument()
      expect(screen.getByText('Appetizers')).toBeInTheDocument()
      expect(screen.getByText('Test Item')).toBeInTheDocument()
    })

    expect(toast.success).toHaveBeenCalledWith('Menu translation completed')
  })

  it('shows error message when analysis fails', async () => {
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' })
    ;(restaurantsAPI.scanMenu as jest.Mock).mockRejectedValue(new Error('Analysis failed'))

    const { container } = render(<ScanMenuPage />)

    // Upload file
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    // Select language
    const languageSelect = screen.getByRole('combobox', { name: /expected language/i })
    fireEvent.click(languageSelect)
    fireEvent.click(screen.getByText('English'))

    // Click analyze button
    const analyzeButton = screen.getByRole('button', { name: /upload & translate/i })
    fireEvent.click(analyzeButton)

    // Wait for error message
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Analysis failed')
    })
  })

  it('shows loading state during analysis', async () => {
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' })
    ;(restaurantsAPI.scanMenu as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )

    const { container } = render(<ScanMenuPage />)

    // Upload file
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    // Select language
    const languageSelect = screen.getByRole('combobox', { name: /expected language/i })
    fireEvent.click(languageSelect)
    fireEvent.click(screen.getByText('English'))

    // Click analyze button
    const analyzeButton = screen.getByRole('button', { name: /upload & translate/i })
    fireEvent.click(analyzeButton)

    // Check loading state
    expect(screen.getByText('Translating...')).toBeInTheDocument()
  })
}) 
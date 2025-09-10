import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import UploadMenuDialog from '@/app/admin/restaurants/[id]/components/UploadMenuDialog'
import restaurantsAPI from '../../../services/restaurants'
import { AxiosResponse, AxiosRequestConfig } from 'axios'
import { toast } from 'sonner'

// Mock restaurantsAPI
vi.mock('../../../services/restaurants', () => ({
  default: {
    analyzeMenuImage: vi.fn(),
    createDishesFromAnalysis: vi.fn(),
    getRestaurant: vi.fn()
  }
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock data
const mockRestaurant = {
  _id: '1',
  name: 'Test Restaurant',
  description: 'A test restaurant',
  address: '123 Test St',
  cuisine: 'Italian',
  priceRange: '$$',
  openingHours: {
    monday: { open: '09:00', close: '22:00' },
    tuesday: { open: '09:00', close: '22:00' },
    wednesday: { open: '09:00', close: '22:00' },
    thursday: { open: '09:00', close: '22:00' },
    friday: { open: '09:00', close: '23:00' },
    saturday: { open: '09:00', close: '23:00' },
    sunday: { open: '09:00', close: '22:00' }
  },
  images: ['test-image.jpg'],
  logo: 'test-logo.jpg',
  dishByCategory: {}
}

const mockAnalysisResult = {
  menuItems: [
    {
      name: 'Test Dish',
      description: 'A test dish',
      price: 10.99,
      category: 'Main Course'
    }
  ]
}

describe('UploadMenuDialog', () => {
  const mockRestaurantId = '123'
  const mockOnOpenChange = vi.fn()
  const mockOnMenuItemsCreated = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dialog with correct title and description', () => {
    render(
      <UploadMenuDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        restaurantId={mockRestaurantId}
        onMenuItemsCreated={mockOnMenuItemsCreated}
      />
    )

    expect(screen.getByText('Upload Menu Image')).toBeInTheDocument()
    expect(screen.getByText('Upload a menu image to automatically create menu items')).toBeInTheDocument()
  })

  it('renders language selector with correct options', () => {
    render(
      <UploadMenuDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        restaurantId={mockRestaurantId}
        onMenuItemsCreated={mockOnMenuItemsCreated}
      />
    )
    expect(screen.getByLabelText('Menu Language')).toBeInTheDocument()
    expect(screen.getByText('English')).toBeInTheDocument()
  })

  it('handles file selection', () => {
    render(
      <UploadMenuDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        restaurantId={mockRestaurantId}
        onMenuItemsCreated={mockOnMenuItemsCreated}
      />
    )
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const input = screen.getByLabelText('Menu Image') as HTMLInputElement
    Object.defineProperty(input, 'files', {
      value: [file]
    })
    fireEvent.change(input)
    expect(input.files?.[0]).toBe(file)
  })

  it('handles successful menu upload and analysis', async () => {
    const mockAnalyzeMenuImage = vi.fn().mockResolvedValue({
      data: { success: true, data: mockAnalysisResult },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as AxiosRequestConfig
    } as AxiosResponse)
    const mockCreateDishesFromAnalysis = vi.fn().mockResolvedValue({
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as AxiosRequestConfig
    } as AxiosResponse)
    const mockGetRestaurant = vi.fn().mockResolvedValue({
      data: { success: true, data: mockRestaurant },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as AxiosRequestConfig
    } as AxiosResponse)

    vi.mocked(restaurantsAPI.analyzeMenuImage).mockImplementation(mockAnalyzeMenuImage)
    vi.mocked(restaurantsAPI.createDishesFromAnalysis).mockImplementation(mockCreateDishesFromAnalysis)
    vi.mocked(restaurantsAPI.getRestaurant).mockImplementation(mockGetRestaurant)

    render(
      <UploadMenuDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        restaurantId={mockRestaurantId}
        onMenuItemsCreated={mockOnMenuItemsCreated}
      />
    )

    // Select file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByLabelText('Menu Image')
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Upload and analyze
    fireEvent.click(screen.getByText('Upload & Analyze'))

    await waitFor(() => {
      expect(mockAnalyzeMenuImage).toHaveBeenCalledWith(mockRestaurantId, expect.any(FormData))
      expect(mockCreateDishesFromAnalysis).toHaveBeenCalled()
      expect(mockGetRestaurant).toHaveBeenCalledWith(mockRestaurantId)
      expect(mockOnMenuItemsCreated).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('Menu items created successfully from the image')
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('handles analysis failure', async () => {
    const mockAnalyzeMenuImage = vi.fn().mockRejectedValue(new Error('Analysis failed'))
    vi.mocked(restaurantsAPI.analyzeMenuImage).mockImplementation(mockAnalyzeMenuImage)
    render(
      <UploadMenuDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        restaurantId={mockRestaurantId}
        onMenuItemsCreated={mockOnMenuItemsCreated}
      />
    )
    // Select file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByLabelText('Menu Image')
    fireEvent.change(fileInput, { target: { files: [file] } })
    // Upload and analyze
    fireEvent.click(screen.getByText('Upload & Analyze'))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('An error occurred while processing the menu image')
    })
  })

  it('handles creation failure', async () => {
    const mockAnalyzeMenuImage = vi.fn().mockResolvedValue({
      data: { success: true, data: mockAnalysisResult },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as AxiosRequestConfig
    } as AxiosResponse)
    const mockCreateDishesFromAnalysis = vi.fn().mockRejectedValue(new Error('Creation failed'))
    vi.mocked(restaurantsAPI.analyzeMenuImage).mockImplementation(mockAnalyzeMenuImage)
    vi.mocked(restaurantsAPI.createDishesFromAnalysis).mockImplementation(mockCreateDishesFromAnalysis)
    render(
      <UploadMenuDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        restaurantId={mockRestaurantId}
        onMenuItemsCreated={mockOnMenuItemsCreated}
      />
    )
    // Select file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByLabelText('Menu Image')
    fireEvent.change(fileInput, { target: { files: [file] } })
    // Upload and analyze
    fireEvent.click(screen.getByText('Upload & Analyze'))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('An error occurred while processing the menu image')
    })
  })

  it('shows loading state during processing', async () => {
    const mockAnalyzeMenuImage = vi.fn().mockImplementation(() => new Promise(() => {}))
    vi.mocked(restaurantsAPI.analyzeMenuImage).mockImplementation(mockAnalyzeMenuImage)

    render(
      <UploadMenuDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        restaurantId={mockRestaurantId}
        onMenuItemsCreated={mockOnMenuItemsCreated}
      />
    )

    // Select file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByLabelText('Menu Image')
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Upload and analyze
    fireEvent.click(screen.getByText('Upload & Analyze'))

    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })
}) 
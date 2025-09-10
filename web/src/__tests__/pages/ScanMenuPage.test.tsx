import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import ScanMenuPage from '@/app/scan-menu/page'
import { useRouter } from 'next/navigation'
import restaurantsAPI from '@/services/restaurants'
import { AxiosResponse, AxiosHeaders } from 'axios'

interface Restaurant {
  _id: string
  name: string
  description: string
  images: string[]
  address: string
  rating: number
  userRatingsTotal: number
  openingHours?: string[]
}

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

// Mock restaurants API
vi.mock('@/services/restaurants', () => ({
  restaurantsAPI: {
    getRestaurant: vi.fn()
  }
}))

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: () => <></>
}))

describe('ScanMenuPage', () => {
  const mockRestaurant: Restaurant = {
    _id: '123',
    name: 'Test Restaurant',
    description: 'Test Description',
    images: ['test.jpg'],
    address: '123 Test St',
    rating: 4.5,
    userRatingsTotal: 100
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders scan menu form', () => {
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn()
    })

    render(<ScanMenuPage />)
    expect(screen.getByText(/scan menu/i)).toBeInTheDocument()
  })

  it('handles restaurant selection', async () => {
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn()
    })

    vi.mocked(restaurantsAPI.getRestaurant).mockResolvedValue({
      data: mockRestaurant,
      success: true,
      message: '',
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config: {
        headers: new AxiosHeaders()
      }
    } as AxiosResponse)

    render(<ScanMenuPage />)
    const input = screen.getByPlaceholderText(/enter restaurant id/i)
    await userEvent.type(input, '123')

    const submitButton = screen.getByRole('button', { name: /scan/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(restaurantsAPI.getRestaurant).toHaveBeenCalledWith('123')
    })
  })
}) 
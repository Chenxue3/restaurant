import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import CreateRestaurantDialog from '@/components/restaurants/CreateRestaurantDialog'
import { placesAPI } from '@/services/places'
import restaurantsAPI from '@/services/restaurants'
import { AxiosResponse } from 'axios'

// Mock the APIs
vi.mock('@/services/places', () => ({
  placesAPI: {
    getAutocomplete: vi.fn(),
    getDetails: vi.fn()
  }
}))

vi.mock('@/services/restaurants', () => ({
  createRestaurant: vi.fn()
}))

interface PlaceDetails {
  formatted_address: string
  geometry: {
    location: { lat: number; lng: number }
  }
  name: string
  place_id: string
  rating: number
  user_ratings_total: number
  opening_hours?: {
    weekday_text: string[]
  }
}

describe('CreateRestaurantDialog', () => {
  const mockOnSuccess = vi.fn()
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with default button text', () => {
    render(<CreateRestaurantDialog />)
    expect(screen.getByText('Add Restaurant')).toBeInTheDocument()
  })

  it('renders with custom button text', () => {
    render(<CreateRestaurantDialog buttonText="Create New Restaurant" />)
    expect(screen.getByText('Create New Restaurant')).toBeInTheDocument()
  })

  it('shows dialog when button is clicked', async () => {
    render(<CreateRestaurantDialog />)
    const button = screen.getByText('Add Restaurant')
    await userEvent.click(button)
    expect(screen.getByText('Create New Restaurant')).toBeInTheDocument()
  })

  it('fetches and displays suggestions when typing', async () => {
    const mockSuggestions = [
      {
        place_id: '123',
        description: 'Test Restaurant',
        structured_formatting: {
          main_text: 'Test Restaurant',
          secondary_text: 'Test Address'
        }
      }
    ]

    vi.mocked(placesAPI.getAutocomplete).mockResolvedValue({
      data: mockSuggestions,
      success: true,
      message: '',
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: {}
      }
    } as unknown as AxiosResponse)

    render(<CreateRestaurantDialog />)
    const button = screen.getByText('Add Restaurant')
    await userEvent.click(button)

    const input = screen.getByPlaceholderText('Start typing restaurant name...')
    await userEvent.type(input, 'Test')

    await waitFor(() => {
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument()
      expect(screen.getByText('Test Address')).toBeInTheDocument()
    })
  })

  it('handles place selection and fetches details', async () => {
    const mockPlaceDetails: PlaceDetails = {
      formatted_address: '123 Test St',
      geometry: {
        location: { lat: 0, lng: 0 }
      },
      name: 'Test Restaurant',
      place_id: '123',
      rating: 4.5,
      user_ratings_total: 100
    }

    vi.mocked(placesAPI.getDetails).mockResolvedValue({
      data: mockPlaceDetails,
      success: true,
      message: '',
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: {}
      }
    } as unknown as AxiosResponse<PlaceDetails>)

    render(<CreateRestaurantDialog onSuccess={mockOnSuccess} />)
    const button = screen.getByText('Add Restaurant')
    await userEvent.click(button)

    const input = screen.getByPlaceholderText('Start typing restaurant name...')
    await userEvent.type(input, 'Test')

    // Simulate place selection
    vi.mocked(placesAPI.getAutocomplete).mockResolvedValue({
      data: [{
        place_id: '123',
        description: 'Test Restaurant',
        structured_formatting: {
          main_text: 'Test Restaurant',
          secondary_text: 'Test Address'
        }
      }],
      success: true,
      message: '',
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: {}
      }
    } as unknown as AxiosResponse<Array<{
      place_id: string
      description: string
      structured_formatting: {
        main_text: string
        secondary_text: string
      }
    }>>)

    await waitFor(() => {
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Test Restaurant'))

    await waitFor(() => {
      expect(screen.getByText('Address:')).toBeInTheDocument()
      expect(screen.getByText('123 Test St')).toBeInTheDocument()
    })
  })

  it('creates restaurant successfully', async () => {
    const mockPlaceDetails: PlaceDetails = {
      formatted_address: '123 Test St',
      geometry: {
        location: { lat: 0, lng: 0 }
      },
      name: 'Test Restaurant',
      place_id: '123',
      rating: 4.5,
      user_ratings_total: 100,
      opening_hours: {
        weekday_text: [
          'Monday: 9:00 AM – 5:00 PM',
          'Tuesday: 9:00 AM – 5:00 PM'
        ]
      }
    }

    vi.mocked(placesAPI.getDetails).mockResolvedValue({
      data: mockPlaceDetails,
      success: true,
      message: '',
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: {}
      }
    } as unknown as AxiosResponse<PlaceDetails>)

    vi.mocked(restaurantsAPI.createRestaurant).mockResolvedValue({
      data: {
        success: true,
        message: 'Restaurant created successfully'
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: {}
      }
    } as unknown as AxiosResponse<{ success: boolean; message: string }>)

    render(<CreateRestaurantDialog onSuccess={mockOnSuccess} onOpenChange={mockOnOpenChange} />)
    const button = screen.getByText('Add Restaurant')
    await userEvent.click(button)

    // Simulate place selection and form submission
    const input = screen.getByPlaceholderText('Start typing restaurant name...')
    await userEvent.type(input, 'Test')

    await waitFor(() => {
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Test Restaurant'))

    const submitButton = screen.getByRole('button', { name: /create/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('handles API errors gracefully', async () => {
    vi.mocked(placesAPI.getAutocomplete).mockRejectedValue(new Error('API Error'))

    render(<CreateRestaurantDialog />)
    const button = screen.getByText('Add Restaurant')
    await userEvent.click(button)

    const input = screen.getByPlaceholderText('Start typing restaurant name...')
    await userEvent.type(input, 'Test')

    await waitFor(() => {
      expect(screen.queryByText('Test Restaurant')).not.toBeInTheDocument()
    })
  })
}) 
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen,  waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Chatbot from '@/components/Chatbot'
import { API_URL } from '@/lib/constants'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock scrollIntoView
const mockScrollIntoView = vi.fn()
window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView

describe('Chatbot Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  it('renders chat button when closed', () => {
    render(<Chatbot />)
    expect(screen.getByTestId('chat-toggle-button')).toBeInTheDocument()
  })

  it('opens chat window when button is clicked', async () => {
    render(<Chatbot />)
    const button = screen.getByTestId('chat-toggle-button')
    await userEvent.click(button)
    
    expect(screen.getByText('AI Restaurant Assistant')).toBeInTheDocument()
    expect(screen.getByText('Welcome to our website!')).toBeInTheDocument()
  })

  it('shows default questions when opened', async () => {
    render(<Chatbot />)
    const button = screen.getByTestId('chat-toggle-button')
    await userEvent.click(button)
    
    expect(screen.getByText('What is the food allergy information of roasted beef?')).toBeInTheDocument()
    expect(screen.getByText('What is the best Chinese restaurant in town?')).toBeInTheDocument()
    expect(screen.getByText('What is the best meal combination for 2-person dinner within $40?')).toBeInTheDocument()
  })

  it('sends message and displays response', async () => {
    const mockResponse = { success: true, response: 'Test response' }
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    })

    render(<Chatbot />)
    const button = screen.getByTestId('chat-toggle-button')
    await userEvent.click(button)

    const input = screen.getByPlaceholderText('Ask me anything...')
    await userEvent.type(input, 'Test message')
    const sendButton = screen.getByTestId('send-button')
    await userEvent.click(sendButton)

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_URL}/api/chatbot/chat`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Test message', language: 'en' })
      })
    )

    await waitFor(() => {
      expect(screen.getByText('Test response')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'))

    render(<Chatbot />)
    const button = screen.getByTestId('chat-toggle-button')
    await userEvent.click(button)

    const input = screen.getByPlaceholderText('Ask me anything...')
    await userEvent.type(input, 'Test message')
    const sendButton = screen.getByTestId('send-button')
    await userEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument()
    })
  })

  it('formats response with links correctly', async () => {
    const mockResponse = {
      success: true,
      response: 'Check out this <a href="https://example.com">link</a>'
    }
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    })

    render(<Chatbot />)
    const button = screen.getByTestId('chat-toggle-button')
    await userEvent.click(button)

    const input = screen.getByPlaceholderText('Ask me anything...')
    await userEvent.type(input, 'Test message')
    const sendButton = screen.getByTestId('send-button')
    await userEvent.click(sendButton)

    await waitFor(() => {
      const link = screen.getByText('link')
      expect(link).toHaveAttribute('href', 'https://example.com')
    })
  })

  it('closes chat window when X button is clicked', async () => {
    render(<Chatbot />)
    const openButton = screen.getByTestId('chat-toggle-button')
    await userEvent.click(openButton)

    const closeButton = screen.getByTestId('close-button')
    await userEvent.click(closeButton)

    expect(screen.queryByText('AI Restaurant Assistant')).not.toBeInTheDocument()
  })

  it('handles default question click', async () => {
    const mockResponse = { success: true, response: 'Test response' }
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    })

    render(<Chatbot />)
    const button = screen.getByTestId('chat-toggle-button')
    await userEvent.click(button)

    const defaultQuestion = screen.getByText('What is the food allergy information of roasted beef?')
    await userEvent.click(defaultQuestion)

    await waitFor(() => {
      expect(screen.getByText('Test response')).toBeInTheDocument()
    })
  })

  it('scrolls to bottom when new message is added', async () => {
    const mockResponse = { success: true, response: 'Test response' }
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    })

    render(<Chatbot />)
    const button = screen.getByTestId('chat-toggle-button')
    await userEvent.click(button)

    const input = screen.getByPlaceholderText('Ask me anything...')
    await userEvent.type(input, 'Test message')
    const sendButton = screen.getByTestId('send-button')
    await userEvent.click(sendButton)

    await waitFor(() => {
      expect(mockScrollIntoView).toHaveBeenCalled()
    })
  })
}) 
import { render, screen } from '@testing-library/react'
import FAQsPage from '@/app/faqs/page'

describe('FAQsPage Component', () => {
  it('renders page title and description', () => {
    render(<FAQsPage />)
    
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument()
    expect(screen.getByText(/Discover how SmartSavor is revolutionizing the restaurant experience/)).toBeInTheDocument()
  })

  it('renders all tab triggers', () => {
    render(<FAQsPage />)
    
    expect(screen.getByText('Product Features')).toBeInTheDocument()
    expect(screen.getByText('For Restaurants')).toBeInTheDocument()
    expect(screen.getByText('For Users')).toBeInTheDocument()
  })

  it('displays product features by default', () => {
    render(<FAQsPage />)
    
    expect(screen.getByText('What Makes Our Product Stand Out')).toBeInTheDocument()
    expect(screen.getByText('Multilingual Menu Access')).toBeInTheDocument()
    expect(screen.getByText('Chatbot Reservations')).toBeInTheDocument()
    expect(screen.getByText('In-Restaurant Service Requests')).toBeInTheDocument()
  })

  it('renders support section', () => {
    render(<FAQsPage />)
    
    expect(screen.getByText('Still have questions?')).toBeInTheDocument()
    expect(screen.getByText('Contact our support team for more information about SmartSavor.')).toBeInTheDocument()
    expect(screen.getByText('Contact Support')).toBeInTheDocument()
  })

  it('displays feature descriptions correctly', () => {
    render(<FAQsPage />)
    
    expect(screen.getByRole('tabpanel')).toHaveTextContent(/View detailed menu information in your native language/)
    expect(screen.getByRole('tabpanel')).toHaveTextContent(/Make, modify, or cancel restaurant reservations/)
    expect(screen.getByRole('tabpanel')).toHaveTextContent(/While dining, request services by talking to the chatbot/)
  })
}) 
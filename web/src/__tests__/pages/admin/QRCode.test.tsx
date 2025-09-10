import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import QRCode from '@/app/admin/restaurants/[id]/components/QRCode'
import { MockQRCodeProps } from '../../types/test-types'

// Mock qrcode.react
vi.mock('qrcode.react', () => ({
  QRCodeCanvas: ({ value, imageSettings }: MockQRCodeProps) => (
    <div data-testid="qr-code-canvas">
      <canvas data-testid="qr-code-canvas-element" />
      <div data-testid="qr-code-value">{value}</div>
      <div data-testid="qr-code-image-src">{imageSettings?.src}</div>
    </div>
  )
}))

describe('QRCode', () => {
  const mockProps = {
    url: 'https://example.com/restaurant/123',
    logoImage: 'test-logo.png',
    restaurantName: 'Test Restaurant'
  }

  it('renders QR code component with correct title and description', () => {
    render(<QRCode {...mockProps} />)

    expect(screen.getByText('Restaurant QR Code')).toBeInTheDocument()
    expect(screen.getByText(/Scan this QR code to access the restaurant page/)).toBeInTheDocument()
  })

  it('renders QR code with correct URL', () => {
    render(<QRCode {...mockProps} />)

    expect(screen.getByTestId('qr-code-value')).toHaveTextContent(mockProps.url)
  })

  it('renders QR code with correct logo image', () => {
    render(<QRCode {...mockProps} />)

    expect(screen.getByTestId('qr-code-image-src')).toHaveTextContent(mockProps.logoImage)
  })

  it('renders QR code with default logo when no logo provided', () => {
    render(<QRCode {...mockProps} logoImage={undefined} />)

    expect(screen.getByTestId('qr-code-image-src')).toHaveTextContent('/favicon.ico')
  })

  it('renders download button', () => {
    render(<QRCode {...mockProps} />)

    expect(screen.getByText('Download QR Code')).toBeInTheDocument()
  })

  
}) 
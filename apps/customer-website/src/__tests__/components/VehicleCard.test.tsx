import { render, screen, fireEvent } from '@testing-library/react'
import { VehicleCard } from '@/components/ui/VehicleCard'

const mockVehicle = {
  id: '1',
  name: 'Tesla Model 3',
  image: '/images/tesla-model-3.jpg',
  price: 45,
  category: 'elektromobil',
  features: ['Autopilot', '500km dosah', 'Supercharging'],
  rating: 4.8,
  available: true
}

describe('VehicleCard Component', () => {
  it('should render vehicle information correctly', () => {
    render(<VehicleCard vehicle={mockVehicle} />)
    
    expect(screen.getByText('Tesla Model 3')).toBeInTheDocument()
    expect(screen.getByText('45€/deň')).toBeInTheDocument()
    expect(screen.getByText('elektromobil')).toBeInTheDocument()
    expect(screen.getByText('4.8')).toBeInTheDocument()
  })

  it('should render vehicle image with correct alt text', () => {
    render(<VehicleCard vehicle={mockVehicle} />)
    
    const image = screen.getByAltText('Tesla Model 3')
    expect(image).toBeInTheDocument()
    // Next.js Image component optimizes and encodes the src
    expect(image.getAttribute('src')).toContain('%2Fimages%2Ftesla-model-3.jpg')
  })

  it('should render all vehicle features', () => {
    render(<VehicleCard vehicle={mockVehicle} />)
    
    mockVehicle.features.forEach(feature => {
      expect(screen.getByText(feature)).toBeInTheDocument()
    })
  })

  it('should show availability status', () => {
    render(<VehicleCard vehicle={mockVehicle} />)
    
    expect(screen.getByText('Dostupné')).toBeInTheDocument()
    expect(screen.queryByText('Nedostupné')).not.toBeInTheDocument()
  })

  it('should show unavailable status when vehicle is not available', () => {
    const unavailableVehicle = { ...mockVehicle, available: false }
    render(<VehicleCard vehicle={unavailableVehicle} />)
    
    expect(screen.getByText('Nedostupné')).toBeInTheDocument()
    expect(screen.queryByText('Dostupné')).not.toBeInTheDocument()
  })

  it('should call onSelect when card is clicked', () => {
    const handleSelect = jest.fn()
    render(<VehicleCard vehicle={mockVehicle} onSelect={handleSelect} />)
    
    const card = screen.getByRole('article')
    fireEvent.click(card)
    
    expect(handleSelect).toHaveBeenCalledWith(mockVehicle)
  })

  it('should call onReserve when reserve button is clicked', () => {
    const handleReserve = jest.fn()
    render(<VehicleCard vehicle={mockVehicle} onReserve={handleReserve} />)
    
    const reserveButton = screen.getByRole('button', { name: /rezervovať/i })
    fireEvent.click(reserveButton)
    
    expect(handleReserve).toHaveBeenCalledWith(mockVehicle.id)
  })

  it('should disable reserve button when vehicle is not available', () => {
    const unavailableVehicle = { ...mockVehicle, available: false }
    render(<VehicleCard vehicle={unavailableVehicle} />)
    
    const reserveButton = screen.getByRole('button', { name: /rezervovať/i })
    expect(reserveButton).toBeDisabled()
  })

  it('should render with compact layout when compact prop is true', () => {
    render(<VehicleCard vehicle={mockVehicle} compact />)
    
    const card = screen.getByRole('article')
    expect(card).toHaveClass('compact')
  })
})

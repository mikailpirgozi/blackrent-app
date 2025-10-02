import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EnhancedFiltracia } from '@/components/anima/components/Filtracia/EnhancedFiltracia'

const mockVehicles = [
  {
    id: '1',
    name: 'Tesla Model 3',
    category: 'elektromobil',
    price: 45,
    features: ['Autopilot'],
    available: true
  },
  {
    id: '2', 
    name: 'BMW X5',
    category: 'suv',
    price: 80,
    features: ['4WD'],
    available: true
  },
  {
    id: '3',
    name: 'Audi A4',
    category: 'sedan',
    price: 60,
    features: ['Quattro'],
    available: false
  }
]

describe('EnhancedFiltracia Component', () => {
  it('should render all filter controls', () => {
    render(<EnhancedFiltracia vehicles={mockVehicles} />)
    
    expect(screen.getByPlaceholderText(/hľadať vozidlo/i)).toBeInTheDocument()
    expect(screen.getByText(/kategória/i)).toBeInTheDocument()
    expect(screen.getByText(/cena za deň/i)).toBeInTheDocument()
    expect(screen.getByText(/dostupnosť/i)).toBeInTheDocument()
  })

  it('should filter vehicles by search term', async () => {
    const user = userEvent.setup()
    const mockOnFilter = jest.fn()
    
    render(
      <EnhancedFiltracia 
        vehicles={mockVehicles} 
        onFilterChange={mockOnFilter}
      />
    )
    
    const searchInput = screen.getByPlaceholderText(/hľadať vozidlo/i)
    await user.type(searchInput, 'Tesla')
    
    await waitFor(() => {
      expect(mockOnFilter).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Tesla Model 3' })
        ])
      )
    })
  })

  it('should filter vehicles by category', async () => {
    const user = userEvent.setup()
    const mockOnFilter = jest.fn()
    
    render(
      <EnhancedFiltracia 
        vehicles={mockVehicles} 
        onFilterChange={mockOnFilter}
      />
    )
    
    const categorySelect = screen.getByDisplayValue(/všetky kategórie/i)
    await user.selectOptions(categorySelect, 'elektromobil')
    
    await waitFor(() => {
      expect(mockOnFilter).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ category: 'elektromobil' })
        ])
      )
    })
  })

  it('should filter vehicles by price range', async () => {
    const user = userEvent.setup()
    const mockOnFilter = jest.fn()
    
    render(
      <EnhancedFiltracia 
        vehicles={mockVehicles} 
        onFilterChange={mockOnFilter}
      />
    )
    
    const minPriceInput = screen.getByLabelText(/minimálna cena/i)
    const maxPriceInput = screen.getByLabelText(/maximálna cena/i)
    
    await user.clear(minPriceInput)
    await user.type(minPriceInput, '40')
    await user.clear(maxPriceInput)
    await user.type(maxPriceInput, '70')
    
    await waitFor(() => {
      expect(mockOnFilter).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Tesla Model 3' }),
          expect.objectContaining({ name: 'Audi A4' })
        ])
      )
    })
  })

  it('should filter vehicles by availability', async () => {
    const user = userEvent.setup()
    const mockOnFilter = jest.fn()
    
    render(
      <EnhancedFiltracia 
        vehicles={mockVehicles} 
        onFilterChange={mockOnFilter}
      />
    )
    
    const availabilityCheckbox = screen.getByLabelText(/len dostupné/i)
    await user.click(availabilityCheckbox)
    
    await waitFor(() => {
      expect(mockOnFilter).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ available: true })
        ])
      )
    })
  })

  it('should combine multiple filters', async () => {
    const user = userEvent.setup()
    const mockOnFilter = jest.fn()
    
    render(
      <EnhancedFiltracia 
        vehicles={mockVehicles} 
        onFilterChange={mockOnFilter}
      />
    )
    
    const categorySelect = screen.getByDisplayValue(/všetky kategórie/i)
    const availabilityCheckbox = screen.getByLabelText(/len dostupné/i)
    
    await user.selectOptions(categorySelect, 'elektromobil')
    await user.click(availabilityCheckbox)
    
    await waitFor(() => {
      expect(mockOnFilter).toHaveBeenCalledWith([
        expect.objectContaining({ 
          category: 'elektromobil',
          available: true 
        })
      ])
    })
  })

  it('should clear all filters when reset button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnFilter = jest.fn()
    
    render(
      <EnhancedFiltracia 
        vehicles={mockVehicles} 
        onFilterChange={mockOnFilter}
      />
    )
    
    // Apply some filters first
    const searchInput = screen.getByPlaceholderText(/hľadať vozidlo/i)
    await user.type(searchInput, 'Tesla')
    
    // Clear filters
    const resetButton = screen.getByRole('button', { name: /vymazať filtre/i })
    await user.click(resetButton)
    
    expect(mockOnFilter).toHaveBeenLastCalledWith(mockVehicles)
    expect(searchInput).toHaveValue('')
  })

  it('should show filter results count', () => {
    render(<EnhancedFiltracia vehicles={mockVehicles} />)
    
    expect(screen.getByText(/nájdené: 3 vozidiel/i)).toBeInTheDocument()
  })

  it('should handle empty vehicle list', () => {
    render(<EnhancedFiltracia vehicles={[]} />)
    
    expect(screen.getByText(/nájdené: 0 vozidiel/i)).toBeInTheDocument()
  })

  it('should be responsive and show mobile layout', () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 360,
    })
    
    render(<EnhancedFiltracia vehicles={mockVehicles} />)
    
    const filterContainer = screen.getByRole('region', { name: /filtre/i })
    expect(filterContainer).toHaveClass('mobile-layout')
  })
})

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InteractiveEMailNewsletter } from '@/components/anima/components/EMailNewsletter/InteractiveEMailNewsletter'

describe('InteractiveEMailNewsletter Component', () => {
  it('should render email input and submit button', () => {
    render(<InteractiveEMailNewsletter className="" type="default-b" />)
    
    expect(screen.getByPlaceholderText(/váš email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /prihlásiť sa/i })).toBeInTheDocument()
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<InteractiveEMailNewsletter className="" type="default-b" />)
    
    const emailInput = screen.getByPlaceholderText(/váš email/i)
    const form = screen.getByRole('form')
    
    // Test invalid email
    await user.type(emailInput, 'invalid-email')
    
    // Submit form directly
    fireEvent.submit(form)
    
    // Wait for error message to appear
    await screen.findByText(/neplatný email/i)
  })

  it('should accept valid email format', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = jest.fn()
    render(
      <InteractiveEMailNewsletter 
        className="" 
        type="default-b" 
        onSubmit={mockOnSubmit}
      />
    )
    
    const emailInput = screen.getByPlaceholderText(/váš email/i)
    const submitButton = screen.getByRole('button', { name: /prihlásiť sa/i })
    
    // Test valid email
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com')
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)))
    
    render(
      <InteractiveEMailNewsletter 
        className="" 
        type="default-b" 
        onSubmit={mockOnSubmit}
      />
    )
    
    const emailInput = screen.getByPlaceholderText(/váš email/i)
    const submitButton = screen.getByRole('button', { name: /prihlásiť sa/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    expect(screen.getByText(/odosielanie/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('should show success message after successful submission', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = jest.fn(() => Promise.resolve())
    
    render(
      <InteractiveEMailNewsletter 
        className="" 
        type="default-b" 
        onSubmit={mockOnSubmit}
      />
    )
    
    const emailInput = screen.getByPlaceholderText(/váš email/i)
    const submitButton = screen.getByRole('button', { name: /prihlásiť sa/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/ďakujeme za prihlásenie/i)).toBeInTheDocument()
    })
  })

  it('should show error message on submission failure', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = jest.fn(() => Promise.reject(new Error('Network error')))
    
    render(
      <InteractiveEMailNewsletter 
        className="" 
        type="default-b" 
        onSubmit={mockOnSubmit}
      />
    )
    
    const emailInput = screen.getByPlaceholderText(/váš email/i)
    const submitButton = screen.getByRole('button', { name: /prihlásiť sa/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/chyba pri prihlasovaní/i)).toBeInTheDocument()
    })
  })

  it('should clear form after successful submission', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = jest.fn(() => Promise.resolve())
    
    render(
      <InteractiveEMailNewsletter 
        className="" 
        type="default-b" 
        onSubmit={mockOnSubmit}
      />
    )
    
    const emailInput = screen.getByPlaceholderText(/váš email/i) as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /prihlásiť sa/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(emailInput.value).toBe('')
    })
  })

  it('should apply custom className and divClassName', () => {
    render(
      <InteractiveEMailNewsletter 
        className="custom-class" 
        divClassName="custom-div-class"
        type="default-b" 
      />
    )
    
    const container = screen.getByRole('form')
    expect(container).toHaveClass('custom-class')
  })
})

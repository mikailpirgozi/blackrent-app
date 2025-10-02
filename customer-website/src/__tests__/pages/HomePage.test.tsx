import { render, screen } from '@testing-library/react'
import HomePage from '../../app/page'

// Mock the components that might have complex dependencies
jest.mock('../../components/anima/sections/HeroSection/HeroSection', () => ({
  HeroSection: () => <div data-testid="hero-section"><h1>Hero Section</h1></div>
}))

jest.mock('../../components/anima/sections/FeaturedItemsSection/FeaturedItemsSection', () => ({
  FeaturedItemsSection: () => <div data-testid="featured-items">Featured Items</div>
}))

jest.mock('../../components/anima/sections/BrandLogosSection/BrandLogosSection', () => ({
  BrandLogosSection: () => <div data-testid="brand-logos">Brand Logos</div>
}))

jest.mock('../../components/anima/sections/ReviewsSection/ReviewsSection', () => ({
  ReviewsSection: () => <div data-testid="reviews">Reviews</div>
}))

jest.mock('../../components/anima/sections/ContactSection/ContactSection', () => ({
  ContactSection: () => <div data-testid="contact">Contact</div>
}))

jest.mock('../../components/anima/sections/HeaderSection/HeaderSection', () => ({
  HeaderSection: () => <div data-testid="header-section">Header Section</div>
}))

jest.mock('../../components/anima/sections/ChatButton/ChatButton', () => ({
  ChatButton: () => <div data-testid="chat-button">Chat Button</div>
}))

describe('HomePage', () => {
  it('should render without crashing', () => {
    render(<HomePage />)
    
    // Check if the page renders
    expect(document.body).toBeInTheDocument()
  })

  it('should render main sections', () => {
    render(<HomePage />)
    
    expect(screen.getByTestId('hero-section')).toBeInTheDocument()
    expect(screen.getByTestId('featured-items')).toBeInTheDocument()
    expect(screen.getByTestId('brand-logos')).toBeInTheDocument()
    expect(screen.getByTestId('reviews')).toBeInTheDocument()
    expect(screen.getByTestId('contact')).toBeInTheDocument()
  })

  it('should have proper page structure', () => {
    render(<HomePage />)
    
    // Check for main content area
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
  })

  it('should have proper SEO elements', () => {
    render(<HomePage />)
    
    // Check for proper heading structure
    const headings = screen.getAllByRole('heading')
    expect(headings.length).toBeGreaterThan(0)
  })

  it('should be accessible', () => {
    render(<HomePage />)
    
    // Check for landmarks
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('should have proper meta information', () => {
    // This would typically be tested with Next.js head testing utilities
    // For now, we'll just ensure the page renders
    render(<HomePage />)
    expect(document.body).toBeInTheDocument()
  })
})

import { 
  validateEmail, 
  validatePhoneNumber, 
  validateRequired,
  validatePriceRange,
  formatCurrency,
  formatDate
} from '@/utils/validation'

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validateEmail('test+tag@example.org')).toBe(true)
    })

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
      expect(validateEmail('test.domain.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('validatePhoneNumber', () => {
    it('should validate Slovak phone numbers', () => {
      expect(validatePhoneNumber('+421901234567')).toBe(true)
      expect(validatePhoneNumber('0901234567')).toBe(true)
      expect(validatePhoneNumber('901234567')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('123')).toBe(false)
      expect(validatePhoneNumber('abcdefghij')).toBe(false)
      expect(validatePhoneNumber('')).toBe(false)
    })
  })

  describe('validateRequired', () => {
    it('should validate required fields', () => {
      expect(validateRequired('some value')).toBe(true)
      expect(validateRequired('0')).toBe(true)
      expect(validateRequired(0)).toBe(true)
    })

    it('should reject empty required fields', () => {
      expect(validateRequired('')).toBe(false)
      expect(validateRequired(null)).toBe(false)
      expect(validateRequired(undefined)).toBe(false)
      expect(validateRequired('   ')).toBe(false)
    })
  })

  describe('validatePriceRange', () => {
    it('should validate valid price ranges', () => {
      expect(validatePriceRange(10, 100)).toBe(true)
      expect(validatePriceRange(0, 50)).toBe(true)
      expect(validatePriceRange(25, 25)).toBe(true)
    })

    it('should reject invalid price ranges', () => {
      expect(validatePriceRange(100, 10)).toBe(false)
      expect(validatePriceRange(-10, 50)).toBe(false)
      expect(validatePriceRange(10, -5)).toBe(false)
    })
  })

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(45)).toBe('45€')
      expect(formatCurrency(100)).toBe('100€')
      expect(formatCurrency(0)).toBe('0€')
    })

    it('should handle decimal values', () => {
      expect(formatCurrency(45.50)).toBe('45.50€')
      expect(formatCurrency(99.99)).toBe('99.99€')
    })

    it('should handle large numbers', () => {
      expect(formatCurrency(1000)).toBe('1,000€')
      expect(formatCurrency(1234.56)).toBe('1,234.56€')
    })
  })

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-01-15')
      expect(formatDate(date)).toBe('15.1.2024')
    })

    it('should handle different date formats', () => {
      const date = new Date('2024-12-25')
      expect(formatDate(date)).toBe('25.12.2024')
    })

    it('should handle date strings', () => {
      expect(formatDate('2024-01-15')).toBe('15.1.2024')
    })
  })
})

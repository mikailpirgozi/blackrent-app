/**
 * 🧪 REACT COMPONENT TESTS: UnifiedButton
 */

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import {
  UnifiedButton,
  PrimaryButton,
  SecondaryButton,
} from '../ui/UnifiedButton';

// Helper pre testovanie s MUI theme
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = createTheme();
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

describe('UnifiedButton', () => {
  describe('Rendering Tests', () => {
    it('should render button with correct text', () => {
      render(
        <TestWrapper>
          <UnifiedButton>Test Button</UnifiedButton>
        </TestWrapper>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Test Button')).toBeInTheDocument();
    });

    it('should render with primary variant by default', () => {
      render(
        <TestWrapper>
          <UnifiedButton>Primary Button</UnifiedButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-contained');
    });

    it('should render with different variants', () => {
      render(
        <TestWrapper>
          <UnifiedButton variant="outlined">Outlined Button</UnifiedButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-outlined');
    });

    it('should render with different sizes', () => {
      render(
        <TestWrapper>
          <UnifiedButton size="large">Large Button</UnifiedButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-sizeLarge');
    });
  });

  describe('Interaction Tests', () => {
    it('should call onClick handler when clicked', () => {
      const handleClick = vi.fn();

      render(
        <TestWrapper>
          <UnifiedButton onClick={handleClick}>Clickable Button</UnifiedButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn();

      render(
        <TestWrapper>
          <UnifiedButton onClick={handleClick} disabled>
            Disabled Button
          </UnifiedButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
      expect(button).toBeDisabled();
    });

    it('should not call onClick when loading', () => {
      const handleClick = vi.fn();

      render(
        <TestWrapper>
          <UnifiedButton onClick={handleClick} loading>
            Loading Button
          </UnifiedButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
      expect(button).toBeDisabled();
    });
  });

  describe('Loading State Tests', () => {
    it('should show loading text when loading', () => {
      render(
        <TestWrapper>
          <UnifiedButton loading loadingText="Spracovávam...">
            Save Button
          </UnifiedButton>
        </TestWrapper>
      );

      expect(screen.getByText('Spracovávam...')).toBeInTheDocument();
      expect(screen.queryByText('Save Button')).not.toBeInTheDocument();
    });

    it('should show default loading text when loading without custom text', () => {
      render(
        <TestWrapper>
          <UnifiedButton loading>Save Button</UnifiedButton>
        </TestWrapper>
      );

      expect(screen.getByText('Načítavam...')).toBeInTheDocument();
    });

    it('should show CircularProgress when loading', () => {
      render(
        <TestWrapper>
          <UnifiedButton loading>Save Button</UnifiedButton>
        </TestWrapper>
      );

      // MUI CircularProgress má role="progressbar"
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Predefined Button Variants', () => {
    it('should render PrimaryButton correctly', () => {
      render(
        <TestWrapper>
          <PrimaryButton>Primary</PrimaryButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-contained');
      expect(screen.getByText('Primary')).toBeInTheDocument();
    });

    it('should render SecondaryButton correctly', () => {
      render(
        <TestWrapper>
          <SecondaryButton>Secondary</SecondaryButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-outlined');
      expect(screen.getByText('Secondary')).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    it('should be accessible with proper ARIA attributes', () => {
      render(
        <TestWrapper>
          <UnifiedButton aria-label="Test button for accessibility">
            Accessible Button
          </UnifiedButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute(
        'aria-label',
        'Test button for accessibility'
      );
    });

    it('should support fullWidth prop', () => {
      render(
        <TestWrapper>
          <UnifiedButton fullWidth>Full Width Button</UnifiedButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-fullWidth');
    });
  });
});

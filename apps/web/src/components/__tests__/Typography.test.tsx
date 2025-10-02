/**
 * 🧪 REACT COMPONENT TESTS: Typography
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import {
  Typography,
  H1,
  Body, Caption
} from '../ui/typography';

describe('Typography', () => {
  describe('Rendering Tests', () => {
    it('should render with correct text', () => {
      render(<Typography>Test Text</Typography>);
      expect(screen.getByText('Test Text')).toBeInTheDocument();
    });

    it('should render h1 variant as h1 element', () => {
      render(<Typography variant="h1">Heading 1</Typography>);
      const element = screen.getByText('Heading 1');
      expect(element.tagName).toBe('H1');
    });

    it('should render h2 variant as h2 element', () => {
      render(<Typography variant="h2">Heading 2</Typography>);
      const element = screen.getByText('Heading 2');
      expect(element.tagName).toBe('H2');
    });

    it('should render body1 variant as p element', () => {
      render(<Typography variant="body1">Body Text</Typography>);
      const element = screen.getByText('Body Text');
      expect(element.tagName).toBe('P');
    });

    it('should render caption variant as span element', () => {
      render(<Typography variant="caption">Caption Text</Typography>);
      const element = screen.getByText('Caption Text');
      expect(element.tagName).toBe('SPAN');
    });

    it('should render with custom component', () => {
      render(<Typography component="div">Custom Div</Typography>);
      const element = screen.getByText('Custom Div');
      expect(element.tagName).toBe('DIV');
    });
  });

  describe('Styling Tests', () => {
    it('should apply primary color', () => {
      render(<Typography color="primary">Primary Color</Typography>);
      const element = screen.getByText('Primary Color');
      expect(element).toHaveClass('text-primary');
    });

    it('should apply error color', () => {
      render(<Typography color="error">Error Color</Typography>);
      const element = screen.getByText('Error Color');
      expect(element).toHaveClass('text-destructive');
    });

    it('should apply text alignment', () => {
      render(<Typography align="center">Centered Text</Typography>);
      const element = screen.getByText('Centered Text');
      expect(element).toHaveClass('text-center');
    });

    it('should apply gutterBottom margin', () => {
      render(<Typography gutterBottom>With Margin</Typography>);
      const element = screen.getByText('With Margin');
      expect(element).toHaveClass('mb-4');
    });

    it('should apply noWrap truncation', () => {
      render(<Typography noWrap>Long text that should be truncated</Typography>);
      const element = screen.getByText('Long text that should be truncated');
      expect(element).toHaveClass('truncate');
    });
  });

  describe('MUI Compatibility Tests', () => {
    it('should support sx prop for styling', () => {
      render(
        <Typography sx={{ mb: 2, fontSize: '16px' }}>
          With sx prop
        </Typography>
      );
      const element = screen.getByText('With sx prop');
      const styles = window.getComputedStyle(element);
      expect(styles.marginBottom).toBe('16px'); // mb: 2 = 2 * 8px
      expect(styles.fontSize).toBe('16px');
    });

    it('should support color="text.secondary" format', () => {
      render(
        <Typography color="textSecondary">
          Secondary text
        </Typography>
      );
      const element = screen.getByText('Secondary text');
      expect(element).toHaveClass('text-muted-foreground');
    });
  });

  describe('Predefined Components', () => {
    it('should render H1 component correctly', () => {
      render(<H1>H1 Component</H1>);
      const element = screen.getByText('H1 Component');
      expect(element.tagName).toBe('H1');
      expect(element).toHaveClass('text-4xl');
    });

    it('should render Body component correctly', () => {
      render(<Body>Body Component</Body>);
      const element = screen.getByText('Body Component');
      expect(element.tagName).toBe('P');
      expect(element).toHaveClass('text-base');
    });

    it('should render Caption component correctly', () => {
      render(<Caption>Caption Component</Caption>);
      const element = screen.getByText('Caption Component');
      expect(element.tagName).toBe('SPAN');
      expect(element).toHaveClass('text-xs');
    });
  });
});

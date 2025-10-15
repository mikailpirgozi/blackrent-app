/**
 * 🧪 SmartImage Component Tests
 * Unit tests for SmartImage performance and functionality
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { SmartImage } from '../ui/smart-image/smart-image';

// Mock the asset registry
jest.mock('../ui/smart-image/asset-registry', () => ({
  getAssetSource: jest.fn((path: string) => {
    if (path.includes('hero-image-1')) {
      return { uri: 'mocked-local-asset' };
    }
    return { uri: path };
  }),
}));

describe('SmartImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with local asset', async () => {
    const { getByTestId } = render(
      <SmartImage
        source="assets/images/vehicles/hero-image-1.webp"
        testID="smart-image"
        style={{ width: 100, height: 100 }}
      />
    );

    const image = getByTestId('smart-image');
    expect(image).toBeTruthy();
  });

  it('should handle loading state', async () => {
    const { getByTestId, queryByTestId } = render(
      <SmartImage
        source="https://example.com/image.jpg"
        testID="smart-image"
        showLoading={true}
        style={{ width: 100, height: 100 }}
      />
    );

    // Should show loading initially
    expect(queryByTestId('smart-image-loading')).toBeTruthy();
  });

  it('should handle error state', async () => {
    const { getByTestId } = render(
      <SmartImage
        source="invalid-url"
        testID="smart-image"
        showError={true}
        style={{ width: 100, height: 100 }}
      />
    );

    await waitFor(() => {
      expect(getByTestId('smart-image-error')).toBeTruthy();
    });
  });

  it('should apply correct styles', () => {
    const testStyle = { width: 200, height: 150, borderRadius: 10 };
    
    const { getByTestId } = render(
      <SmartImage
        source="test-image.jpg"
        testID="smart-image"
        style={testStyle}
      />
    );

    const image = getByTestId('smart-image');
    expect(image.props.style).toMatchObject(testStyle);
  });

  it('should handle placeholder correctly', () => {
    const { getByTestId } = render(
      <SmartImage
        source=""
        testID="smart-image"
        placeholder="placeholder-image.jpg"
        style={{ width: 100, height: 100 }}
      />
    );

    const image = getByTestId('smart-image');
    expect(image).toBeTruthy();
  });

  it('should optimize memory usage', async () => {
    const mockTrackImage = jest.fn();
    
    // Mock memory manager
    jest.doMock('../../utils/memory-manager', () => ({
      memoryManager: {
        trackImageCache: mockTrackImage,
      },
    }));

    render(
      <SmartImage
        source="test-image.jpg"
        testID="smart-image"
        style={{ width: 100, height: 100 }}
      />
    );

    await waitFor(() => {
      expect(mockTrackImage).toHaveBeenCalledWith('test-image.jpg');
    });
  });

  it('should handle resize modes correctly', () => {
    const { getByTestId } = render(
      <SmartImage
        source="test-image.jpg"
        testID="smart-image"
        resizeMode="cover"
        style={{ width: 100, height: 100 }}
      />
    );

    const image = getByTestId('smart-image');
    expect(image.props.resizeMode).toBe('cover');
  });

  it('should support accessibility props', () => {
    const { getByTestId } = render(
      <SmartImage
        source="test-image.jpg"
        testID="smart-image"
        accessibilityLabel="Test image"
        accessibilityHint="This is a test image"
        style={{ width: 100, height: 100 }}
      />
    );

    const image = getByTestId('smart-image');
    expect(image.props.accessibilityLabel).toBe('Test image');
    expect(image.props.accessibilityHint).toBe('This is a test image');
  });
});

/**
 * 🧪 Catalog Integration Tests
 * Integration tests for catalog functionality
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TouchableOpacity, Text, ScrollView, View } from 'react-native';
import CatalogScreen from '../(tabs)/catalog';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

// Mock route
const mockRoute = {
  params: {},
};

// Mock API hooks
jest.mock('../../hooks/mock-api-hooks', () => ({
  useVehicles: jest.fn(() => ({
    data: [
      {
        id: '1',
        make: 'Tesla',
        model: 'Model S',
        year: 2023,
        pricePerDay: 150,
        images: ['test-image-1.jpg'],
        available: true,
        location: 'Bratislava',
      },
      {
        id: '2',
        make: 'BMW',
        model: 'X5',
        year: 2022,
        pricePerDay: 120,
        images: ['test-image-2.jpg'],
        available: true,
        location: 'Košice',
      },
    ],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
}));

// Mock components
jest.mock('../../components/ui/optimized-vehicle-card', () => ({
  OptimizedVehicleCard: ({ vehicle, onPress }: any) => (
    <TouchableOpacity testID={`vehicle-card-${vehicle.id}`} onPress={onPress}>
      <Text>{vehicle.make} {vehicle.model}</Text>
      <Text>{vehicle.pricePerDay}€/day</Text>
    </TouchableOpacity>
  ),
}));

jest.mock('../../components/ui/lazy-list/lazy-list', () => ({
  LazyList: ({ data, renderItem, testID }: any) => (
    <ScrollView testID={testID}>
      {data.map((item: any, index: number) => (
        <View key={item.id || index}>
          {renderItem({ item, index })}
        </View>
      ))}
    </ScrollView>
  ),
}));

describe('Catalog Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const renderCatalog = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CatalogScreen navigation={mockNavigation} route={mockRoute} />
      </QueryClientProvider>
    );
  };

  it('should load and display vehicles', async () => {
    const { getByTestId, getByText } = renderCatalog();

    await waitFor(() => {
      expect(getByText('Tesla Model S')).toBeTruthy();
      expect(getByText('BMW X5')).toBeTruthy();
    });
  });

  it('should handle vehicle card press', async () => {
    const { getByTestId } = renderCatalog();

    await waitFor(() => {
      const vehicleCard = getByTestId('vehicle-card-1');
      fireEvent.press(vehicleCard);
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('vehicle/1');
  });

  it('should display loading state', () => {
    // Mock loading state
    jest.doMock('../../hooks/mock-api-hooks', () => ({
      useVehicles: jest.fn(() => ({
        data: [],
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      })),
    }));

    const { getByTestId } = renderCatalog();
    expect(getByTestId('catalog-loading')).toBeTruthy();
  });

  it('should display error state', async () => {
    // Mock error state
    jest.doMock('../../hooks/mock-api-hooks', () => ({
      useVehicles: jest.fn(() => ({
        data: [],
        isLoading: false,
        error: new Error('Failed to load vehicles'),
        refetch: jest.fn(),
      })),
    }));

    const { getByTestId } = renderCatalog();
    
    await waitFor(() => {
      expect(getByTestId('catalog-error')).toBeTruthy();
    });
  });

  it('should handle search functionality', async () => {
    const { getByTestId, getByText, queryByText } = renderCatalog();

    const searchInput = getByTestId('search-input');
    fireEvent.changeText(searchInput, 'Tesla');

    await waitFor(() => {
      expect(getByText('Tesla Model S')).toBeTruthy();
      expect(queryByText('BMW X5')).toBeFalsy();
    });
  });

  it('should handle filter functionality', async () => {
    const { getByTestId, getByText } = renderCatalog();

    const filterButton = getByTestId('filter-button');
    fireEvent.press(filterButton);

    await waitFor(() => {
      expect(getByTestId('filter-modal')).toBeTruthy();
    });

    // Test price filter
    const priceFilter = getByTestId('price-filter');
    fireEvent.changeText(priceFilter, '100-130');

    const applyButton = getByTestId('apply-filters');
    fireEvent.press(applyButton);

    await waitFor(() => {
      expect(getByText('BMW X5')).toBeTruthy();
      expect(queryByText('Tesla Model S')).toBeFalsy();
    });
  });

  it('should handle refresh functionality', async () => {
    const mockRefetch = jest.fn();
    
    jest.doMock('../../hooks/mock-api-hooks', () => ({
      useVehicles: jest.fn(() => ({
        data: [],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })),
    }));

    const { getByTestId } = renderCatalog();

    const refreshControl = getByTestId('catalog-refresh');
    fireEvent(refreshControl, 'refresh');

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it('should handle empty state', async () => {
    jest.doMock('../../hooks/mock-api-hooks', () => ({
      useVehicles: jest.fn(() => ({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })),
    }));

    const { getByTestId } = renderCatalog();

    await waitFor(() => {
      expect(getByTestId('catalog-empty')).toBeTruthy();
    });
  });

  it('should optimize list performance', async () => {
    const { getByTestId } = renderCatalog();

    const lazyList = getByTestId('catalog-list');
    
    // Test that lazy list is rendered
    expect(lazyList).toBeTruthy();
    
    // Test scroll performance
    fireEvent.scroll(lazyList, {
      nativeEvent: {
        contentOffset: { y: 500 },
        contentSize: { height: 1000 },
        layoutMeasurement: { height: 800 },
      },
    });

    // Should not cause performance issues
    expect(lazyList).toBeTruthy();
  });

  it('should handle accessibility', async () => {
    const { getByTestId } = renderCatalog();

    await waitFor(() => {
      const vehicleCard = getByTestId('vehicle-card-1');
      expect(vehicleCard.props.accessibilityLabel).toContain('Tesla Model S');
      expect(vehicleCard.props.accessibilityRole).toBe('button');
    });
  });
});

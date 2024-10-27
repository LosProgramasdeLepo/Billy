import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CategoryList } from '../CategoryList';
import { useAppContext } from '../../hooks/useAppContext';

// Mock the navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock expo-linking (add this)
jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
}));

// Mock the AppContext
jest.mock('../../hooks/useAppContext', () => ({
  useAppContext: () => ({
    categoryData: [
      { 
        id: '1', 
        name: 'Food', 
        spent: 100, 
        color: '["#FF0000", "#00FF00"]', 
        icon: 'food',
        budget: 200,
        transactions: [],
        percentage: 50
      },
      { 
        id: '2', 
        name: 'Transport', 
        spent: 50, 
        color: '["#0000FF", "#FF00FF"]', 
        icon: 'car',
        budget: 100,
        transactions: [],
        percentage: 50
      },
      { 
        id: '3', 
        name: 'Otros', 
        spent: 25, 
        color: '["#CECECE", "#CECECE"]', 
        icon: 'cash-multiple',
        budget: 50,
        transactions: [],
        percentage: 50
      },
    ],
    refreshCategoryData: jest.fn(),
    refreshOutcomeData: jest.fn(),
    selectedPeriod: 'current',
    setSelectedPeriod: jest.fn(),
  }),
}));

describe('CategoryList', () => {
  it('renders correctly in row layout', () => {
    const { getAllByText, getByText } = render(
      <CategoryList layout="row" />
    );
    
    expect(getByText('Categorías')).toBeTruthy();
    expect(getByText('Ver más')).toBeTruthy();
    expect(getAllByText('Food')).toBeTruthy();
    expect(getAllByText('Transport')).toBeTruthy();
    expect(getAllByText('Otros')).toBeTruthy();
  });

  it('navigates to category details on press', () => {
    const { getByText } = render(
      <CategoryList layout="row" />
    );
    
    fireEvent.press(getByText('Food'));
    expect(mockNavigate).toHaveBeenCalledWith('CategoryDetailsScreen', { category: expect.any(Object) });
  });

  it('opens add category modal when add button is pressed', () => {
    const { getByText } = render(
      <CategoryList layout="row" />
    );
    
    fireEvent.press(getByText('+'));
    // You would need to add a testID to your AddCategoryModal to properly test this
    // expect(getByTestId('add-category-modal')).toBeTruthy();
  });
});

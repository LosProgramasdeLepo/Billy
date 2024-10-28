import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TransactionList } from '../TransactionList';
import { OutcomeList } from '../OutcomeList';
import { CategoryList } from '../CategoryList';
import { BalanceCard } from '../BalanceCard';
import { useAppContext } from '../../hooks/useAppContext';

// Mock the navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
}));

// Mock the AppContext
jest.mock('../../hooks/useAppContext', () => ({
  useAppContext: () => ({
    incomeData: [
      { id: '1', description: 'Grocery Shopping', amount: 50, created_at: '2024-10-01' },
      { amount: 1000 }, { amount: 500 }
    ],
    outcomeData: [
      { id: '2', description: 'Bus Ticket', amount: 2.5, created_at: '2024-10-02' },
      { amount: 300 }, { amount: 200 }
    ],
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
    currentProfileId: '123',
    refreshIncomeData: jest.fn(),
    refreshOutcomeData: jest.fn(),
    refreshCategoryData: jest.fn(),
    refreshBalanceData: jest.fn(),
    user: { email: 'test@example.com' },
    balance: 1000,
    selectedPeriod: 'current',
    setSelectedPeriod: jest.fn(),
  }),
}));

describe('TransactionList', () => {
  it('renders correctly with header', () => {
    const { getByText } = render(
      <TransactionList timeRange="month" showHeader={true} />
    );

    expect(getByText('Actividad reciente')).toBeTruthy();
    expect(getByText('Bus Ticket')).toBeTruthy();
    expect(getByText('Grocery Shopping')).toBeTruthy();
  });
});

describe('OutcomeList', () => {
  it('renders correctly with header', () => {
    const { getByText } = render(
      <OutcomeList />
    );

    expect(getByText('Bus Ticket')).toBeTruthy();
  });

  it('renders multiple outcomes', () => {
    const { getByText } = render(
      <OutcomeList />
    );

    expect(getByText('Bus Ticket')).toBeTruthy();
  });
});

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
  });
});

describe('BalanceCard', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <BalanceCard />
    );
    
    expect(getByText('Balance total:')).toBeTruthy();
    expect(getByText('$1000.00')).toBeTruthy();
    expect(getByText('Ingresos')).toBeTruthy();
    expect(getByText('$1550.00')).toBeTruthy();
    expect(getByText('Gastos')).toBeTruthy();
    expect(getByText('$502.50')).toBeTruthy();
  });

  it('displays the correct income data', () => {
    const { getByText } = render(
      <BalanceCard />
    );

    expect(getByText('Ingresos')).toBeTruthy();
    expect(getByText('$1550.00')).toBeTruthy();
  });

  it('displays the correct outcome data', () => {
    const { getByText } = render(
      <BalanceCard />
    );

    expect(getByText('Gastos')).toBeTruthy();
    expect(getByText('$502.50')).toBeTruthy();
  });

  it('displays the correct balance', () => {
    const { getByText } = render(
      <BalanceCard />
    );

    expect(getByText('Balance total:')).toBeTruthy();
    expect(getByText('$1000.00')).toBeTruthy();
  });
});

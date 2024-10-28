import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { TransactionList } from '../TransactionList';
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
    ],
    outcomeData: [
      { id: '2', description: 'Bus Ticket', amount: 2.5, created_at: '2024-10-02' },
    ],
    categoryData: ["Comida"],
    currentProfileId: '123',
    refreshIncomeData: jest.fn(),
    refreshOutcomeData: jest.fn(),
    refreshCategoryData: jest.fn(),
    refreshBalanceData: jest.fn(),
    user: { email: 'test@example.com' },
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

  it('renders without header', () => {
    const { queryByText } = render(
      <TransactionList timeRange="month" showHeader={false} />
    );

    expect(queryByText('Actividad reciente')).toBeNull();
    expect(queryByText('Bus Ticket')).toBeTruthy();
    expect(queryByText('Grocery Shopping')).toBeTruthy();
  });

  it('displays income transactions', () => {
    const { getByText } = render(
      <TransactionList timeRange="month" showHeader={true} />
    );

    expect(getByText('Grocery Shopping')).toBeTruthy();
    expect(getByText('$50')).toBeTruthy();
  });

  it('displays outcome transactions', () => {
    const { getByText } = render(
      <TransactionList timeRange="month" showHeader={true} />
    );

    expect(getByText('Bus Ticket')).toBeTruthy();
    expect(getByText('$2.5')).toBeTruthy();
  });

  it('navigates to transaction details on click', () => {
    const { getByText } = render(
      <TransactionList timeRange="month" showHeader={true} />
    );

    const transaction = getByText('Bus Ticket');
  });
});

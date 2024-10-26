import React from 'react';
import { render } from '@testing-library/react-native';
import { BalanceCard } from '../BalanceCard';

// Mock the AppContext
jest.mock('../../hooks/useAppContext', () => ({
  useAppContext: () => ({
    incomeData: [{ amount: 1000 }, { amount: 500 }],
    outcomeData: [{ amount: 300 }, { amount: 200 }],
    balance: 1000,
  }),
}));

describe('BalanceCard', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <BalanceCard />
    );
    
    expect(getByText('Balance total:')).toBeTruthy();
    expect(getByText('$1000.00')).toBeTruthy();
    expect(getByText('Ingresos')).toBeTruthy();
    expect(getByText('$1500.00')).toBeTruthy();
    expect(getByText('Gastos')).toBeTruthy();
    expect(getByText('$500.00')).toBeTruthy();
  });
});

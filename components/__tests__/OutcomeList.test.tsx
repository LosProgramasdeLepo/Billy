import React from 'react';
import { render } from '@testing-library/react-native';
import { OutcomeList } from '../OutcomeList';
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
    outcomeData: [
      { id: '2', description: 'Bus Ticket', amount: 2.5, created_at: '2024-10-02' },
    ],
    categoryData: ["Transporte"],
    currentProfileId: '123',
    refreshOutcomeData: jest.fn(),
    refreshCategoryData: jest.fn(),
    refreshBalanceData: jest.fn(),
    user: { email: 'test@example.com' },
  }),
}));

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

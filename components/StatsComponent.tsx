import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet  } from "react-native";
import { Svg, Circle } from "react-native-svg";
import { getTotalToPayInDateRange, CategoryData, getSharedUsers, getOutcomesFromDateRangeAndCategory } from '../api/api';
import { useAppContext } from '@/hooks/useAppContext';
import { formatNumber } from '@/lib/utils';

interface Expense {
  label: string;
  amount: number; 
  color: string;
}

const generateRandomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

const parseDate = (month: number, year: number, init: number): Date => { return new Date(year, month, init); }

const getLastDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

//if mode is false, then it's category. TODO: optimize this. Should be a better way.
export const StatsComponent = React.memo(({ month, year, mode }: { month: number; year: number, mode: boolean | null }) => {
  const { currentProfileId, categoryData } = useAppContext();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const calculateExpenses = useCallback(async () => {
    if (!categoryData || !currentProfileId) return;

    let calculatedExpenses: Expense[] = [];

    if (mode === false) { 
      const idColorMap = new Map<string, string>();
      const colorsRegistered = new Set<string>();

      calculatedExpenses = await Promise.all(
        categoryData.map(async (category) => {
          const total = await getCategoryTotal(currentProfileId, category.id || '', month, year);
          let color = total > 0 
            ? idColorMap.get(category.id || "") || getColorForCategory(category, colorsRegistered)
            : '#CCCCCC'; // No data
          idColorMap.set(category.id || "", color);
          return { label: category.name, amount: total, color } as Expense;
        })
      );
      
      calculatedExpenses.sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
    }
    
    else {
      const sharedUsers = await getSharedUsers(currentProfileId);
      if (sharedUsers && sharedUsers.length > 0) {
        const startDate = parseDate(month, year, 1);
        const endDate = parseDate(month, year, getLastDayOfMonth(year, month));
        const items = await getTotalToPayInDateRange(currentProfileId, startDate, endDate);
    
        calculatedExpenses = await Promise.all(sharedUsers.map(async (user) => {
          const label = user.name || user.email;
          return { label, amount: items ? items[user.email] || 0 : 0, color: generateRandomColor() } as Expense;
        }));
      }
    }
    setExpenses(calculatedExpenses);
  }, [categoryData, currentProfileId, month, year]);

  useEffect(() => {
    calculateExpenses();
  }, [calculateExpenses]);

  const getColorForCategory = (category: CategoryData, colorsRegistered: Set<string>): string => {
    const colors = JSON.parse(category.color);
    let color = colors[1];
    if (colorsRegistered.has(color)) color = generateRandomColor();
    colorsRegistered.add(color);
    return color;
  };
  
  const getCategoryTotal = async (profileId: string, categoryId: string, month: number, year: number): Promise<number> => {
    const OutcomeFromCategory = await getOutcomesFromDateRangeAndCategory(profileId, parseDate(month, year, 1), parseDate(month, year, 30), categoryId);
    return Array.isArray(OutcomeFromCategory) ? OutcomeFromCategory.reduce((sum, outcome) => sum + outcome.amount, 0) : 0;
  };

  const maxAmount = useMemo(() => expenses.reduce((sum, expense) => sum + (expense.amount ?? 0), 0), [expenses]);

  return (
    <View style={styles.container}>
      <PieChart data={expenses}/>
      <View style={styles.box}>
        {expenses.map((expense) => (
          <ExpenseItem key={expense.label} expense={expense} maxAmount={maxAmount} />
        ))}
      </View>
    </View>
  );
});

const PieChart = React.memo(({ data }: { data: Expense[] }) => {
  const radius = 110;
  const strokeWidth = 30;
  const center = radius + strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const total = useMemo(() => data.reduce((sum, item) => sum + (item.amount ?? 0), 0), [data]);

  let accumulatedPercentage = 0;

  return (
    <View style={styles.pieContainer}>
      <Svg height={250} width={250}>
        <Circle cx={center} cy={center} r={radius} stroke="#f0f0f0" strokeWidth={strokeWidth} fill="transparent"/>
        {data.map((item, index) => {
          if (!item.color || typeof item.color !== 'string') return null;
          const percentage = item.amount !== null ? item.amount / total : 0;
          const strokeDashoffset = circumference * (1 - percentage);
          const rotation = accumulatedPercentage * 360;
          accumulatedPercentage += percentage;

          const validStrokeDashoffset = isNaN(strokeDashoffset) ? 0 : strokeDashoffset;
          const validRotation = isNaN(rotation) ? 0 : rotation;

          return (
            <Circle key={index} cx={center} cy={center} r={radius} stroke={item.color} strokeWidth={strokeWidth} fill="transparent" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={validStrokeDashoffset} transform={`rotate(${validRotation} ${center} ${center})`} strokeLinecap='round'/>
          );
        })}
      </Svg>

      <View style={styles.valueContainer}>
        <Text style={styles.valueText}>${formatNumber(total)}</Text>
      </View>
    </View>
  );
});

const ExpenseItem = React.memo(({ expense, maxAmount }: { expense: Expense; maxAmount: number }) => {
  const { label, amount, color } = expense;
  const barWidth = maxAmount > 0 ? ((amount ?? 0) / maxAmount) * 100 : 0;
  return (
    <View style={styles.expenseItem}>
      <Text style={styles.expenseLabel} numberOfLines={1} ellipsizeMode="tail">{label}</Text>
      <View style={styles.barOuterContainer}>
        <View style={styles.barContainer}>
          <View style={[styles.bar, { backgroundColor: color, width: `${barWidth}%` }]} />
        </View>
      </View>
      <Text style={styles.expenseAmount}>${formatNumber(amount ?? 0)}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 260,
  },
  box: {
    width: "100%",
    maxWidth: 400,
    marginTop: 20,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  expenseLabel: {
    flex: 1 ,
    color: "#3c3c3c",
    fontSize: 16,
    fontWeight: "400",
    marginRight: 10,
  },
  barOuterContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    width: '100%',
    height: 13,
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 25,
  },
  expenseAmount: {
    flex: 1,
    color: "#3c3c3c",
    fontSize: 14,
    textAlign: 'right',
    marginLeft: 10,
  },
  textWrapper: {
    color: "#3c3c3c",
    fontSize: 16,
    fontWeight: "400",
    flexShrink: 1,
    marginRight: 5,
  },
  pieContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    marginBottom: 15, 
    position: "absolute", 
    marginLeft: -125,
  },
  valueContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  valueText: {
    fontSize: 36,
    color: '#3B3B3B',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default StatsComponent;

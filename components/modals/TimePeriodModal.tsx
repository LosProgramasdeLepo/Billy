import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import { TransactionList } from '../TransactionList';
import { getOutcomesFromDateRange, getIncomesFromDateRange, IncomeData, OutcomeData } from '@/api/api';
import moment from 'moment';
import { useAppContext } from '@/hooks/useAppContext';

interface TimePeriodModalProps {
    isVisible: boolean;
    onClose: () => void;
    startDate: Date;
    endDate: Date;
}

const TimePeriodModal: React.FC<TimePeriodModalProps> = ({ isVisible, onClose, startDate, endDate }) => {
    const { currentProfileId } = useAppContext();
    const [transactions, setTransactions] = useState<{ incomes: IncomeData[], outcomes: OutcomeData[] }>({ incomes: [], outcomes: [] });

    const dateRange = useMemo(() => ({
        start: moment.utc(startDate).startOf('day').format('YYYY-MM-DD'),
        end: moment.utc(endDate).endOf('day').format('YYYY-MM-DD')
    }), [startDate, endDate]);

    const fetchTransactions = useCallback(async () => {
        const [incomes, outcomes] = await Promise.all([
            getIncomesFromDateRange(currentProfileId??"", startDate, endDate),
            getOutcomesFromDateRange(currentProfileId??"", startDate, endDate)
        ]);
        setTransactions({ incomes: incomes as IncomeData[], outcomes: outcomes as OutcomeData[] });
    }, [currentProfileId, startDate, endDate]);

    useEffect(() => {
        if (isVisible) fetchTransactions();
    }, [isVisible, fetchTransactions]);

    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    const formattedDateRange = useMemo(() => ({
        start: moment(dateRange.start).format('DD/MM/YYYY'),
        end: moment(dateRange.end).format('DD/MM/YYYY'),
    }), [dateRange]);

    const renderHeader = useCallback(() => (
        <Text style={styles.detailsModalTitle}>
            {formattedDateRange.start} - {formattedDateRange.end}
        </Text>
    ), [formattedDateRange]);

    const renderFooter = useCallback(() => (
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
    ), [handleClose]);

    return (
        <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={handleClose}>
            <View style={styles.detailsModalBackground}>
                <View style={styles.detailsModalContainer}>
                    <FlatList
                        ListHeaderComponent={renderHeader}
                        ListFooterComponent={renderFooter}
                        data={[{ key: 'transactions' }]}
                        renderItem={() => (
                            <TransactionList timeRange='custom' customStartDate={startDate} customEndDate={endDate}/>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    detailsModalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    detailsModalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingHorizontal: 16,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    detailsModalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    closeButton: {
        marginTop: 20,
        backgroundColor: '#FF0000',
        padding: 10,
        borderRadius: 5,
        alignSelf: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default React.memo(TimePeriodModal);
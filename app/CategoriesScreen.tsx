import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CategoryList } from '@/components/CategoryList';
import { BillyHeader } from '@/components/BillyHeader';
import { LinearGradient } from 'expo-linear-gradient';

const CategoriesScreen = () => {
    return (
        <View style={styles.container}>
            <LinearGradient colors={['#4B00B8', '#20014E']} style={styles.gradientContainer}>
                <BillyHeader title="Categorías"/>
                <View style={styles.contentContainer}>
                    <CategoryList layout="grid" showAddButton={true} showHeader={false}/>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradientContainer: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    contentContainer: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginHorizontal: '2.5%',
    },
});

export default CategoriesScreen;
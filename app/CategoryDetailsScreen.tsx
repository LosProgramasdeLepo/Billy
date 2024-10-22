import React from 'react';
import { View, StyleSheet } from 'react-native';
import { OutcomeList } from '@/components/OutcomeList';
import { BillyHeader } from '@/components/BillyHeader';
import { LinearGradient } from 'expo-linear-gradient';
import { RoutePropType } from '@/types/navigation';
import { useRoute } from '@react-navigation/native';
import { useAppContext } from '@/hooks/useAppContext';

type Props = {
    route?: RoutePropType<'CategoryDetailsScreen'>;
};

const CategoryDetailsScreen: React.FC<Props> = () => {
    const route = useRoute<RoutePropType<'CategoryDetailsScreen'>>();
    const category = route.params?.category;
    const { categoryData } = useAppContext();

    // Encuentra la categoría correspondiente para obtener el límite y el gasto
    const categoryInfo = categoryData?.find(cat => cat.id === category.id);
    const spent = categoryInfo?.spent || 0;
    const limit = categoryInfo?.limit || 0;

    const title = limit ? `${category.name} ($${spent.toFixed(2)}/$${limit.toFixed(2)})` : `${category.name} ($${spent.toFixed(2)})`;

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#4B00B8', '#20014E']} style={styles.gradientContainer}>
                <BillyHeader title={title} icon={category.icon}/>
                <View style={styles.contentContainer}>
                    <OutcomeList category={category.id} showDateSeparators={true} />
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
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginHorizontal: '2.5%',
    },
});

export default CategoryDetailsScreen;

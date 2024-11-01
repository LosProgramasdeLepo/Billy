import React, { useState, useMemo, useCallback } from "react";
import { ScrollView, Text, TouchableOpacity, StyleSheet, Alert, View } from "react-native";
import { CategoryData, removeCategory, fetchOutcomesByCategory } from "@/api/api";
import { ThemedText } from "./ThemedText";
import { OutcomeData } from "@/api/api";
import { LinearGradient } from "expo-linear-gradient";
import AddCategoryModal from "./modals/AddCategoryModal";
import { useNavigation } from "@react-navigation/native";
import { useAppContext } from "@/hooks/useAppContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { NavigationProp } from "@/types/navigation";
import { formatNumber } from "@/lib/utils";

interface CategoryListProps {
  layout: "row" | "grid";
  showAddButton?: boolean;
  showHeader?: boolean;
}

const parseGradient = (color: string): string[] => {
  try {
    return JSON.parse(color);
  } catch {
    return ["#48ECE2", "#62D29C"];
  }
};

export const CategoryList: React.FC<CategoryListProps> = ({ layout, showAddButton = true, showHeader = true }) => {
  const navigation = useNavigation<NavigationProp<"Home">>();

  const { outcomeData, refreshOutcomeData, categoryData, refreshCategoryData } = useAppContext();

  const [modalVisible, setModalVisible] = useState(false);

  // For details
  const [filteredOutcomeData, setFilteredOutcomeData] = useState<OutcomeData[]>([]);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);

  // Get categories' outcomes
  const getOutcomeData = useCallback(
    (categoryId: string) => {
      const filtered = outcomeData?.filter((outcome) => outcome.category === categoryId) || [];
      setFilteredOutcomeData(filtered);
    },
    [outcomeData]
  );

  // Aseguramos que "Otros" siempre esté presente y al final
  const sortedCategories = useMemo(() => {
    if (!categoryData) return [];
    const othersCategory = categoryData.find((cat) => cat.name === "Otros");
    const otherCategories = categoryData
      .filter((cat) => cat.name !== "Otros")
      .sort((a, b) => parseFloat(String(b.spent ?? "0")) - parseFloat(String(a.spent ?? "0")));
    return [...otherCategories, othersCategory];
  }, [categoryData]);

  const handleCategoryPress = useCallback(
    (category: CategoryData) => {
      navigation.navigate("CategoryDetailsScreen", { category } as never);
    },
    [navigation]
  );

  const handleLongPress = useCallback(
    (category: CategoryData) => {
      if (category.name === "Otros") {
        Alert.alert("Acción no permitida", "La categoría 'Otros' no puede ser eliminada.");
        return;
      }
      setSelectedCategory(category);
      Alert.alert("Eliminar categoría", "¿Está seguro de que quiere eliminar la categoría?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            if (category) {
              await removeCategory(category.id || "null");
              await Promise.all([refreshOutcomeData(), refreshCategoryData()]);
            }
          },
        },
      ]);
    },
    [refreshCategoryData]
  );

  const getCategoryColor = useCallback((category: CategoryData) => {
    return category.name === "Otros" ? ["#CECECE", "#CECECE"] : parseGradient(category.color);
  }, []);

  // Separe function to update it only when necessary
  const renderCategory = useCallback(
    (category: CategoryData, index: number) => {
      const gradientColors = getCategoryColor(category);
      return (
        <TouchableOpacity
          key={category.id || index}
          onPress={() => handleCategoryPress(category)}
          onLongPress={() => handleLongPress(category)}
          style={layout === "grid" ? styles.gridItem : styles.rowItem}
        >
          <LinearGradient
            colors={gradientColors}
            style={layout === "grid" ? styles.gridCategory : styles.rowCategory}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <Icon
              name={category.icon || "cash-multiple"}
              size={layout === "grid" ? 60 : 40}
              color="rgba(255,255,255,0.2)"
              style={styles.backgroundIcon}
            />
            <ThemedText style={layout === "grid" ? styles.gridCategoryName : styles.rowCategoryName}>{category.name}</ThemedText>
            <ThemedText style={layout === "grid" ? styles.gridCategoryAmount : styles.rowCategoryAmount}>
              ${formatNumber(category.spent ?? 0)}
            </ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      );
    },
    [getCategoryColor, handleCategoryPress, handleLongPress, layout]
  );

  return (
    <View>
      {showHeader && (
        <View style={styles.headerContainer}>
          <Text style={styles.categoriesTitle}>Categorías</Text>
          <TouchableOpacity onPress={() => navigation.navigate("CategoriesScreen" as never)}>
            <Text style={styles.viewMoreText}>Ver más</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        horizontal={layout === "row"}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={layout === "grid" ? styles.gridContainer : styles.rowContainer}
      >
        {sortedCategories.filter((category): category is CategoryData => category !== undefined).map(renderCategory)}

        {showAddButton && (
          <TouchableOpacity
            style={[styles.addCategoryButton, layout === "grid" ? styles.gridAddButton : styles.rowAddButton]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addCategoryButtonText}>+</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <AddCategoryModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCategoryAdded={() => {
          refreshCategoryData();
          setModalVisible(false);
        }}
        sortedCategories={sortedCategories}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: "row",
  },
  gridContainer: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  rowItem: {
    marginRight: 16,
  },
  gridItem: {
    width: "48%",
    marginBottom: 16,
  },
  rowCategory: {
    width: 150,
    height: 80,
    padding: 15,
    borderRadius: 15,
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  },
  gridCategory: {
    aspectRatio: 1,
    padding: 15,
    borderRadius: 15,
    position: "relative",
    overflow: "hidden",
  },
  rowCategoryName: {
    color: "#3B3B3B",
    fontWeight: "bold",
    fontSize: 16,
  },
  gridCategoryName: {
    color: "#3B3B3B",
    fontWeight: "bold",
    fontSize: 24,
    marginTop: 5,
  },
  rowCategoryAmount: {
    color: "#3B3B3B",
    fontSize: 13,
  },
  gridCategoryAmount: {
    color: "#3B3B3B",
    fontSize: 20,
    marginTop: 5,
  },
  rowAddButton: {
    width: 40,
    height: 80,
  },
  gridAddButton: {
    width: "48%",
    aspectRatio: 1,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  viewMoreText: {
    color: "#4B00B8",
    textDecorationLine: "underline",
  },
  backgroundIcon: {
    position: "absolute",
    right: -10,
    bottom: -10,
  },
  addCategoryButton: {
    width: 40,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  addCategoryButtonText: {
    fontSize: 24,
    color: "#370185",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
});

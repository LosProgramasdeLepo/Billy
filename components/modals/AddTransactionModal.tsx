import { View, Text, TextInput, StyleSheet, Modal, TouchableOpacity, Animated, ScrollView, Alert, SafeAreaView } from "react-native";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppContext } from "@/hooks/useAppContext";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import MlkitOcr from "react-native-mlkit-ocr";
import { debounce } from "lodash";
import moment from "moment";
import {
  addIncome,
  addOutcome,
  fetchCategories,
  CategoryData,
  isProfileShared,
  getSharedUsers,
  getCategoryIdByName,
  categorizePurchase,
  processOcrResults,
} from "@/api/api";

interface AddTransactionModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isVisible, onClose }) => {
  const { currentProfileId, refreshIncomeData, refreshOutcomeData, refreshCategoryData, refreshBalanceData } = useAppContext();

  const [rotationAnimation] = useState(new Animated.Value(0));

  const [sharedUsers, setSharedUsers] = useState<string[] | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [shared, setShared] = useState<boolean | null>(null);

  const [bubbleAnimation] = useState(new Animated.Value(0));
  const [loadingDots, setLoadingDots] = useState(0);
  const loadingInterval = useRef<NodeJS.Timeout>();

  const [type, setType] = useState<"Income" | "Outcome">("Income");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [ticketScanned, setTicketScanned] = useState<boolean>(false);
  const [categorizedByIA, setCategorizedByIA] = useState<boolean>(false);

  const [selectedSharedUser, setSelectedSharedUser] = useState<string[] | null>(null);
  const [whoPaidIt, setWhoPaidIt] = useState<string[] | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);

  const [errors, setErrors] = useState({ description: false, amount: false });

  useEffect(() => {
    let rotationLoop: Animated.CompositeAnimation;

    if (isCategorizing) {
      rotationLoop = Animated.loop(
        Animated.timing(rotationAnimation, {
          toValue: -8,
          duration: 300,
          useNativeDriver: true,
        })
      );
      rotationLoop.start();
    } else {
      rotationAnimation.setValue(0);
    }

    return () => {
      if (rotationLoop) rotationLoop.stop();
    };
  }, [isCategorizing]);

  useEffect(() => {
    if (description === "Escaneando ticket") {
      loadingInterval.current = setInterval(() => {
        setLoadingDots((prev) => (prev + 1) % 4);
      }, 500);

      return () => {
        if (loadingInterval.current) {
          clearInterval(loadingInterval.current);
        }
      };
    } else {
      setLoadingDots(0);
      if (loadingInterval.current) {
        clearInterval(loadingInterval.current);
      }
    }
  }, [description]);

  const fetchProfileData = useCallback(async () => {
    if (currentProfileId) {
      const isShared = await isProfileShared(currentProfileId);
      setShared(isShared);

      if (isShared) {
        const users = await getSharedUsers(currentProfileId);
        setSharedUsers(users.map((user) => user.email));
      }
    }
  }, [currentProfileId]);

  useEffect(() => {
    if (isVisible) {
      fetchProfileData();
      fetchCategories(currentProfileId ?? "").then((categories) => setCategories(categories || []));
    }
  }, [isVisible, currentProfileId, fetchProfileData]);

  const fetchCategoriesData = useCallback(() => {
    fetchCategories(currentProfileId ?? "").then((categories) => setCategories(categories || []));
  }, [currentProfileId]);

  useEffect(() => {
    if (isVisible) fetchCategoriesData();
  }, [isVisible, fetchCategoriesData]);

  const handleAmountChange = (text: string) => {
    setAmount(text);
    validateField("amount", text);
  };

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    validateField("description", text);
    debouncedCategorize(text);
  };

  const validateField = useCallback((field: "description" | "amount", value: string) => {
    setErrors((prev) => ({
      ...prev,
      [field]: !value.trim(),
    }));
  }, []);

  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  }, []);

  const handleScanTicket = async () => {
    // Pido permisos para usar la camara
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permisos requerido", "Necesitamos permisos para escanear tickets.");
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setDescription("Escaneando ticket");
        setAmount("");

        const ocrResult = await MlkitOcr.detectFromUri(result.assets[0].uri);

        const extractedData = processOcrResults(ocrResult);

        setTicketScanned(true);

        if ((await extractedData).total) {
          setAmount((await extractedData).total?.toString() ?? "");
        }
        if ((await extractedData).description) {
          setDescription((await extractedData).description);
          debouncedCategorize((await extractedData).description);
        }
      }
    } catch (error) {
      console.error("Error accediendo a la cámara:", error);
      Alert.alert("Error", "No se pudo acceder a la cámara. Por favor, intenta de nuevo.");
      setTicketScanned(false);
      setDescription("");
      setAmount("");
    }
  };

  const handleSubmit = useCallback(async () => {
    const newErrors = {
      description: !description.trim(),
      amount: !amount.trim(),
    };

    if (newErrors.description || newErrors.amount) {
      setErrors(newErrors);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    if (type === "Income") {
      await addIncome(currentProfileId ?? "", parseFloat(amount), description, date);
      refreshIncomeData();
    } else {
      let categoryToUse = selectedCategory;
      if (selectedCategory === "") categoryToUse = (await getCategoryIdByName(currentProfileId ?? "", "Otros")) ?? "null";
      if (categoryToUse === "null") return;
      if (shared && whoPaidIt && whoPaidIt.length > 0) {
        await addOutcome(
          currentProfileId ?? "",
          categoryToUse || "",
          parseFloat(amount),
          description,
          date,
          whoPaidIt[0],
          selectedSharedUser || [],
          categorizedByIA,
          ticketScanned
        );
      } else {
        await addOutcome(currentProfileId ?? "", categoryToUse || "", parseFloat(amount), description, date);
      }
      refreshOutcomeData();
      refreshCategoryData();
    }
    refreshBalanceData();
    setAmount("");
    setDescription("");
    setDate(new Date());
    setSelectedCategory("");
    setIsSubmitting(false);
    onClose();
  }, [
    type,
    isSubmitting,
    amount,
    description,
    selectedCategory,
    refreshIncomeData,
    refreshOutcomeData,
    refreshCategoryData,
    refreshBalanceData,
    currentProfileId,
    onClose,
    shared,
    whoPaidIt,
    selectedSharedUser,
    date,
  ]);

  const switchType = useCallback(
    (newType: "Income" | "Outcome") => {
      setType(newType);
      Animated.timing(bubbleAnimation, {
        toValue: newType === "Outcome" ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    },
    [bubbleAnimation]
  );

  const bubbleInterpolation = bubbleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["2%", "48%"],
  });

  const getTextColor = (buttonType: "Income" | "Outcome") => {
    return type === buttonType ? "#000000" : "#FFFFFF";
  };

  const renderTypeSelector = useMemo(
    () => (
      <View style={styles.typeSelector}>
        <View style={[styles.bubbleBackground, { backgroundColor: "#B39CD4" }]}>
          <Animated.View style={[styles.bubble, { left: bubbleInterpolation }]} />
        </View>

        <TouchableOpacity style={styles.typeButton} onPress={() => switchType("Income")}>
          <Text style={[styles.typeButtonText, { color: getTextColor("Income") }]}>Ingreso</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.typeButton} onPress={() => switchType("Outcome")}>
          <Text style={[styles.typeButtonText, { color: getTextColor("Outcome") }]}>Gasto</Text>
        </TouchableOpacity>
      </View>
    ),
    [bubbleInterpolation, switchType, getTextColor]
  );

  const debouncedCategorize = useMemo(
    () =>
      debounce(async (text: string) => {
        if (text && categories.length > 0) {
          setIsCategorizing(true);
          try {
            const categorized = await categorizePurchase(
              text,
              categories.map((c) => c.name)
            );
            if (categorized) {
              const categoryId = await getCategoryIdByName(currentProfileId ?? "", categorized);
              setSelectedCategory(categoryId ?? "");
              setCategorizedByIA(true);
            }
          } finally {
            setIsCategorizing(false);
          }
        }
      }, 500),
    [categories, currentProfileId]
  );

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <SafeAreaView style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={30} color="#000000" />
          </TouchableOpacity>

          <View style={styles.contentContainer}>
            {renderTypeSelector}

            <TextInput
              style={[styles.input, errors.description && styles.inputError]}
              value={description === "Escaneando ticket" ? `${description}${".".repeat(loadingDots)}` : description}
              onChangeText={handleDescriptionChange}
              placeholder="Descripción (obligatorio)"
              placeholderTextColor="#AAAAAA"
            />

            <TextInput
              style={[styles.input, errors.amount && styles.inputError]}
              keyboardType="numeric"
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="Monto (obligatorio)"
              placeholderTextColor="#AAAAAA"
            />

            {type === "Outcome" && (
              <View style={styles.pickerContainer}>
                {isCategorizing && <Animated.View style={[styles.dashedBorder, { transform: [{ translateX: rotationAnimation }] }]} />}
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedCategory}
                    onValueChange={(itemValue) => setSelectedCategory(itemValue)}
                    style={[styles.picker, { flex: 1 }]}
                    itemStyle={styles.pickerItem}
                    enabled={!isCategorizing}
                  >
                    <Picker.Item label={isCategorizing ? "Categorizando..." : "Selecciona una categoría"} value="" />
                    {categories.map((category) => (
                      <Picker.Item key={category.id} label={category.name} value={category.id} />
                    ))}
                  </Picker>
                  {isCategorizing && (
                    <TouchableOpacity
                      style={styles.cancelCategorization}
                      onPress={() => {
                        debouncedCategorize.cancel();
                        setIsCategorizing(false);
                      }}
                    >
                      <Icon name="close" size={20} color="#000000" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {type === "Outcome" && shared && (
              <ParticipantSelect sharedUsers={sharedUsers} onSelect={(users: string[]) => setWhoPaidIt(users)} singleSelection={true} />
            )}

            {type === "Outcome" && shared && (
              <ParticipantSelect
                sharedUsers={sharedUsers}
                onSelect={(users: string[]) => setSelectedSharedUser(users)}
                singleSelection={false}
                whoPaidIt={whoPaidIt ? whoPaidIt[0] : undefined}
              />
            )}

            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
              <Text style={[styles.datePickerText, !date && styles.placeholderText]}>
                {date ? moment(date).format("DD/MM/YYYY") : "Fecha"}
              </Text>
              <Icon name="calendar-today" size={24} color="#007BFF" style={styles.datePickerIcon} />
            </TouchableOpacity>

            {showDatePicker && <DateTimePicker value={date} mode="date" display="default" onChange={handleDateChange} />}

            {type === "Outcome" && (
              <TouchableOpacity style={styles.scanButton} onPress={handleScanTicket}>
                <Text style={styles.scanButtonText}>Escanear ticket</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.acceptButton} onPress={handleSubmit}>
              <Text style={styles.acceptButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const ParticipantSelect = ({
  sharedUsers,
  onSelect,
  singleSelection,
  whoPaidIt,
}: {
  sharedUsers: string[] | null;
  onSelect: (users: string[]) => void;
  singleSelection: boolean;
  whoPaidIt?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  if (singleSelection) {
    return (
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedUsers[0] || ""}
          onValueChange={(value) => {
            setSelectedUsers([value]);
            onSelect([value]);
          }}
          style={styles.picker}
        >
          {sharedUsers?.map((user) => (
            <Picker.Item key={user} label={user} value={user} />
          ))}
        </Picker>
      </View>
    );
  }

  const toggleUser = (user: string) => {
    setSelectedUsers((prev) => {
      if (singleSelection) {
        return [user];
      }
      return prev.includes(user) ? prev.filter((u) => u !== user) : [...prev, user];
    });
  };

  const handleDone = () => {
    onSelect(selectedUsers);
    setIsOpen(false);
  };

  const getButtonText = () => {
    if (singleSelection) {
      if (selectedUsers.length > 0) {
        return `${selectedUsers[0]}`;
      }
      return "¿Quién Pagó?";
    }
    if (selectedUsers.length > 0) {
      const count = selectedUsers.length;
      return `${count} ${count === 1 ? "Participante" : "Participantes"}`;
    }
    return "Seleccionar Participantes";
  };

  const displayedUsers = singleSelection ? sharedUsers : sharedUsers?.filter((user) => user !== whoPaidIt) || [];

  return (
    <View style={styles.selectContainer}>
      <TouchableOpacity style={styles.selectButton} onPress={() => setIsOpen(!isOpen)}>
        <Text style={styles.selectButtonText}>{getButtonText()}</Text>
        <Icon name={isOpen ? "chevron-up" : "chevron-down"} size={24} color="#000" />
      </TouchableOpacity>

      {isOpen && (
        <Modal transparent visible={isOpen} animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1}>
            <View style={styles.dropdown}>
              <ScrollView>
                {displayedUsers?.map((user: string) => (
                  <TouchableOpacity key={user} style={styles.option} onPress={() => toggleUser(user)}>
                    <View style={styles.userRow}>
                      <Text style={styles.optionText}>{user}</Text>
                      <View style={[styles.checkbox, selectedUsers.includes(user) && styles.checkedBox]}>
                        {selectedUsers.includes(user) && <Text style={styles.tick}>✓</Text>}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "85%",
    maxWidth: 400,
    backgroundColor: "white",
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    paddingTop: 40,
  },
  contentContainer: {
    width: "100%",
    padding: 20,
  },
  typeSelector: {
    marginTop: 10,
    flexDirection: "row",
    marginBottom: 20,
    position: "relative",
    width: "100%",
    justifyContent: "center",
    height: 44,
  },
  typeButton: {
    width: "50%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  bubbleBackground: {
    position: "absolute",
    top: -3,
    bottom: -3,
    left: -6,
    right: -6,
    backgroundColor: "#B39CD4",
    borderRadius: 24,
    overflow: "hidden",
  },
  bubble: {
    position: "absolute",
    top: 3,
    bottom: 3,
    width: "50%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
    fontSize: 16,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
    width: "100%",
    marginBottom: 16,
  },
  datePickerText: {
    fontSize: 16,
    color: "#000",
    flex: 1,
  },
  placeholderText: {
    color: "#AAAAAA",
  },
  datePickerIcon: {
    marginLeft: 10,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  acceptButton: {
    backgroundColor: "#370185",
    borderRadius: 24,
    padding: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  scanButton: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#6A1B9A",
    backgroundColor: "transparent",
    width: "100%",
    alignItems: "center",
  },
  scanButtonText: {
    color: "#6A1B9A",
    fontSize: 16,
  },
  picker: {
    marginLeft: -5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#ddd",
    borderRadius: 4,
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
    overflow: "hidden",
  },
  pickerItem: {
    fontSize: 16,
  },
  selectContainer: {
    marginBottom: 16,
  },
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
    minHeight: 48,
  },
  selectButtonText: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dropdown: {
    width: "80%",
    maxHeight: 300,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    elevation: 5,
  },
  option: {
    padding: 12,
  },
  optionText: {
    fontSize: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  tick: {
    color: "#FFFFFF",
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  checkedBox: {
    backgroundColor: "#370185",
    borderColor: "#370185",
  },
  doneButton: {
    backgroundColor: "#370185",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  inputError: {
    borderColor: "#FF0000",
    borderWidth: 1,
  },
  pickerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  cancelCategorization: {
    position: "absolute",
    right: 30,
    padding: 5,
  },
  dashedBorder: {
    position: "absolute",
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#370185",
    width: "200%",
  },
});

export default React.memo(AddTransactionModal);

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
  const [currentPage, setCurrentPage] = useState(1);

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
    const formattedText = text.replace(/[^0-9,]/g, "").replace(",", ".");
    setAmount(formattedText);
    validateField("amount", formattedText);
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
      }, 1000),
    [categories, currentProfileId]
  );

  const resetModal = useCallback(() => {
    setType("Income");
    setDescription("");
    setAmount("");
    setDate(new Date());
    setSelectedCategory("");
    setTicketScanned(false);
    setCategorizedByIA(false);
    setSelectedSharedUser(null);
    setWhoPaidIt(null);
    setCurrentPage(1);
    setErrors({ description: false, amount: false });
    bubbleAnimation.setValue(0);
  }, [bubbleAnimation]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isVisible) {
      resetModal();
    }
  }, [isVisible, resetModal]);

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={handleClose}>
      <SafeAreaView style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <View style={styles.headerButtons}>
            {shared && type === "Outcome" && currentPage === 2 ? (
              <TouchableOpacity style={styles.backButton} onPress={() => setCurrentPage(1)}>
                <Icon name="arrow-left" size={24} color="#370185" />
              </TouchableOpacity>
            ) : (
              <View style={styles.backButtonPlaceholder} />
            )}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={30} color="#000000" />
            </TouchableOpacity>
          </View>

          <View style={styles.contentContainer}>
            {renderTypeSelector}

            {(!shared || type === "Income" || currentPage === 1) && (
              <>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, errors.description && styles.inputError, { width: type === "Income" ? "100%" : "88%" }]}
                    value={description === "Escaneando ticket" ? `${description}${".".repeat(loadingDots)}` : description}
                    onChangeText={handleDescriptionChange}
                    placeholder="Descripción (obligatorio)"
                    placeholderTextColor="#AAAAAA"
                  />
                  {type === "Outcome" && (
                    <TouchableOpacity onPress={handleScanTicket} style={styles.scanButton}>
                      <Icon name="scan-helper" size={24} color="#370185" />
                    </TouchableOpacity>
                  )}
                </View>

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

                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
                  <Text style={[styles.datePickerText, !date && styles.placeholderText]}>
                    {date ? moment(date).format("DD/MM/YYYY") : "Fecha"}
                  </Text>
                  <Icon name="calendar-today" size={24} color="#007BFF" style={styles.datePickerIcon} />
                </TouchableOpacity>

                {showDatePicker && <DateTimePicker value={date} mode="date" display="default" onChange={handleDateChange} />}

                {shared && type === "Outcome" ? (
                  <TouchableOpacity
                    style={[styles.acceptButton, (!description || !amount) && { opacity: 0.5 }]}
                    onPress={() => setCurrentPage(2)}
                    disabled={!description || !amount}
                  >
                    <Text style={styles.acceptButtonText}>Continuar →</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.acceptButton, (!description || !amount) && { opacity: 0.5 }]}
                    onPress={handleSubmit}
                    disabled={!description || !amount}
                  >
                    <Text style={styles.acceptButtonText}>Aceptar</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {shared && type === "Outcome" && currentPage === 2 && (
              <>
                <ParticipantSelect sharedUsers={sharedUsers} onSelect={(users: string[]) => setWhoPaidIt(users)} singleSelection={true} />

                <ParticipantSelect
                  sharedUsers={sharedUsers}
                  onSelect={(users: string[]) => setSelectedSharedUser(users)}
                  singleSelection={false}
                  whoPaidIt={whoPaidIt ? whoPaidIt[0] : undefined}
                />

                <TouchableOpacity
                  style={[styles.acceptButton, (!whoPaidIt || !whoPaidIt.length) && { opacity: 0.5 }]}
                  onPress={handleSubmit}
                  disabled={!whoPaidIt || !whoPaidIt.length}
                >
                  <Text style={styles.acceptButtonText}>Aceptar</Text>
                </TouchableOpacity>
              </>
            )}
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
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  if (singleSelection) {
    return (
      <View style={styles.whoPaidContainer}>
        <Text style={styles.participantsTitle}>¿Quién pagó?</Text>
        <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowPicker(!showPicker)}>
          <Text style={styles.dropdownButtonText}>{selectedUsers[0] || "Seleccione quién pagó"}</Text>
          <Icon name={showPicker ? "chevron-up" : "chevron-down"} size={24} color="#000" />
        </TouchableOpacity>

        {showPicker && (
          <View style={styles.dropdownList}>
            <ScrollView style={styles.scrollView} nestedScrollEnabled={true}>
              {sharedUsers?.map((user) => (
                <TouchableOpacity
                  key={user}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedUsers([user]);
                    onSelect([user]);
                    setShowPicker(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{user}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  }

  const toggleUser = (user: string) => {
    setSelectedUsers((prev) => {
      return prev.includes(user) ? prev.filter((u) => u !== user) : [...prev, user];
    });
    onSelect(selectedUsers);
  };

  const displayedUsers = sharedUsers?.filter((user) => user !== whoPaidIt) || [];

  return (
    <View style={styles.selectContainer}>
      <Text style={styles.participantsTitle}>Participantes</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.participantsList}>
        <View style={styles.participantsContainer}>
          {displayedUsers.map((user, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.participantButton, selectedUsers.includes(user) && styles.participantButtonSelected]}
              onPress={() => toggleUser(user)}
            >
              <Text style={[styles.participantButtonText, selectedUsers.includes(user) && styles.participantButtonTextSelected]}>
                {user}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    paddingTop: 50,
  },
  contentContainer: {
    width: "100%",
    padding: 20,
  },
  typeSelector: {
    flexDirection: "row",
    marginBottom: 16,
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
  acceptButton: {
    backgroundColor: "#370185",
    borderRadius: 24,
    padding: 12,
    width: "100%",
    alignItems: "center",
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  scanButton: {
    marginLeft: 10,
    marginBottom: 16,
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
    height: 50,
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
    height: 50,
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
  participantsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },
  participantsList: {
    maxHeight: 200,
  },
  participantsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  participantButton: {
    backgroundColor: "#DDDDDD",
    borderRadius: 10,
    padding: 10,
    margin: 5,
  },
  participantButtonSelected: {
    backgroundColor: "#4B00B8",
  },
  participantButtonText: {
    fontSize: 16,
  },
  participantButtonTextSelected: {
    color: "#FFFFFF",
  },
  whoPaidContainer: {
    width: "100%",
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#F8F8F8",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownButtonText: {
    fontSize: 16,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    marginTop: 5,
    backgroundColor: "#F8F8F8",
  },
  dropdownItem: {
    padding: 10,
  },
  dropdownItemText: {
    fontSize: 16,
  },
  scrollView: {
    maxHeight: 80,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  headerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 10,
    paddingTop: 10,
    position: "absolute",
    top: 0,
    zIndex: 1,
  },
  backButton: {
    padding: 10,
  },
  backButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  closeButton: {
    padding: 10,
  },
});

export default React.memo(AddTransactionModal);

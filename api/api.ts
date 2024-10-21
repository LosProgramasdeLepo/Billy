import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createURL } from 'expo-linking';
import { Alert } from 'react-native';
import { decode } from 'base64-arraybuffer';
import { AuthError } from '@supabase/supabase-js';

const INCOMES_TABLE = 'Incomes';
const OUTCOMES_TABLE = 'Outcomes';
const SHARED_OUTCOMES_TABLE = 'SharedOutcomes';
const CATEGORIES_TABLE = 'Categories';
const PROFILES_TABLE = 'Profiles';
const USERS_TABLE = 'Users';
const DEBTS_TABLE = 'Debts';
const BILLS_TABLE = 'Bills';

export interface UserData {
  email: string;
  name: string;
  surname: string;
  currentProfile?: string;
  my_profiles?: string[];
  profile_picture?: string;
}

export interface IncomeData {
  id?: string;
  profile: string;
  amount: number;
  description: string;
  created_at?: Date;
}

export interface OutcomeData {
  id? : string;
  profile: string;
  category: string; 
  amount: number;
  description: string;
  created_at?: Date;
  shared_outcome?: string;
}

export interface SharedOutcomeData {
  id? : string;
  users: string[];
  userNames?: string[];
  to_pay : number[];
  has_paid? : boolean[];
}

export interface CategoryData {
  id?: string
  name: string;
  profile: string;
  spent? : number;
  limit?: number;
  color: string;
  icon: string;
  created_at?: Date;
}

export interface ProfileData {
  id?: string;
  name: string;
  balance?: number;
  created_at?: Date;
  owner: string;
  users?: string[];
  is_shared?: boolean;
}

export interface DebtData {
  id?: string;
  outcome: string;
  paid_by: string;
  debtor: string;
  has_paid: boolean;
  amount: number;
}

export interface InvitationData {
  id?: string;
  profile: string;
  created_at?: Date;
}

/* General data */

async function fetchData(table: string, columnToCheck: string, parentID: string): Promise<any[] | null> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq(columnToCheck, parentID);

    if (error) {
      console.error(`Error fetching data from ${table}:`, error);
      return null;
    }

    return data;
  } 
  
  catch (error) {
    console.error(`Unexpected error from ${table}:`, error);
    return null;
  }
}

async function getData(table: string, id: string, columnToCheck: string = 'id'): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq(columnToCheck ?? 'id', id)
      .single();

    if (error) {
      console.error(`Error getting ${table.slice(0, -1)}:`, error);
      return null;
    }

    return data;
  } 
  
  catch (error) {
    console.error(`Unexpected error getting ${table.slice(0, -1)}:`, error);
    return null;
  }
}

async function addData(table: string, newData: any): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from(table)
      .insert(newData)
      .select()
      .single();
    
    if (error) {
      console.error(`Error adding data to ${table}:`, error);
      return null;
    }
  
    return data;
  } 

  catch (error) {
    console.error(`Unexpected error adding data to ${table}:`, error);
    return null;
  }
}

async function removeData(table: string, id: string) {
  try {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error removing item:", error);
      return null;
    }

    return data;
  } 
  
  catch (error) {
    console.error("Unexpected error removing item:", error);
    return null;
  }
}

async function updateData(table: string, columnToUpdate: string, update: any, columnToCheck: string, id: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from(table)
      .update({ [columnToUpdate]: update })
      .eq(columnToCheck, id)
      .single();
    
    if (error) {
      console.error(`Error updating ${columnToUpdate} in ${table} for ${columnToCheck} = ${id}:`, error);
      return null;
    }
      
    return data;
  } 

  catch (error) {
    console.error(`Unexpected error updating ${columnToUpdate} in ${table} for ${columnToCheck} = ${id}:`, error);
    return null;
  }
}

async function getValueFromData(table: string, columnToReturn: string, columnToCheck: string, id: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(columnToReturn)
      .eq(columnToCheck, id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`No data found in ${table} for ${columnToCheck} = ${id}`);
        return null;
      }
      console.error(`Error fetching ${columnToReturn} from ${table}:`, error);
      return null;
    }
    
    return data ? (data as { [key: string]: any })[columnToReturn] ?? null : null;
  } 
  
  catch (error) {
    console.error(`Unexpected error fetching ${columnToReturn} from ${table}:`, error);
    return null;
  }
}



/* Incomes */

export async function fetchIncomes(profile: string): Promise<IncomeData[] | null> {
  return await fetchData(INCOMES_TABLE, 'profile', profile);
}

export async function getIncome(id: string): Promise<IncomeData | null> {
  return await getData(INCOMES_TABLE, id);
}

export async function addIncome(profile: string, amount: number, description: string, created_at?: Date): Promise<IncomeData[] | null> {
  try {
    const newIncome: IncomeData = { 
      profile: profile, 
      amount: amount, 
      description: description, 
      created_at: created_at || new Date(), 
    };
    
    const [{ data: insertData, error: insertError }] = await Promise.all([
      supabase.from(INCOMES_TABLE).insert(newIncome).select(),
      updateBalance(profile, amount)
    ]);

    if (insertError) {
      console.error("Error adding income:", insertError);
      return null;
    }

    return insertData;
  } 
  
  catch (error) {
    console.error("Unexpected error adding income:", error);
    return null;
  }
};

export async function removeIncome(profile: string, id: string) {
  try {
    const income = await getIncome(id);
    
    if (!income) {
      console.error("Income not found:", id);
      return { error: "Income not found." };
    }

    const [deleteResult] = await Promise.all([
      supabase.from(INCOMES_TABLE).delete().eq('id', id),
      updateBalance(profile, -income.amount)
    ]);

    if (deleteResult.error) {
      console.error("Error removing income:", deleteResult.error);
      return null
    }

    return deleteResult;
  } 
  
  catch (error) {
    console.error("Unexpected error removing income:", error);
    return null;
  }
}



/* Outcomes */

export async function fetchOutcomes(profile: string): Promise<OutcomeData[] | null> {
  return await fetchData(OUTCOMES_TABLE, 'profile', profile);
}

export async function getOutcome(id: string): Promise<OutcomeData | null> {  
  return await getData(OUTCOMES_TABLE, id);
}

export async function addOutcome(profile: string, category: string, amount: number, description: string, created_at?: Date, paid_by?: string, debtors?: string[]) {
  try {
    if (category === "") {
      console.log("No se pudo añadir debido a categoría faltante");
      return null;
    }

    const newOutcome: OutcomeData = { 
      profile, 
      amount, 
      category, 
      description, 
      created_at: created_at || new Date()
    };

    // Verificar si se ha alcanzado el límite y añadir el outcome en paralelo
    const [isWithinLimit, categoryData, outcomeData] = await Promise.all([
      checkCategoryLimit(category, amount),
      fetchCategories(profile),
      addData(OUTCOMES_TABLE, newOutcome)
    ]);

    if (!isWithinLimit) {
      if (!categoryData) throw new Error("No se encontraron categorías.");
      const categoryInfo = categoryData.find(cat => cat.id === category);
      const categoryName = categoryInfo ? categoryInfo.name : "Categoría desconocida";
      Alert.alert("¡Cuidado!", `Has alcanzado tu límite en ${categoryName}.`);
    }

    const operations = [
      updateBalance(profile, -amount),
      updateCategorySpent(category, amount)
    ];

    // Si es un gasto grupal, añadir las deudas correspondientes
    if (paid_by && debtors && debtors.length > 0) {
      const amountPerPerson = amount / (debtors.length + 1);
      const allUsers = [paid_by, ...debtors];
      const allAmounts = allUsers.map(() => amountPerPerson);

      operations.push(addSharedOutcome(allUsers, allAmounts).then(sharedOutcomeId => updateData(OUTCOMES_TABLE, 'shared_outcome', sharedOutcomeId, 'id', outcomeData.id)));
      operations.push(...debtors.map(debtor => addDebt(outcomeData.id, outcomeData.profile, paid_by, debtor, amountPerPerson)));
    }

    const results = await Promise.allSettled(operations);

    const failedOperations = results.filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && result.value === false));
    if (failedOperations.length > 0) {
      console.error("Error en una o más operaciones:", failedOperations);
      await removeOutcome(profile, outcomeData.id);
      return null;
    }

    return [outcomeData];
  } 
  catch (error) {
    console.error("Error inesperado añadiendo gasto:", error);
    return null;
  }
};

export async function addSharedOutcome(users: string[], toPay: number[]) {
  const hasPaid: boolean[] = users.map((_, index) => index === 0);
  const newSharedOutcome: SharedOutcomeData = { users: users, to_pay: toPay, has_paid: hasPaid };
  const data = await addData(SHARED_OUTCOMES_TABLE, newSharedOutcome);
  return data.id;
}

async function getSharedOutcome(id: string): Promise<SharedOutcomeData | null> {
  return await getData(SHARED_OUTCOMES_TABLE, id);
}

// In testing phase
async function removeSharedOutcomeDebts(profile: string, sharedOutcome: SharedOutcomeData) {
  const paidBy = sharedOutcome.users[0];
  const debtUpdatePromises = sharedOutcome.users.slice(1).map((debtor, index) => updateDebt(profile, paidBy, debtor, -sharedOutcome.to_pay[index + 1]));
  await Promise.all(debtUpdatePromises);
  await redistributeDebts(profile);
}

export async function removeOutcome(profile: string, id: string) {  
  try {
    const outcome = await getOutcome(id);
    
    if (!outcome) {
      console.error("Outcome not found:", id);
      return { error: "Outcome not found." };
    }

    const operations = [
      updateBalance(profile, outcome.amount),
      updateCategorySpent(outcome.category, -outcome.amount),
      removeData(OUTCOMES_TABLE, id)
    ];

    if (outcome.shared_outcome) {
      operations.push(getSharedOutcome(outcome.shared_outcome).then(sharedOutcomeData => 
          sharedOutcomeData ? removeSharedOutcomeDebts(profile, sharedOutcomeData) : Promise.resolve()
      ));
    }

    const results = await Promise.allSettled(operations);

    const failedOperations = results.filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && result.value === false));
    if (failedOperations.length > 0) {
      console.error("Error en una o más operaciones:", failedOperations);
      return null;
    }

    return results;
  }
  
  catch (error) {
    console.error("Unexpected error removing outcome:", error);
    return null;
  }
}

export async function fetchOutcomesByCategory(category: string): Promise<IncomeData[] | null> {
  try {
    const { data, error } = await supabase
      .from(OUTCOMES_TABLE)
      .select('*')
      .eq('category', category);

    if (error) {
      console.error("Error fetching outcomes by category:", error);
      return null;
    }

    return data;
  } 
  
  catch (error) {
    console.error("Unexpected error fetching outcomes by category:", error);
    return null;
  }
};



/* Categories */

export async function fetchCategories(profile: string): Promise<CategoryData[] | null> {
  return await fetchData(CATEGORIES_TABLE, 'profile', profile);
}

export async function getCategory(category: string): Promise<CategoryData | null> {
  return await getData(CATEGORIES_TABLE, category);
};

export async function getCategoryIdByName(profile: string, categoryName: string): Promise<string | null> {
  const categories = await fetchData(CATEGORIES_TABLE, 'profile', profile);
  if (!categories) return null;
  const category = categories.find(cat => cat.name === categoryName);
  return category ? category.id : null;
}

export async function addCategory(profile: string, name: string, color: string, icon: string, limit?: number): Promise<CategoryData | null> {
  const newCategory: CategoryData = { profile: profile, name: name, limit: limit, color: color, icon: icon };
  return await addData(CATEGORIES_TABLE, newCategory);
}

export async function removeCategory(category: string) {
  return await removeData(CATEGORIES_TABLE, category);
}

export async function getCategoryFromOutcome(outcome: string): Promise<CategoryData | null> {
  return await getValueFromData(OUTCOMES_TABLE, 'category', 'id', outcome);
}

async function getCategoryLimit(category: string): Promise<number | null> {
  return await getValueFromData(CATEGORIES_TABLE, 'limit', 'id', category);
}

async function getCategorySpent(category: string): Promise<number | null> {
  return await getValueFromData(CATEGORIES_TABLE, 'spent', 'id', category);
}

async function getCategoryIcon(category: string): Promise<string | null> {
  return await getValueFromData(CATEGORIES_TABLE, 'icon', 'id', category);
}

async function updateCategorySpent(category: string, added: number) {
  const currentSpent = await getCategorySpent(category);
  if (currentSpent !== null) return await updateData(CATEGORIES_TABLE, 'spent', currentSpent + added, 'id', category);
}

export async function checkCategoryLimit(category: string, amount: number): Promise<boolean> {
  const [limit, spent] = await Promise.all([
    getCategoryLimit(category),
    getCategorySpent(category)
  ]);
  if (limit == null || limit <= 0) return true;
  return ((spent ?? 0) + amount <= limit);
}



/* Profiles */

export async function fetchProfiles(user: string): Promise<ProfileData[] | null> {
  try {
    const profileIds = await getValueFromData(USERS_TABLE, 'my_profiles', 'email', user);
    
    if (!profileIds || !Array.isArray(profileIds)) {
      console.error("No profiles found or invalid data returned for user:", user);
      return null;
    }
    
    const { data: profiles, error } = await supabase
      .from(PROFILES_TABLE)
      .select('*')
      .in('id', profileIds);

    if (error) {
      console.error("Error fetching profiles:", error);
      return null;
    }

    return profiles;
  }

  catch (error) {
    console.error("Unexpected error in fetchProfiles:", error);
    return null;
  }
}

export async function getProfile(profileId: string): Promise<ProfileData | null> {
  return await getData(PROFILES_TABLE, profileId);
}

export async function getProfileName(profileId: string): Promise<string | null> {
  return await getValueFromData(PROFILES_TABLE, 'name', 'id', profileId);
}

export async function updateProfileName(profileId: string, newName: string) {
  return await updateData(PROFILES_TABLE, 'name', newName, 'id', profileId);
}

export async function addProfile(name: string, user: string): Promise<ProfileData | null> {
  try {
    const newProfile: ProfileData = { name, owner: user };
    const profile = await addData(PROFILES_TABLE, newProfile);

    const [{ error: userError }, { error: profileError }] = await Promise.all([
      supabase.rpc('append_to_my_profiles', { user_email: user, new_profile_id: profile.id }),
      supabase.rpc('append_user_to_profile', { profile_id: profile.id, new_user: user })
    ]);

    if (userError || profileError) {
      console.error("Failed to append new profile to user's my_profiles:", userError && profileError);
      await removeData(PROFILES_TABLE, profile.id);
      return null;
    }

    return profile;
  } 
  
  catch (error) {
    console.error("Unexpected error in addProfile:", error);
    return null;
  }
}

export async function removeProfile(profileId: string, email: string) {
  try {
    if(await isProfileShared(profileId)) return await removeSharedProfile(profileId, email);

    const [removedProfile, { error }] = await Promise.all([
      removeData(PROFILES_TABLE, profileId),
      supabase.rpc('remove_from_my_profiles', { profile_id_param: profileId })
    ]);

    if (error) {
      console.error("Error removing profile from user's my_profiles:", error);
      return null;
    }

    return removedProfile;
  } 
  
  catch (error) {
    console.error("Unexpected error in removeProfile:", error);
    return null;
  }
}

export async function addSharedUsers(profileId: string, emails: string[]) {
  try {
    // Verificar que todos los emails existan en la tabla users
    const { data: existingUsers, error: checkError } = await supabase
      .from(USERS_TABLE)
      .select('email')
      .in('email', emails);

    if (checkError) {
      console.error("Error al verificar usuarios existentes:", checkError);
      return;
    }

    const existingEmails = existingUsers.map(user => user.email);
    const invalidEmails = emails.filter(email => !existingEmails.includes(email));

    if (invalidEmails.length > 0) {
      console.error("Los siguientes emails no existen en la tabla users:", invalidEmails);
      return;
    }

    // Actualizar el perfil como compartido
    if (await isProfileShared(profileId) === false) {
      await updateData(PROFILES_TABLE, 'is_shared', true, 'id', profileId);
    }

    // Compartir el perfil con los usuarios verificados
    for (const email of existingEmails) {
      const { error: userError } = await supabase.rpc('append_to_my_profiles', { user_email: email, new_profile_id: profileId });
      if (userError) console.error(`Error al compartir el perfil con ${email}:`, userError);

      const { error: profileError } = await supabase.rpc('append_user_to_profile', { profile_id: profileId, new_user: email });
      if (profileError) console.error(`Error al añadir ${email} al perfil ${profileId}:`, profileError);
    }
  } 
  
  catch (error) {
    console.error("Error inesperado en addSharedUsers:", error);
  }
}

export async function removeSharedUsers(profileId: string, emails: string[]) {
  for (const email of emails) {
    const { error } = await supabase.rpc('remove_user_and_profile', { 
      profile_id: profileId, 
      user_email: email 
    });
    
    if (error) {
      console.error(`Failed to remove ${email} from profile ${profileId}:`, error);
    }
  }
}

export async function getSharedUsers(profileId: string): Promise<UserData[]> {
  const users = await getValueFromData(PROFILES_TABLE, 'users', 'id', profileId);
  if (!users) return [];
  
  const userDetails = await Promise.all(users.map(async (email: string) => {
    const name = await getValueFromData(USERS_TABLE, 'name', 'email', email);
    return { email, name: name || email };
  }));
  
  return userDetails;
}

export async function isProfileShared(profileId: string): Promise<boolean | null> {
  return await getValueFromData(PROFILES_TABLE, 'is_shared', 'id', profileId);
}



/* Balance */

export async function fetchBalance(profileId: string): Promise<number> {
  const balance = await getValueFromData(PROFILES_TABLE, 'balance', 'id', profileId);
  return balance !== null ? balance : 0;
}

async function updateBalance(profile: string, added: number): Promise<void | null> {
  try {
    // Calls atomic function to avoid the infamous race condition
    const { data, error } = await supabase.rpc('update_balance', { 
      profile_id: profile, 
      amount: added 
    });
    
    if (error) {
      console.error("Error updating balance:", error);
      return null;
    }
    
    return data;
  } 
  
  catch (error) {
    console.error("Unexpected error updating balance:", error);
    return null;
  }
}



/* User */

export async function signUp(email: string, password: string, name: string, surname: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password
    });

    if (error) {
      console.error("Error during sign up:", error);
      return { error };
    }

    const newUser: UserData = { email: email, name: name, surname: surname };
    await addData(USERS_TABLE, newUser);

    return { data };
  } 
  
  catch (error) {
    console.error("Unexpected error during sign up:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function logIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password });

    if (error) {
      console.error("Error during login:", error);
      return { error: "Invalid login credentials" };
    }

    const { user, session } = data;
    
    // Tomo el usuario de la tabla (si está)
    const userData = await getUser(user.email ?? "");

    // Modificación: Usar el token de sesión en lugar de user.id
    if (session && session.access_token) {
      const { data: authUser, error: authError } = await supabase.auth.getUser(session.access_token);

      if (authError) {
        console.error("Error fetching user from authentication:", authError);
        // Si hay un error de autenticación, asumimos que el email no está validado
        return { error: "Email not validated" };
      }
      
      // Si el usuario existe en la autenticación pero no en nuestra tabla de usuarios, significa que no validó el email
      if (!userData && authUser && (authUser.user.last_sign_in_at != null)) {
        console.error("Email not validated");
        return { error: "Email not validated" };
      }
    } 
    
    else {
      console.error("No valid session token found");
      return { error: "No valid session token found" };
    }

    await AsyncStorage.setItem('userSession', JSON.stringify(session));

    return { user, userData, session };
  } 
  
  catch (error) {
    console.error("Unexpected error during login:", error);
    return { error: "An unexpected error occurred." };
  }
}


export async function logOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error during logout:", error);
      return { error: "Failed to log out." };
    }

    await AsyncStorage.removeItem('userSession');

    return { success: true };
  } 

  catch (error) {
    console.error("Unexpected error during logout:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function getUser(email: string): Promise<UserData | null> {  
  return await getData(USERS_TABLE, email, 'email');
}

export async function getUsers(emails: string[]): Promise<{ names: Record<string, string>, avatars: Record<string, string> }> {
  try {
    const { data, error } = await supabase
      .from('Users')
      .select('email, name, surname, profile_picture_url')
      .in('email', emails);

    if (error) throw error;

    const names: Record<string, string> = {};
    const avatars: Record<string, string> = {};

    data.forEach(user => {
      names[user.email] = `${user.name} ${user.surname}`;
      avatars[user.email] = user.profile_picture_url;
    });

    return { names, avatars };
  } 
  
  catch (error) {
    console.error('Error fetching users:', error);
    return { names: {}, avatars: {} };
  }
}

export async function changeCurrentProfile(user: string, newProfileID: string) {
  return await updateData(USERS_TABLE, 'current_profile', newProfileID, 'email', user);
}

export async function fetchCurrentProfile(user: string) {
  return await getValueFromData(USERS_TABLE, 'current_profile', 'email', user);
}

export async function updateUserEmail(currentEmail: string, newEmail: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: authError } = await supabase.auth.updateUser({ email: newEmail });

    if (authError) {
      console.error("Error updating email in Auth:", authError);
      return { success: false, error: authError.message };
    }
    
    await updateData(USERS_TABLE, 'email', newEmail, 'email', currentEmail);

    return { success: true };
  } 
  
  catch (error) {
    console.error("Unexpected error updating email:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: undefined,
    });

    if (error) {
      console.error("Error requesting password reset:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error requesting password reset:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function verifyPasswordResetCode(email: string, token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery'
    });

    if (error) {
      console.error("Error verifying password reset code:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error verifying password reset code:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function updateUserPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      console.error("Error updating password:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } 
  
  catch (error) {
    console.error("Unexpected error updating password:", error);
    if (error instanceof AuthError) return { success: false, error: error.message };
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function updateUserName(email: string, newName: string) {
  return await updateData(USERS_TABLE, 'name', newName, 'email', email);
}

export async function updateUserSurname(email: string, newSuranme: string) {
  return await updateData(USERS_TABLE, 'surname', newSuranme, 'email', email);
}

export async function updateUserFullName(email: string, newName: string, newSurname: string) {
  updateUserName(email, newName);
  updateUserSurname(email, newSurname);
}

export async function getUserNames(emails: string[]): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('email, name')
      .in('email', emails);

    if (error) {
      console.error('Error fetching user names:', error);
      return {};
    }

    return data.reduce((acc, user) => {
      acc[user.email] = user.name || user.email;
      return acc;
    }, {} as Record<string, string>);
  } 
  
  catch (error) {
    console.error('Unexpected error fetching user names:', error);
    return {};
  }
}

export async function uploadProfilePicture(email: string, base64Image: string): Promise<string | null> {
  try {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    
    const fileName = `${email}_${Date.now()}.png`;
    const bucketName = 'profile_pictures';

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, decode(base64Data), {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error("Error uploading profile picture:", error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    await updateProfilePictureUrl(email, publicUrl);

    return publicUrl;
  } 
  
  catch (error) {
    console.error("Unexpected error uploading profile picture:", error);
    return null;
  }
}

async function updateProfilePictureUrl(email: string, profilePictureUrl: string) {
  return await updateData(USERS_TABLE, 'profile_picture_url', profilePictureUrl, 'email', email);
}

export async function getProfilePictureUrl(email: string) {
  return await getValueFromData(USERS_TABLE, 'profile_picture_url', 'email', email);
}

/* Stats */

export async function getIncomesFromDateRange(profile: string, start: Date, end: Date) {
  const startISO = start.toISOString();
  const endISO = end.toISOString();
  
  try {
    const { data, error } = await supabase
      .from(INCOMES_TABLE)
      .select()
      .eq('profile', profile)
      .gte('created_at', startISO)
      .lte('created_at', endISO);
    
    if (error) {
      console.error("Error fetching incomes from date range:", error);
      return { error: "Failed to fetch incomes." };
    }
    
    return data;
  } 
  
  catch (error) {
    console.error("Unexpected error fetching incomes from date range:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function getOutcomesFromDateRange(profile: string, start: Date, end: Date) {
  const startISO = start.toISOString();
  const endISO = end.toISOString();
  
  try {
    const { data, error } = await supabase
      .from(OUTCOMES_TABLE)
      .select()
      .eq('profile', profile)
      .gte('created_at', startISO)
      .lte('created_at', endISO);
    
    if (error) {
      console.error("Error fetching outcomes from date range:", error);
      return { error: "Failed to fetch outcomes." };
    }
    
    return data;
  } 
  
  catch (error) {
    console.error("Unexpected error fetching outcomes from date range:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function getOutcomesFromDateRangeAndCategory(profile: string, start: Date, end: Date, category: string) {
  const startISO = start.toISOString();
  const endISO = end.toISOString();
  
  try {
    const { data, error } = await supabase
      .from(OUTCOMES_TABLE)
      .select()
      .eq('profile', profile)
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .eq('category', category);
    
    if (error) {
      console.error("Error fetching outcomes from date range and category:", error);
      return { error: "Failed to fetch outcomes by category." };
    }
    
    return data;
  } 
  
  catch (error) {
    console.error("Unexpected error fetching outcomes from date range and category:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function getTotalToPayInDateRange(profileId: string, startDate: Date, endDate: Date): Promise<{ [key: string]: number }> {
  try {
    const { data: outcomes, error: outcomesError } = await supabase
      .from(OUTCOMES_TABLE)
      .select()
      .eq('profile', profileId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('shared_outcome', 'is', null);

    if (outcomesError) {
      console.error("Error fetching outcomes:", outcomesError);
      return {};
    }

    if (!outcomes || outcomes.length === 0) {
      return {};
    }

    const sharedOutcomeIds = outcomes.map(outcome => outcome.shared_outcome);
    const { data: sharedOutcomes, error: sharedError } = await supabase
      .from(SHARED_OUTCOMES_TABLE)
      .select('*')
      .in('id', sharedOutcomeIds);

    if (sharedError) {
      console.error("Error fetching shared outcomes:", sharedError);
      return {};
    }

    const totalToPay: { [key: string]: number } = {};
    sharedOutcomes.forEach(sharedOutcome => {
      sharedOutcome.users.forEach((user: string, index: number) => {
        if (!totalToPay[user]) {
          totalToPay[user] = 0;
        }
        totalToPay[user] += sharedOutcome.to_pay[index];
      });
    });

    return totalToPay;
  } 
  
  catch (error) {
    console.error("Unexpected error in getTotalToPayInDateRange:", error);
    return {};
  }
}

export async function getTotalToPayForUserInDateRange(userEmail: string, profileId: string, startDate: Date, endDate: Date): Promise<number> {
  try {
    const allTotalsToPay = await getTotalToPayInDateRange(profileId, startDate, endDate);
    return allTotalsToPay[userEmail] || 0;
  } 
  catch (error) {
    console.error("Error in getTotalToPayForUserInDateRange:", error);
    return 0;
  }
}



/* Shared Profiles */

export async function generateInvitationLink(profile: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('invitationLink')
      .insert({ profile: profile })
      .select()
      .single();

    if (error) {
      console.error("Error generating invitation link:", error);
      return null;
    }

    // Uses the configured base URL
    return createURL(`/(tabs)/profiles?invitationId=${data.id}`);
  } 
  
  catch (error) {
    console.error("Unexpected error generating invitation link:", error);
    return null;
  }
}

export async function processInvitation(invitationId: string, email: string): Promise<string | null> {
  try {
    // Obtener la invitación
    const { data: invitation, error: invitationError } = await supabase
      .from('invitationLink')
      .select('profile')
      .eq('id', invitationId)
      .single();

    if (invitationError || !invitation) {
      console.error("Error obteniendo la invitación:", invitationError);
      return null;
    }

    // Verificar si el usuario ya tiene este perfil
    const { data: existingProfile, error: profileError } = await supabase
      .from(USERS_TABLE)
      .select('my_profiles')
      .eq('email', email)
      .single();

    if (profileError) {
      console.error("Error obteniendo perfiles existentes:", profileError);
      return null;
    }

    if (existingProfile && existingProfile.my_profiles.includes(invitation.profile)) {
      console.error("El perfil ya existe para este usuario");
      return invitation.profile; // Devolvemos el ID del perfil aunque ya exista
    }

    // Añadir el usuario al perfil compartido
    await addSharedUsers(invitation.profile, [email]);

    // Delete the invitation after using it
    // Delete the invitation from the database after using it
    // await supabase
    //   .from('invitationLink')
    //   .delete()
    //   .eq('id', invitationId);

    return invitation.profile; // Devolvemos el ID del perfil añadido
  } 
  
  catch (error) {
    console.error("Error inesperado procesando la invitación:", error);
    return null;
  }
}



/* Debts */

export async function getDebt(profileId: string, paidBy: string, debtor: string): Promise<DebtData | null> {
  try {
    const { data, error } = await supabase
      .from(DEBTS_TABLE)
      .select('*')
      .eq('profile', profileId)
      .eq('paid_by', paidBy)
      .eq('debtor', debtor)
      .single();

    if (error) {
      console.error("Error fetching debt:", error);
      return null;
    }

    return data;
  } 
  
  catch (error) {
    console.error("Unexpected error fetching debt:", error);
    return null;
  }
}

export async function getDebtsFromProfile(profileId: string): Promise<DebtData[] | null> {
  try {
    const { data, error } = await supabase
      .from(DEBTS_TABLE)
      .select('*')
      .eq('profile', profileId)

    if (error) {
      console.error("Error fetching debts:", error);
      return null;
    }

    return data;
  } 
  
  catch (error) {
    console.error("Unexpected error fetching debts:", error);
    return null;
  }
}

export async function getDebtsToUser(debtor: string, profileId: string): Promise<DebtData[] | null> {
  try {
    const { data, error } = await supabase
      .from(DEBTS_TABLE)
      .select('*')
      .eq('paid_by', debtor)
      .eq('profile', profileId)
      .eq('has_paid', false);
    
    if (error) {
      console.error("Error fetching debts to user:", error);
      return null;
    }

    return data;
  } 
  
  catch (error) {
    console.error("Unexpected error fetching debts to user:", error);
    return null;
  }
}

export async function getDebtsFromUser(debtor: string, profileId: string): Promise<DebtData[] | null> {
  try {
    const { data, error } = await supabase
      .from(DEBTS_TABLE)
      .select('*')
      .eq('debtor', debtor)
      .eq('profile', profileId)
      .eq('has_paid', false);

    if (error) {
      console.error("Error fetching debts from user:", error);
      return null;
    }

    return data;
  } 
  
  catch (error) {
    console.error("Unexpected error fetching debts from user:", error);
    return null;
  }
}

export async function removeSharedProfile(profileId: string, email: string) {
  const profile = await getProfile(profileId);
  
  if (!profile) {
    console.error("Profile not found:", profileId);
    return false;
  }

  const usersToRemove = profile.owner === email ? (profile.users ?? []) : [email];
  
  const operations = [removeSharedUsers(profileId, usersToRemove)];
  
  if (profile.owner === email) operations.push(removeData(PROFILES_TABLE, profileId));

  try {
    await Promise.all(operations);
    return true;
  } 
  
  catch (error) {
    console.error("Error removing shared profile:", error);
    return false;
  }
}

export async function redistributeDebts(profileId: string): Promise<boolean> {
  try {
    // Obtener todas las deudas del perfil
    const { data: debts, error: debtsError } = await supabase
      .from(DEBTS_TABLE)
      .select('*')
      .eq('profile', profileId)
      .eq('has_paid', false);

    if (debtsError) {
      console.error("Error fetching debts:", debtsError);
      return false;
    }

    // Crear un mapa de deudas netas
    const netDebts = new Map<string, Map<string, number>>();

    // Calcular deudas netas
    for (const debt of debts) {
      if (!netDebts.has(debt.paid_by)) {
        netDebts.set(debt.paid_by, new Map<string, number>());
      }
      if (!netDebts.has(debt.debtor)) {
        netDebts.set(debt.debtor, new Map<string, number>());
      }

      const paidByDebts = netDebts.get(debt.paid_by)!;
      paidByDebts.set(debt.debtor, (paidByDebts.get(debt.debtor) || 0) + debt.amount);
    }

    // Redistribuir deudas
    let cambios = true;
    while (cambios) {
      cambios = false;
      Array.from(netDebts.entries()).forEach(([acreedor, deudores]) => {
        Array.from(deudores.entries()).forEach(([deudor, cantidad]) => {
          const deudasDeudor = netDebts.get(deudor);
          if (deudasDeudor) {
            Array.from(deudasDeudor.entries()).forEach(([tercero, cantidadTercero]) => {
              if (tercero !== acreedor) {
                const cantidadTransferir = Math.min(cantidad, cantidadTercero);
                if (cantidadTransferir > 0) {
                  deudores.set(deudor, cantidad - cantidadTransferir);
                  if (deudores.get(deudor) === 0) deudores.delete(deudor);
                  deudasDeudor.set(tercero, cantidadTercero - cantidadTransferir);
                  if (deudasDeudor.get(tercero) === 0) deudasDeudor.delete(tercero);
                  deudores.set(tercero, (deudores.get(tercero) || 0) + cantidadTransferir);
                  cambios = true;
                }
              }
            });
          }
        });
      });
    }

    // Aplicar las deudas redistribuidas
    await removeAllDebts(profileId);
    await Promise.all(Array.from(netDebts.entries()).map(async ([acreedor, deudores]) => {
      await Promise.all(Array.from(deudores.entries()).map(async ([deudor, cantidad]) => {
        if (cantidad > 0) {
          await updateDebt(profileId, acreedor, deudor, cantidad);
        }
      }));
    }));

    return true;
  } 
  
  catch (error) {
    console.error("Unexpected error redistributing debts:", error);
    return false;
  }
}

async function removeAllDebts(profileId: string): Promise<void> {
  await supabase
    .from(DEBTS_TABLE)
    .delete()
    .eq('profile', profileId)
    .eq('has_paid', false);
}

async function updateDebt(profileId: string, paidBy: string, debtor: string, amount: number): Promise<void> {
  const { data: existingDebt, error: debtError } = await supabase
    .from(DEBTS_TABLE)
    .select('*')
    .eq('profile', profileId)
    .eq('paid_by', paidBy)
    .eq('debtor', debtor)
    .eq('has_paid', false)
    .single();

  if (debtError && debtError.code !== 'PGRST116') {
    console.error("Error checking existing debt:", debtError);
    return;
  }

  if (existingDebt) {
    await supabase
      .from(DEBTS_TABLE)
      .update({ amount: amount })
      .eq('profile', existingDebt.profile)
      .eq('paid_by', paidBy)
      .eq('debtor', debtor);
  } 
  
  else {
    await supabase.from(DEBTS_TABLE).insert({
      profile: profileId,
      paid_by: paidBy,
      debtor: debtor,
      amount: amount,
      has_paid: false
    });
  }
}

async function removeDebt(profileId: string, paidBy: string, debtor: string): Promise<void> {
  await supabase
    .from(DEBTS_TABLE)
    .delete()
    .eq('profile', profileId)
    .eq('paid_by', paidBy)
    .eq('debtor', debtor)
    .eq('has_paid', false);
}

export async function addDebt(outcomeId: string, profileId: string, paidBy: string, debtor: string, amount: number): Promise<boolean> {
  try {
    const { data: existingDebt, error: existingDebtError } = await supabase
      .from(DEBTS_TABLE)
      .select('*')
      .eq('profile', profileId)
      .eq('paid_by', paidBy)
      .eq('debtor', debtor)
      .eq('has_paid', false)
      .single();

    if (existingDebtError && existingDebtError.code !== 'PGRST116') {
      console.error("Error comprobando deuda existente:", existingDebtError);
      return false;
    }

    if (existingDebt) {
      const newAmount = existingDebt.amount + amount;
      const { error: updateError } = await supabase
        .from(DEBTS_TABLE)
        .update({ amount: newAmount })
        .eq('profile', profileId)
        .eq('paid_by', paidBy)
        .eq('debtor', debtor);

      if (updateError) {
        console.error("Error actualizando deuda existente:", updateError);
        return false;
      }
    } 
    
    else {
      const { error: insertError } = await supabase
        .from(DEBTS_TABLE)
        .insert({
          profile: profileId,
          paid_by: paidBy,
          debtor: debtor,
          amount: amount,
          has_paid: false
        });

      if (insertError) {
        console.error("Error insertando nueva deuda:", insertError);
        removeOutcome(profileId, outcomeId);
        return false;
      }
    }
    return true;
  } 
  
  catch (error) {
    console.error("Error inesperado añadiendo deuda:", error);
    return false;
  }
}

export async function markAsPaid(profile: string, whoPaid: string, outcomeId: string, paid: boolean): Promise<boolean> {
  const outcome = await getData(OUTCOMES_TABLE, outcomeId);
  const sharedOutcome = await getData(SHARED_OUTCOMES_TABLE, outcome.shared_outcome);

  const userIndex = sharedOutcome.users.indexOf(whoPaid);
  if (userIndex === -1) {
    console.error("User not found in shared outcome:", whoPaid);
    return false;
  }

  const newHasPaid = [...sharedOutcome.has_paid];
  newHasPaid[userIndex] = paid;

  await updateData(SHARED_OUTCOMES_TABLE, 'has_paid', newHasPaid, 'id', outcome.shared_outcome);

  const paidBy = sharedOutcome.users[0];

  const { data: debtData, error: debtError } = await supabase
    .from('Debts')
    .select('*')
    .eq('profile', profile)
    .eq('debtor', whoPaid)
    .eq('paid_by', paidBy)
    .single();

  if (debtError) {
    console.error("Error fetching debt:", debtError);
    return false;
  }

  if (debtData) {
    const newAmount = paid ? debtData.amount - outcome.amount : debtData.amount + outcome.amount;
    await updateDebt(profile, paidBy, whoPaid, newAmount);
  }

  return true;
}



/* División de Cuenta */

export async function createBill(total: number, participants: string[]): Promise<boolean> {
  try {
    // Insertar el total en la tabla Bills
    const { data: billData, error: billError } = await supabase
      .from(BILLS_TABLE)
      .insert({ total: total })
      .select()
      .single();

    if (billError) {
      console.error("Error al crear la factura:", billError);
      return false;
    }

    const billId = billData.id;

    // Añadir cada participante a la factura
    for (const participant of participants) {
      const success = await addParticipantToBill(billId, participant);
      if (!success) {
        console.error("Error al añadir participante:", participant);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error inesperado al crear la factura:", error);
    return false;
  }
}

export async function addParticipantToBill(billId: string, participant: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('BillParticipantes')
      .insert({ id: billId, email: participant })
      .select()
      .single();

    if (error) {
      console.error("Error al añadir participante a la factura:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error inesperado al añadir participante a la factura:", error);
    return false;
  }
}

export async function addOutcomeToBill(billId: string, participant: string, amount: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('BillParticipants')
      .update({ amount_spent: amount })
      .eq('bill', billId)
      .eq('email', participant)
      .select()
      .single();

    if (error) {
      console.error("Error al agregar gasto a la factura:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error inesperado al agregar gasto a la factura:", error);
    return false;
  }
}

export async function deleteOutcomeToBill(billId: string, participant: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('BillParticipants')
      .update({ amount_spent: null })
      .eq('bill', billId)
      .eq('email', participant)
      .select()
      .single();

    if (error) {
      console.error("Error al eliminar gasto de la factura:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error inesperado al eliminar gasto de la factura:", error);
    return false;
  }
}


export async function addIncomeToBill(billId: string, participant: string, amount: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('BillParticipants')
      .update({ amount_paid: amount })
      .eq('bill', billId)
      .eq('email', participant)
      .select()
      .single();

    if (error) {
      console.error("Error al agregar pago a la factura:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error inesperado al agregar pago a la factura:", error);
    return false;
  }

}

export async function deleteIncomeToBill(billId: string, participant: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('BillParticipants')
      .update({ amount_paid: null })
      .eq('bill', billId)
      .eq('email', participant)
      .select()
      .single();

    if (error) {
      console.error("Error al eliminar pago de la factura:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error inesperado al eliminar pago de la factura:", error);
    return false;
  }
}



export async function calculateDebts(billId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('BillParticipants')
      .select('email, amount_spent, amount_paid')
      .eq('bill', billId);

    if (error) {
      console.error("Error al obtener los datos de los participantes de la factura:", error);
      return false;
    }

    if (!data || data.length === 0) {
      console.error("No se encontraron participantes para esta factura");
      return false;
    }

    let totalSpent = 0;
    const participants = data.map(participant => {
      totalSpent += participant.amount_spent || 0;
      return {
        email: participant.email,
        spent: participant.amount_spent || 0,
        paid: participant.amount_paid || 0
      };
    });

    const averageSpent = totalSpent / participants.length;

    const debts: { debtor: string; creditor: string; amount: number }[] = [];
    participants.forEach(debtor => {
      participants.forEach(creditor => {
        if (debtor.email !== creditor.email) {
          const debtorBalance = debtor.paid - averageSpent;
          const creditorBalance = creditor.paid - averageSpent;
          
          if (debtorBalance < 0 && creditorBalance > 0) {
            const debtAmount = Math.min(Math.abs(debtorBalance), creditorBalance);
            debts.push({
              debtor: debtor.email,
              creditor: creditor.email,
              amount: Number(debtAmount.toFixed(2))
            });
          }
        }
      });
    });

    for (const debt of debts) {
      const { error: insertError } = await supabase
        .from('BillDebts')
        .insert({
          bill: billId,
          debtor: debt.debtor,
          creditor: debt.creditor,
          amount: debt.amount
        });

      if (insertError) {
        console.error("Error al insertar la deuda en BillDebts:", insertError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error inesperado al calcular e insertar las deudas:", error);
    return false;
  }
}

export async function getBillDebts(billId: string) {
  try {
    const { data: debts, error } = await supabase
      .from('BillDebts')
      .select('*')
      .eq('bill', billId);

    if (error) {
      console.error("Error al obtener las deudas de la factura:", error);
      return null;
    }

    return debts;
  } catch (error) {
    console.error("Error inesperado al obtener las deudas de la factura:", error);
    return null;
  }
}

export async function getUserName(email: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('name')
      .eq('email', email)
      .single();

    if (error) {
      console.error("Error fetching name from Users:", error);
      return email;
    }

    return data?.name || email;
  } catch (error) {
    console.error("Unexpected error fetching user name:", error);
    return email;
  }
}

export async function getSharedOutcomeWithNames(id: string): Promise<SharedOutcomeData | null> {
  const sharedOutcome = await getSharedOutcome(id);
  if (sharedOutcome) {
    const userNames = await Promise.all(sharedOutcome.users.map(getUserName));
    return {
      ...sharedOutcome,
      userNames
    };
  }
  return null;
}

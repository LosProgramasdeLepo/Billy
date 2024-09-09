import { supabase } from '../lib/supabase';
import { Timestamp } from 'react-native-reanimated/lib/typescript/reanimated2/commonTypes';

export interface UserData {
  email: string;
  password: string;
  name: string;
  surname: string;
}

export interface IncomeData {
  id?: number;
  profile: string;
  amount: number;
  description: string;
  created_at?: Timestamp;
}

export interface ExpenseData {
  id? : number;
  profile: string;
  category: string; 
  amount: number;
  description: string;
  created_at?: Timestamp;
}

export interface CategoryData {
  name: string;
  profile: string;
  limit?: number;
  created_at?: Timestamp;
}

export interface ProfileData {
  name: string;
  balance?: number;
  created_at?: Timestamp;
}

export async function getProfileID(profileName: string) {
  const { data } = await supabase
  .from('Profiles')
  .select()
  .match({profileName});
return data;
}

/* Incomes */

export async function fetchIncomes(profile: string) {
  // Recupero información
  const { data } = await supabase
    .from('Incomes')
    .select()
    .match({profile});
  return data;
};

export async function getIncome(id: number | undefined, profile: string) {
  // Recupero información
  const { data } = await supabase
    .from('Incomes')
    .select('*')
    .match({id, profile});
  return data;
};

export async function addIncome(profile: string, amount: number, description: string) : Promise<IncomeData[] | null> {
  const newIncome: IncomeData = {
    profile: profile,
    amount: amount,
    description: description
  };
  // Inserto información  
  const { data } = await supabase
    .from('Incomes')
    .insert(newIncome)
  updateBalance(amount, profile);
  return data;
};

export async function removeIncome(id: number | undefined, profile: string) {
    // Borro información
    await supabase
      .from('Incomes')
      .delete()
      .match({id, profile});
}



/* Expenses */

export async function fetchExpenses(profile: string) {
  // Recupero información
  const { data } = await supabase
    .from('Expenses')
    .select('*')
    .match({profile});
  return data;
};

export async function getExpense(id: number | undefined, profile: string) {
  // Recupero información
  const { data } = await supabase
    .from('Expenses')
    .select()
    .match({id, profile});
  return data;
};

export async function addExpense(profile: string, amount: number, category: string, description: string) {
  const newExpense: ExpenseData = {
    profile: profile,
    amount: amount,
    category: category,
    description: description
  };
  // Inserto información
  const { data } = await supabase
    .from('Expenses')
    .insert(newExpense);
  updateBalance(-amount, profile);
  return data;
};

export async function removeExpense(id: number | undefined, profile: string) {
  // Borro información
  await supabase
    .from('Expenses')
    .delete()
    .match({id, profile});
}



/* Categories */

export async function fetchCategories(profile: string) {
  // Recupero información
  const { data } = await supabase
    .from('Categories')
    .select('*')
    .match({profile});
  return data;
};

export async function getCategories(name: string | undefined, profile: string) {
  // Recupero información
  const { data } = await supabase
    .from('Categories')
    .select()
    .match({name, profile});
  return data;
};

export async function addCategory(profile: string, name: string, limit?: number) {
  const newCategory: CategoryData = {
    profile: profile,
    name: name,
    limit: limit
  };
  // Inserto información
  const { data } = await supabase
    .from('Categories')
    .insert(newCategory);
  return data;
};

export async function removeCategory(name: string | undefined, profile: string) {
    // Borro información
    await supabase
      .from('Categories')
      .delete()
      .match({name, profile});
}

/* Profiles */

export async function fetchProfiles() {
  // Recupero información
  const { data } = await supabase
    .from('Profiles')
    .select('*');
  return data;
};

export async function getProfile(name: string | undefined): Promise<string[] | null> {
  // Recupero información
  const { data } = await supabase
    .from('Profiles')
    .select()
    .eq('name', name)
  return data;
};

export async function addProfile(name: string) {
  const newProfile: ProfileData = {
    name: name,
  };
  // Inserto información
  const { data } = await supabase
    .from('Profiles')
    .insert(newProfile);
  return data;
};

export async function removeProfile(name: string | undefined) {
    // Borro información
    await supabase
      .from('Profiles')
      .delete()
      .match({name});
}



/* Balance */

export async function getBalance(profile: string): Promise<number> {
  const { data, error } = await supabase
    .from('Profiles')
    .select('balance')
    .eq('id', profile)
    .single();
  return data?.balance ?? 0;
}

// Update the balance for a given profile
async function putBalance(profile: string, newBalance: number) {
  const { data } = await supabase
    .from('Profiles')
    .update({balance: newBalance})
    .match({name: profile}); 
  return data;
}

// Update the balance based on an added or subtracted value
async function updateBalance(added: number, profile: string) {
  var currentBalance = await getBalance(profile);
  const newBalance = currentBalance + added;
  await putBalance(profile, newBalance);
}



/* User */

// Agregar usuario
export async function addUser(email: string, password: string, name: string, surname: string) {
  const newUser: UserData = {
    email: email,
    password: password,
    name: name,
    surname: surname,
  };
  const { data, error } = await supabase
    .from('Users')
    .insert(newUser);

  if (error) {
    console.error('Error adding user:', error);
    return null;
  }
  return data;
}

//Sign Up
export async function signUp(email: string, password: string, name: string, surname: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password
  });
  if (error) {
    console.log(error);
    return error;
  } else {
    const { user, session } = data;
    await addUser(email, password, name, surname);
    return user;
  }
}

//Login 
export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    console.log(error);
    return error;
  } else {
    const { user, session } = data;
    return user;
  }
}
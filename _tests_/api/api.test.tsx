import { logIn, updateBalance, fetchBalance, getProfile, getValueFromData, fetchData, getData, addIncome, addData, removeData, updateData, getUser } from '@/api/api';
export * from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import * as apiModule from '@/api/api';

jest.mock('@/lib/supabase', () => {
    const mockSupabase = {
        auth: {
            signUp: jest.fn(),
            signInWithPassword: jest.fn(),
            signOut: jest.fn(),
            getUser: jest.fn(),
        },
        from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
        }),
        rpc: jest.fn(),
    };
  
    return { supabase: mockSupabase };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
}));

jest.mock('@/api/api', () => ({
    ...jest.requireActual('@/api/api'),
    getUser: jest.fn(),
}));

describe('fetchData', () => {
    const mockTable = 'TestTable';
    const mockColumn = 'testColumn';
    const mockParentID = 'testID';
  
    beforeEach(() => {
        jest.clearAllMocks();
    });
  
    it('should return data when fetch is successful', async () => {
        const mockData = [{ id: 1, name: 'Test' }];
        const mockSelect = jest.fn().mockReturnThis();
        const mockEq = jest.fn().mockResolvedValue({ data: mockData, error: null });
  
        (supabase.from as jest.Mock).mockReturnValue({
            select: mockSelect,
            eq: mockEq,
        });
    
        const result = await fetchData(mockTable, mockColumn, mockParentID);
    
        expect(supabase.from).toHaveBeenCalledWith(mockTable);

        expect(mockSelect).toHaveBeenCalledWith('*');

        expect(mockEq).toHaveBeenCalledWith(mockColumn, mockParentID);

        expect(result).toEqual(mockData);
    });
  
    it('should return null when there is an error', async () => {
        const mockError = new Error('Test error');
        const mockSelect = jest.fn().mockReturnThis();
        const mockEq = jest.fn().mockResolvedValue({ data: null, error: mockError });
    
        (supabase.from as jest.Mock).mockReturnValue({
            select: mockSelect,
            eq: mockEq,
        });
  
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
        const result = await fetchData(mockTable, mockColumn, mockParentID);
    
        expect(supabase.from).toHaveBeenCalledWith(mockTable);

        expect(mockSelect).toHaveBeenCalledWith('*');

        expect(mockEq).toHaveBeenCalledWith(mockColumn, mockParentID);

        expect(result).toBeNull();

        expect(consoleSpy).toHaveBeenCalledWith(`Error fetching data from ${mockTable}:`, mockError);
    
        consoleSpy.mockRestore();
    });
});

describe('getData', () => {
    const mockTable = 'TestTable';
    const mockId = 'testId';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return data when fetch is successful', async () => {
        const mockData = { id: mockId, name: 'Test' };
        const mockSelect = jest.fn().mockReturnThis();
        const mockEq = jest.fn().mockReturnThis();
        const mockSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });

        (supabase.from as jest.Mock).mockReturnValue({
            select: mockSelect,
            eq: mockEq,
            single: mockSingle,
        });

        const result = await getData(mockTable, mockId);

        expect(supabase.from).toHaveBeenCalledWith(mockTable);

        expect(mockSelect).toHaveBeenCalledWith('*');

        expect(mockEq).toHaveBeenCalledWith('id', mockId);

        expect(mockSingle).toHaveBeenCalled();

        expect(result).toEqual(mockData);
    });

    it('should use custom columnToCheck when provided', async () => {
        const mockColumnToCheck = 'customColumn';
        const mockData = { [mockColumnToCheck]: mockId, name: 'Test' };
        const mockSelect = jest.fn().mockReturnThis();
        const mockEq = jest.fn().mockReturnThis();
        const mockSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });

        (supabase.from as jest.Mock).mockReturnValue({
            select: mockSelect,
            eq: mockEq,
            single: mockSingle,
        });

        const result = await getData(mockTable, mockId, mockColumnToCheck);

        expect(mockEq).toHaveBeenCalledWith(mockColumnToCheck, mockId);

        expect(result).toEqual(mockData);
    });

    it('should return null when there is an error', async () => {
        const mockError = new Error('Test error');
        const mockSelect = jest.fn().mockReturnThis();
        const mockEq = jest.fn().mockReturnThis();
        const mockSingle = jest.fn().mockResolvedValue({ data: null, error: mockError });

        (supabase.from as jest.Mock).mockReturnValue({
            select: mockSelect,
            eq: mockEq,
            single: mockSingle,
        });

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const result = await getData(mockTable, mockId);

        expect(result).toBeNull();

        expect(consoleSpy).toHaveBeenCalledWith(`Error getting ${mockTable.slice(0, -1)}:`, mockError);

        consoleSpy.mockRestore();
    });
});

describe('addData', () => {
    const mockTable = 'TestTable';
    const mockNewData = { name: 'Test Item', value: 42 };
  
    beforeEach(() => {
        jest.clearAllMocks();
    });
  
    it('should add data successfully', async () => {
        const mockInsertedData = { id: '1', ...mockNewData };
        const mockInsert = jest.fn().mockReturnThis();
        const mockSelect = jest.fn().mockReturnThis();
        const mockSingle = jest.fn().mockResolvedValue({ data: mockInsertedData, error: null });
    
        (supabase.from as jest.Mock).mockReturnValue({
            insert: mockInsert,
            select: mockSelect,
            single: mockSingle,
        });
    
        const result = await addData(mockTable, mockNewData);
    
        expect(supabase.from).toHaveBeenCalledWith(mockTable);

        expect(mockInsert).toHaveBeenCalledWith(mockNewData);

        expect(mockSelect).toHaveBeenCalled();

        expect(mockSingle).toHaveBeenCalled();

        expect(result).toEqual(mockInsertedData);
    });
  
    it('should return null and log error if insert fails', async () => {
        const mockError = new Error('Insert failed');
        const mockInsert = jest.fn().mockReturnThis();
        const mockSelect = jest.fn().mockReturnThis();
        const mockSingle = jest.fn().mockResolvedValue({ data: null, error: mockError });
    
        (supabase.from as jest.Mock).mockReturnValue({
            insert: mockInsert,
            select: mockSelect,
            single: mockSingle,
        });
    
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
        const result = await addData(mockTable, mockNewData);
    
        expect(result).toBeNull();

        expect(consoleSpy).toHaveBeenCalledWith(`Error adding data to ${mockTable}:`, mockError);
    
        consoleSpy.mockRestore();
    });
});

describe('removeData', () => {
    const mockTable = 'TestTable';
    const mockId = 'test-id-123';
  
    beforeEach(() => {
        jest.clearAllMocks();
    });
  
    it('should remove data successfully', async () => {
        const mockRemovedData = { id: mockId, name: 'Removed Item' };
        const mockDelete = jest.fn().mockReturnThis();
        const mockEq = jest.fn().mockReturnThis();
        const mockSelect = jest.fn().mockReturnThis();
        const mockSingle = jest.fn().mockResolvedValue({ data: mockRemovedData, error: null });
    
        (supabase.from as jest.Mock).mockReturnValue({
            delete: mockDelete,
            eq: mockEq,
            select: mockSelect,
            single: mockSingle,
        });
    
        const result = await removeData(mockTable, mockId);
    
        expect(supabase.from).toHaveBeenCalledWith(mockTable);

        expect(mockDelete).toHaveBeenCalled();

        expect(mockEq).toHaveBeenCalledWith('id', mockId);

        expect(mockSelect).toHaveBeenCalled();

        expect(mockSingle).toHaveBeenCalled();

        expect(result).toEqual(mockRemovedData);
    });
  
    it('should return null and log error if delete fails', async () => {
        const mockError = new Error('Delete failed');
        const mockDelete = jest.fn().mockReturnThis();
        const mockEq = jest.fn().mockReturnThis();
        const mockSelect = jest.fn().mockReturnThis();
        const mockSingle = jest.fn().mockResolvedValue({ data: null, error: mockError });
    
        (supabase.from as jest.Mock).mockReturnValue({
            delete: mockDelete,
            eq: mockEq,
            select: mockSelect,
            single: mockSingle,
        });
    
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
        const result = await removeData(mockTable, mockId);
    
        expect(result).toBeNull();

        expect(consoleSpy).toHaveBeenCalledWith("Error removing item:", mockError);
    
        consoleSpy.mockRestore();
    });
});

describe('updateData', () => {
    const mockTable = 'TestTable';
    const mockColumnToUpdate = 'name';
    const mockUpdateValue = 'New Name';
    const mockColumnToCheck = 'id';
    const mockId = 'test-id-123';
  
    beforeEach(() => {
        jest.clearAllMocks();
    });
  
    it('should update data successfully', async () => {
        const mockUpdatedData = { id: mockId, name: mockUpdateValue };
        const mockUpdateFn = jest.fn().mockReturnThis();
        const mockEq = jest.fn().mockReturnThis();
        const mockSingle = jest.fn().mockResolvedValue({ data: mockUpdatedData, error: null });
    
        (supabase.from as jest.Mock).mockReturnValue({
            update: mockUpdateFn,
            eq: mockEq,
            single: mockSingle,
        });
    
        const result = await updateData(mockTable, mockColumnToUpdate, mockUpdateValue, mockColumnToCheck, mockId);
    
        expect(supabase.from).toHaveBeenCalledWith(mockTable);

        expect(mockUpdateFn).toHaveBeenCalledWith({ [mockColumnToUpdate]: mockUpdateValue });

        expect(mockEq).toHaveBeenCalledWith(mockColumnToCheck, mockId);

        expect(mockSingle).toHaveBeenCalled();
        
        expect(result).toEqual(mockUpdatedData);
    });
  
    it('should return null and log error if update fails', async () => {
      const mockError = new Error('Update failed');
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: mockError });
  
      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        single: mockSingle,
      });
  
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  
      const result = await updateData(mockTable, mockColumnToUpdate, mockUpdate, mockColumnToCheck, mockId);
  
      expect(result).toBeNull();

      expect(consoleSpy).toHaveBeenCalledWith(
        `Error updating ${mockColumnToUpdate} in ${mockTable} for ${mockColumnToCheck} = ${mockId}:`,
        mockError
      );
  
      consoleSpy.mockRestore();
    });
});

describe('getValueFromData', () => {
    const mockTable = 'TestTable';
    const mockColumnToReturn = 'testColumn';
    const mockColumnToCheck = 'id';
    const mockId = 'testId';
  
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it('should return the value when fetch is successful', async () => {
        const mockData = { [mockColumnToReturn]: 'testValue' };
        const mockSelect = jest.fn().mockReturnThis();
        const mockEq = jest.fn().mockReturnThis();
        const mockSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
    
        (supabase.from as jest.Mock).mockReturnValue({
            select: mockSelect,
            eq: mockEq,
            single: mockSingle,
        });
    
        const result = await getValueFromData(mockTable, mockColumnToReturn, mockColumnToCheck, mockId);
    
        expect(supabase.from).toHaveBeenCalledWith(mockTable);

        expect(mockSelect).toHaveBeenCalledWith(mockColumnToReturn);

        expect(mockEq).toHaveBeenCalledWith(mockColumnToCheck, mockId);

        expect(mockSingle).toHaveBeenCalled();

        expect(result).toBe('testValue');
    });
  
    it('should return null when no data is found (PGRST116 error)', async () => {
        const mockError = { code: 'PGRST116', message: 'No data found' };
        const mockSelect = jest.fn().mockReturnThis();
        const mockEq = jest.fn().mockReturnThis();
        const mockSingle = jest.fn().mockResolvedValue({ data: null, error: mockError });
    
        (supabase.from as jest.Mock).mockReturnValue({
            select: mockSelect,
            eq: mockEq,
            single: mockSingle,
        });
    
        const result = await getValueFromData(mockTable, mockColumnToReturn, mockColumnToCheck, mockId);
    
        expect(result).toBeNull();
    });
  
    it('should return null when data is null', async () => {
        const mockSelect = jest.fn().mockReturnThis();
        const mockEq = jest.fn().mockReturnThis();
        const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    
        (supabase.from as jest.Mock).mockReturnValue({
            select: mockSelect,
            eq: mockEq,
            single: mockSingle,
        });
    
        const result = await getValueFromData(mockTable, mockColumnToReturn, mockColumnToCheck, mockId);
    
        expect(result).toBeNull();
    });
  
    it('should return null when the specified column is not in the returned data', async () => {
        const mockData = { otherColumn: 'testValue' };
        const mockSelect = jest.fn().mockReturnThis();
        const mockEq = jest.fn().mockReturnThis();
        const mockSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
    
        (supabase.from as jest.Mock).mockReturnValue({
            select: mockSelect,
            eq: mockEq,
            single: mockSingle,
        });
    
        const result = await getValueFromData(mockTable, mockColumnToReturn, mockColumnToCheck, mockId);
    
        expect(result).toBeNull();
    });
});

describe('addIncome', () => {
    const mockProfile = 'testProfile';
    const mockAmount = 100;
    const mockDescription = 'Test income';
    const mockCreatedAt = new Date('2023-01-01');
  
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(apiModule, 'updateBalance').mockImplementation(() => Promise.resolve(undefined));
        jest.spyOn(apiModule, 'getValueFromData').mockImplementation(() => Promise.resolve(undefined));
    });
    
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should add income successfully', async () => {
        const mockInsertData = [{ id: '1', profile: mockProfile, amount: mockAmount, description: mockDescription, created_at: mockCreatedAt }];
        
        (supabase.from as jest.Mock).mockReturnValue({
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue({ data: mockInsertData, error: null }),
        });
    
        (supabase.rpc as jest.Mock).mockResolvedValue({ data: { new_balance: 200 }, error: null });
    
        const result = await addIncome(mockProfile, mockAmount, mockDescription, mockCreatedAt);
    
        expect(supabase.from).toHaveBeenCalledWith('Incomes');

        expect(supabase.from('Incomes').insert).toHaveBeenCalledWith({
            profile: mockProfile,
            amount: mockAmount,
            description: mockDescription,
            created_at: mockCreatedAt,
        });

        expect(supabase.from('Incomes').select).toHaveBeenCalled();

        expect(supabase.rpc).toHaveBeenCalledWith('update_balance', {
            profile_id: mockProfile,
            amount: mockAmount
        });
        
        expect(result).toEqual(mockInsertData);
    });
  
    it('should use current date if created_at is not provided', async () => {
        const mockInsert = jest.fn().mockReturnThis();
        const mockSelect = jest.fn().mockResolvedValue({ data: [], error: null });
    
        (supabase.from as jest.Mock).mockReturnValue({
            insert: mockInsert,
            select: mockSelect,
        });
    
        (updateBalance as jest.Mock).mockResolvedValue(undefined);
    
        await addIncome(mockProfile, mockAmount, mockDescription);
    
        const insertCall = mockInsert.mock.calls[0][0];

        expect(insertCall.created_at).toBeInstanceOf(Date);
        
        expect(insertCall.created_at.getTime()).toBeCloseTo(new Date().getTime(), -3); // Allow 1 second difference
    });
  
    it('should return null and log error if insert fails', async () => {
        const mockError = new Error('Insert failed');
        const mockInsert = jest.fn().mockReturnThis();
        const mockSelect = jest.fn().mockResolvedValue({ data: null, error: mockError });
    
        (supabase.from as jest.Mock).mockReturnValue({
            insert: mockInsert,
            select: mockSelect,
        });
    
        (updateBalance as jest.Mock).mockResolvedValue(undefined);
    
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
        const result = await addIncome(mockProfile, mockAmount, mockDescription);
    
        expect(result).toBeNull();

        expect(consoleSpy).toHaveBeenCalledWith('Error adding income:', mockError);
    
        consoleSpy.mockRestore();
    });
});

describe('fetchBalance', () => {
    const mockProfileId = 'profile123';
  
    beforeEach(() => {
        jest.clearAllMocks();
    });
  
    it('should return the balance when it exists', async () => {
        const mockBalance = 500;
        
        (getValueFromData as jest.Mock).mockResolvedValue(mockBalance);
    
        const result = await fetchBalance(mockProfileId);
    
        expect(getValueFromData).toHaveBeenCalledWith(
            'Profiles',
            'balance',
            'id',
            mockProfileId
        );
        
        expect(result).toBe(mockBalance);
    });
});

describe('updateBalance', () => {
    const mockProfile = 'profile123';
    const mockAmount = 100;
  
    beforeEach(() => {
        jest.clearAllMocks();
    });
  
    it('should update balance successfully', async () => {
        const mockData = { new_balance: 500 };

        (supabase.rpc as jest.Mock).mockResolvedValue({ data: mockData, error: null });
    
        const result = await updateBalance(mockProfile, mockAmount);
    
        expect(supabase.rpc).toHaveBeenCalledWith('update_balance', {
            profile_id: mockProfile,
            amount: mockAmount
        });
        
        expect(result).toEqual(mockData);
    });
  
    it('should return null if there is an error', async () => {
        const mockError = new Error('Update error');

        (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: mockError });
    
        const result = await updateBalance(mockProfile, mockAmount);
    
        expect(supabase.rpc).toHaveBeenCalledWith('update_balance', {
            profile_id: mockProfile,
            amount: mockAmount
        });

        expect(result).toBeNull();
    });
    
    it('should return null if there is an unexpected error', async () => {
        (supabase.rpc as jest.Mock).mockRejectedValue(new Error('Unexpected error'));
    
        const result = await updateBalance(mockProfile, mockAmount);
    
        expect(supabase.rpc).toHaveBeenCalledWith('update_balance', {
            profile_id: mockProfile,
            amount: mockAmount
        });
        
        expect(result).toBeNull();
    });
    
    it('should handle zero amount', async () => {
        const mockData = { new_balance: 500 };

        (supabase.rpc as jest.Mock).mockResolvedValue({ data: mockData, error: null });
    
        const result = await updateBalance(mockProfile, 0);
    
        expect(supabase.rpc).toHaveBeenCalledWith('update_balance', {
            profile_id: mockProfile,
            amount: 0
        });
        
        expect(result).toEqual(mockData);
    });
    
    it('should handle negative amount', async () => {
        const mockData = { new_balance: 400 };

        (supabase.rpc as jest.Mock).mockResolvedValue({ data: mockData, error: null });
    
        const result = await updateBalance(mockProfile, -100);
    
        expect(supabase.rpc).toHaveBeenCalledWith('update_balance', {
            profile_id: mockProfile,
            amount: -100
        });

        expect(result).toEqual(mockData);
    });
});

describe('getProfile', () => {
    const mockProfileId = 'profile123';
  
    beforeEach(() => {
        jest.clearAllMocks();
    });
  
    it('should return profile data when it exists', async () => {
        const mockProfileData = {
            id: mockProfileId,
            name: 'Test Profile',
            balance: 1000,
            created_at: new Date(),
            owner: 'user@example.com',
            users: ['user@example.com'],
            is_shared: false
        };
  
        (getData as jest.Mock).mockResolvedValue(mockProfileData);
    
        const result = await getProfile(mockProfileId);
    
        expect(getData).toHaveBeenCalledWith('Profiles', mockProfileId);
        
        expect(result).toEqual(mockProfileData);
    });
});

describe('logIn', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
  
    it('should return user data on successful login', async () => {
        const mockUser = { email: 'test@example.com' };
        const mockSession = { access_token: 'mock_token' };
        const mockUserData = null;
    
        (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
            data: { user: mockUser, session: mockSession },
            error: null,
        });

        (supabase.auth.getUser as jest.Mock).mockResolvedValue({
            data: { user: mockUser },
            error: null,
        });

        (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

        (getUser as jest.Mock).mockResolvedValue(mockUserData);
    
        const result = await logIn('test@example.com', 'password');
    
        expect(result).toEqual({
            user: mockUser,
            userData: mockUserData,
            session: mockSession,
        });

        expect(AsyncStorage.setItem).toHaveBeenCalledWith('userSession', JSON.stringify(mockSession));
    });
  
    it('should return an error for invalid credentials', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Invalid login credentials'),
      });
  
      const result = await logIn('test@example.com', 'wrong_password');
  
      expect(result).toEqual({ error: 'Invalid login credentials' });
    });
  
    it('should return an error for unvalidated email', async () => {
      const mockUser = { email: 'test@example.com' };
      const mockSession = { access_token: 'mock_token' };
  
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { ...mockUser, last_sign_in_at: new Date().toISOString() } },
        error: null,
      });
      
      (apiModule.getUser as jest.Mock).mockResolvedValue(null);
  
      const result = await logIn('test@example.com', 'password');
  
      expect(result).toEqual({ error: 'Email not validated' });
    });
  
    it('should handle unexpected errors', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(new Error('Unexpected error'));
  
      const result = await logIn('test@example.com', 'password');
  
      expect(result).toEqual({ error: 'An unexpected error occurred.' });
    });
});
import { updateBalance, fetchBalance, getProfile, getValueFromData, fetchData, getData, addIncome } from '@/api/api';
export * from '@react-native-async-storage/async-storage/jest/async-storage-mock';
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
    addData: jest.fn(),
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
        const mockInsert = jest.fn().mockReturnThis();
        const mockSelect = jest.fn().mockResolvedValue({ data: mockInsertData, error: null });
    
        (supabase.from as jest.Mock).mockReturnValue({
          insert: mockInsert,
          select: mockSelect,
        });
    
        const result = await apiModule.addIncome(mockProfile, mockAmount, mockDescription, mockCreatedAt);
    
        expect(supabase.from).toHaveBeenCalledWith('Incomes');

        expect(mockInsert).toHaveBeenCalledWith({
          profile: mockProfile,
          amount: mockAmount,
          description: mockDescription,
          created_at: mockCreatedAt,
        });

        expect(mockSelect).toHaveBeenCalled();

        expect(apiModule.updateBalance).toHaveBeenCalledWith(mockProfile, mockAmount);
        
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
import axios from 'axios';

const API_URL = 'https://your-api-url.com/tamil-dictionary'; // Replace with your actual API URL

export interface DictionaryEntry {
    word: string;
    meaning: string;
    example?: string;
}

export const fetchDictionaryEntries = async (): Promise<DictionaryEntry[]> => {
    const response = await axios.get<DictionaryEntry[]>(`${API_URL}/entries`);
    return response.data;
};

export const searchWord = async (word: string): Promise<DictionaryEntry | null> => {
    const response = await axios.get<DictionaryEntry>(`${API_URL}/search?word=${word}`);
    return response.data || null;
};

export const addWord = async (entry: DictionaryEntry): Promise<void> => {
    await axios.post(`${API_URL}/add`, entry);
};
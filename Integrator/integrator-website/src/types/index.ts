export interface DictionaryEntry {
    word: string;
    meaning: string;
    partOfSpeech?: string;
    example?: string;
}

export interface SearchResult {
    entries: DictionaryEntry[];
    query: string;
    totalResults: number;
}
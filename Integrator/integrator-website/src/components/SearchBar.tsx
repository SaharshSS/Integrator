import React, { useState } from 'react';

const SearchBar: React.FC<{ onSearch: (query: string) => void }> = ({ onSearch }) => {
    const [query, setQuery] = useState('');

    const handleSearch = (event: React.FormEvent) => {
        event.preventDefault();
        onSearch(query);
        setQuery('');
    };

    return (
        <form onSubmit={handleSearch}>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for Tamil words"
            />
            <button type="submit">Search</button>
        </form>
    );
};

export default SearchBar;
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export default function ItemsProvider({ data, children }) {
    const [loading, setLoading] = useState(false);

    useEffect(
        () => {
            setLoading(false);
        },
        [data]
    );

    return (
        <ItemsContext.Provider value={{ loading, setLoading }}>
            {children}
        </ItemsContext.Provider>
    );
}

export const ItemsContext = createContext({});
export const useItems = () => useContext(ItemsContext);
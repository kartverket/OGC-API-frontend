'use client';

import { createContext, useContext, useRef, useState } from 'react';

export default function ItemsProvider({ children }) {
    const [bboxEdit, setBboxEdit] = useState(false);
    const [sizeAndPosition, setSizeAndPosition] = useState(null);
    const sizeAndPositionRef = useRef(null);

    return (
        <ItemsContext.Provider
            value={{
                bboxEdit,
                setBboxEdit,
                sizeAndPosition,
                setSizeAndPosition,
                sizeAndPositionRef
            }}
        >
            {children}
        </ItemsContext.Provider>
    );
}

export const ItemsContext = createContext({});
export const useItems = () => useContext(ItemsContext);
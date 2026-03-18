import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    selectedFeature: null
};

export const mapSlice = createSlice({
    name: 'map',
    initialState,
    reducers: {
        selectFeature: (state, action) => {
            return {
                ...state,
                selectedFeature: action.payload
            };
        }
    }
});

export const { selectFeature } = mapSlice.actions;
export default mapSlice.reducer;
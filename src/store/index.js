import { configureStore } from '@reduxjs/toolkit';
import mapReducer from './slices/mapSlice';

export default configureStore({
    reducer: {
        map: mapReducer
    }
});

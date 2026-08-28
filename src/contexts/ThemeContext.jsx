import { createContext, useContext } from 'react';
import { getTheme, DEFAULT_THEME_ID } from '../constants/themes';

export const ThemeContext = createContext(getTheme(DEFAULT_THEME_ID));

export function ThemeProvider({ themeId, children }) {
    const theme = getTheme(themeId);
    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
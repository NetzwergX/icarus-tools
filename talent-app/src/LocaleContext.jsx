import { createContext, useContext } from 'react'

/**
 * Provides locale selection state.
 *
 * Value shape:
 *   locale           — current locale code (e.g. 'en')
 *   availableLocales — array of available locale codes
 *   onSelectLocale   — callback to change locale
 */
const LocaleContext = createContext(null)

export function LocaleProvider({ value, children }) {
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return ctx
}

export default LocaleContext

import { createContext, useContext } from 'react'

/**
 * Provides saved builds state and operations.
 *
 * Value shape:
 *   savedBuilds            — array of saved build objects
 *   onSaveBuild            — callback(buildData)
 *   onLoadBuild            — callback(savedBuild)
 *   onDeleteBuild          — callback(buildId)
 *   onShareBuild           — callback(savedBuild)
 *   savedBuildLoadStateById  — { [buildId]: 'idle'|'loading'|'done' }
 *   savedBuildShareStateById — { [buildId]: 'idle'|'sharing'|'done' }
 *   savedBuildDeleteStateById — { [buildId]: 'idle'|'deleting'|'done' }
 *   savedBuildTooltip      — tooltip state for hovered saved build
 *   onSetSavedBuildTooltip — callback to set tooltip
 */
const SavedBuildsContext = createContext(null)

export function SavedBuildsProvider({ value, children }) {
  return <SavedBuildsContext.Provider value={value}>{children}</SavedBuildsContext.Provider>
}

export function useSavedBuilds() {
  const ctx = useContext(SavedBuildsContext)
  if (!ctx) {
    throw new Error('useSavedBuilds must be used within a SavedBuildsProvider')
  }
  return ctx
}

export default SavedBuildsContext

import { createContext, useContext } from 'react'

/**
 * Provides the active build state and mutation handlers.
 *
 * Value shape:
 *   modelId                — 'Player' | 'Creature' | 'Blueprint'
 *   archetypeId            — selected archetype/tier ID
 *   skilledTalents         — { [treeId]: { [talentId]: rank } }
 *   selectedPlayerModifierIds — array of active player modifier IDs
 *   onSkillTalent          — callback(treeId, talentId, rank)
 *   onSetModelId           — callback(modelId)
 *   onSetArchetypeId       — callback(archetypeId)
 *   onResetBuild           — callback()
 *   pendingSharedMetadata  — { title, description } | null
 */
const BuildContext = createContext(null)

export function BuildProvider({ value, children }) {
  return <BuildContext.Provider value={value}>{children}</BuildContext.Provider>
}

export function useBuild() {
  const ctx = useContext(BuildContext)
  if (!ctx) {
    throw new Error('useBuild must be used within a BuildProvider')
  }
  return ctx
}

export default BuildContext

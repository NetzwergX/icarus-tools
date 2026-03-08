import { SAVED_BUILDS_STORAGE_KEY, ACTIVE_BUILD_STORAGE_KEY, BLUEPRINT_MODEL_ID } from './constants.js'
import { normalizePlayerModifierIds } from './modifierUtils.js'
import { normalizeShareMetadata } from './buildUtils.js'

export function readSavedBuildsFromStorage() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(SAVED_BUILDS_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((entry) => entry && typeof entry === 'object' && typeof entry.id === 'string')
  } catch {
    return []
  }
}

export function writeSavedBuildsToStorage(savedBuilds) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(SAVED_BUILDS_STORAGE_KEY, JSON.stringify(savedBuilds ?? []))
  } catch {
    // ignore write failures
  }
}

export function readActiveBuildsFromStorage() {
  if (typeof window === 'undefined') {
    return {
      lastContext: { modelId: 'Player', archetypeId: '' },
      player: { archetypeId: '', skilledTalents: {}, modifierIds: [], metadata: null },
      creatures: {},
      blueprints: {}
    }
  }

  try {
    const raw = window.localStorage.getItem(ACTIVE_BUILD_STORAGE_KEY)
    if (!raw) {
      return {
        lastContext: { modelId: 'Player', archetypeId: '' },
        player: { archetypeId: '', skilledTalents: {}, modifierIds: [], metadata: null },
        creatures: {},
        blueprints: {}
      }
    }

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') throw new Error('invalid active build snapshot')

    const player = parsed.player && typeof parsed.player === 'object'
      ? {
        archetypeId: typeof parsed.player.archetypeId === 'string' ? parsed.player.archetypeId : '',
        skilledTalents: parsed.player.skilledTalents && typeof parsed.player.skilledTalents === 'object'
          ? parsed.player.skilledTalents
          : {},
        modifierIds: normalizePlayerModifierIds(parsed.player.modifierIds),
        metadata: normalizeShareMetadata(parsed.player.metadata)
      }
      : {
        archetypeId: '',
        skilledTalents: {},
        modifierIds: [],
        metadata: null
      }

    const creatures = {}
    if (parsed.creatures && typeof parsed.creatures === 'object') {
      Object.entries(parsed.creatures).forEach(([archetypeId, creatureBuild]) => {
        if (!archetypeId || typeof creatureBuild !== 'object' || !creatureBuild) return
        creatures[archetypeId] = {
          archetypeId,
          skilledTalents: creatureBuild.skilledTalents && typeof creatureBuild.skilledTalents === 'object'
            ? creatureBuild.skilledTalents
            : {},
          metadata: normalizeShareMetadata(creatureBuild.metadata)
        }
      })
    }

    const blueprints = {}
    if (parsed.blueprints && typeof parsed.blueprints === 'object') {
      Object.entries(parsed.blueprints).forEach(([archetypeId, blueprintBuild]) => {
        if (!archetypeId || typeof blueprintBuild !== 'object' || !blueprintBuild) return
        blueprints[archetypeId] = {
          archetypeId,
          skilledTalents: blueprintBuild.skilledTalents && typeof blueprintBuild.skilledTalents === 'object'
            ? blueprintBuild.skilledTalents
            : {},
          metadata: normalizeShareMetadata(blueprintBuild.metadata)
        }
      })
    }

    const lastContext = parsed.lastContext && typeof parsed.lastContext === 'object'
      ? {
        modelId: parsed.lastContext.modelId === 'Creature'
          ? 'Creature'
          : (parsed.lastContext.modelId === BLUEPRINT_MODEL_ID ? BLUEPRINT_MODEL_ID : 'Player'),
        archetypeId: typeof parsed.lastContext.archetypeId === 'string' ? parsed.lastContext.archetypeId : ''
      }
      : {
        modelId: 'Player',
        archetypeId: ''
      }

    return { lastContext, player, creatures, blueprints }
  } catch {
    return {
      lastContext: { modelId: 'Player', archetypeId: '' },
      player: { archetypeId: '', skilledTalents: {}, modifierIds: [], metadata: null },
      creatures: {},
      blueprints: {}
    }
  }
}

export function writeActiveBuildsToStorage(activeBuilds) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(ACTIVE_BUILD_STORAGE_KEY, JSON.stringify(activeBuilds ?? {}))
  } catch {
    // ignore write failures
  }
}

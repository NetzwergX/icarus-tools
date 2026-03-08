import { BLUEPRINT_MODEL_ID, RANK_INVESTMENTS } from './constants.js'
import { shouldHideTalent, resolveEffectiveRequiredTalentIds } from './talentUtils.js'
import { resolveLocalizedValue, resolveAssetImagePath } from './utils.js'
import { normalizePlayerModifierIds } from './modifierUtils.js'
import { getCreatureOriginTalentByTree } from './modelUtils.js'

export function normalizeTalentState(rawTalents) {
  if (!rawTalents || typeof rawTalents !== 'object' || Array.isArray(rawTalents)) {
    return {}
  }

  const nextTalents = {}

  Object.entries(rawTalents).forEach(([treeId, treeTalents]) => {
    if (!treeId || !treeTalents || typeof treeTalents !== 'object' || Array.isArray(treeTalents)) {
      return
    }

    const nextTreeTalents = {}
    Object.entries(treeTalents).forEach(([talentId, rawRank]) => {
      if (!talentId) return
      const rank = Math.floor(Number(rawRank))
      if (!Number.isFinite(rank) || rank < 0) return
      nextTreeTalents[talentId] = rank
    })

    if (Object.keys(nextTreeTalents).length > 0) {
      nextTalents[treeId] = nextTreeTalents
    }
  })

  return nextTalents
}

export function normalizeShareMetadata(rawMetadata) {
  if (!rawMetadata || typeof rawMetadata !== 'object') {
    return null
  }

  const title = typeof rawMetadata.title === 'string'
    ? rawMetadata.title.trim().slice(0, 80)
    : ''
  const description = typeof rawMetadata.description === 'string'
    ? rawMetadata.description.trim().slice(0, 240)
    : ''

  if (!title && !description) {
    return null
  }

  return {
    title,
    description
  }
}

export function normalizeSavedBuildTitle(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().toLocaleLowerCase()
}

export function normalizeSavedBuildSubjectKey({ modelId, contextId }) {
  const normalizedModelId = modelId === 'Creature'
    ? 'Creature'
    : (modelId === BLUEPRINT_MODEL_ID ? BLUEPRINT_MODEL_ID : 'Player')

  if (normalizedModelId === 'Creature' || normalizedModelId === BLUEPRINT_MODEL_ID) {
    const normalizedContextId = typeof contextId === 'string' ? contextId.trim() : ''
    return normalizedContextId ? `${normalizedModelId}:${normalizedContextId}` : ''
  }

  return 'Player'
}

export function findDuplicateSavedBuild({ savedBuilds, title, modelId, contextId }) {
  const normalizedTitle = normalizeSavedBuildTitle(title)
  const normalizedSubjectKey = normalizeSavedBuildSubjectKey({ modelId, contextId })
  if (!normalizedTitle) {
    return null
  }

  if (!normalizedSubjectKey) {
    return null
  }

  return savedBuilds.find((savedBuild) => {
    return (
      normalizeSavedBuildTitle(savedBuild?.title) === normalizedTitle
      && normalizeSavedBuildSubjectKey({
        modelId: savedBuild?.modelId,
        contextId: savedBuild?.contextId || savedBuild?.archetypeId || ''
      }) === normalizedSubjectKey
    )
  }) || null
}

export function countMissingPrerequisitesInBuild(talentState, model) {
  if (!model?.archetypes) {
    return 0
  }

  const treeLookup = {}
  Object.values(model.archetypes).forEach((archetype) => {
    Object.values(archetype?.trees ?? {}).forEach((tree) => {
      treeLookup[tree.id] = tree
    })
  })

  let issueCount = 0

  Object.entries(talentState ?? {}).forEach(([treeId, treeTalents]) => {
    const tree = treeLookup[treeId]
    if (!tree?.talents) {
      return
    }

    const treePoints = Object.values(treeTalents ?? {}).reduce((total, rankValue) => {
      const rank = Number(rankValue)
      return total + (Number.isFinite(rank) ? rank : 0)
    }, 0)

    Object.entries(treeTalents ?? {}).forEach(([talentId, rankValue]) => {
      const rank = Number(rankValue)
      if (!Number.isFinite(rank) || rank <= 0) {
        return
      }

      const talent = tree.talents[talentId]
      if (!talent) {
        return
      }

      if (shouldHideTalent(talent)) {
        return
      }

      const requiredRank = talent.requiredRank
      const requiredPoints = requiredRank ? RANK_INVESTMENTS[requiredRank] : 0
      const meetsRankRequirement = !requiredRank || treePoints >= requiredPoints

      const requiredTalents = resolveEffectiveRequiredTalentIds(talent.requiredTalents, tree.talents)
      const meetsTalentRequirement = requiredTalents.length === 0 || requiredTalents.some((requiredTalentId) => {
        return (treeTalents?.[requiredTalentId] ?? 0) > 0
      })

      if (!meetsRankRequirement || !meetsTalentRequirement) {
        issueCount += 1
      }
    })
  })

  return issueCount
}

export function hasMeaningfulBuildState({ modelId, archetypeId, skilledTalents, selectedPlayerModifierIds, models }) {
  const normalizedModelId = modelId === 'Creature'
    ? 'Creature'
    : (modelId === BLUEPRINT_MODEL_ID ? BLUEPRINT_MODEL_ID : 'Player')

  if (normalizedModelId === 'Player') {
    return hasAnySpentPoints(skilledTalents) || normalizePlayerModifierIds(selectedPlayerModifierIds).length > 0
  }

  if (normalizedModelId === 'Creature') {
    const creatureModel = models?.Creature
    const baselineState = ensureCreatureArchetypeBuild({}, creatureModel, archetypeId)
    const normalizedCurrentState = ensureCreatureArchetypeBuild(skilledTalents ?? {}, creatureModel, archetypeId)

    return !areTalentStatesEqual(normalizedCurrentState, baselineState)
  }

  const blueprintModel = models?.[BLUEPRINT_MODEL_ID]
  const archetype = blueprintModel?.archetypes?.[archetypeId]
  if (!archetype) {
    return false
  }

  const normalizedCurrentState = pickTalentsForTreeIds(
    skilledTalents ?? {},
    getArchetypeTreeIds(archetype)
  )

  return hasAnySpentPoints(normalizedCurrentState)
}

export function hasAnySpentPoints(talentState) {
  return Object.values(talentState ?? {}).some((treeTalents) => {
    return Object.values(treeTalents ?? {}).some((rankValue) => {
      const rank = Number(rankValue)
      return Number.isFinite(rank) && rank > 0
    })
  })
}

export function areTalentStatesEqual(leftState, rightState) {
  const left = normalizeTalentState(leftState)
  const right = normalizeTalentState(rightState)

  const leftTreeIds = Object.keys(left)
  const rightTreeIds = Object.keys(right)
  if (leftTreeIds.length !== rightTreeIds.length) {
    return false
  }

  return leftTreeIds.every((treeId) => {
    if (!Object.hasOwn(right, treeId)) {
      return false
    }

    const leftTree = left[treeId] ?? {}
    const rightTree = right[treeId] ?? {}
    const leftTalentIds = Object.keys(leftTree)
    const rightTalentIds = Object.keys(rightTree)

    if (leftTalentIds.length !== rightTalentIds.length) {
      return false
    }

    return leftTalentIds.every((talentId) => rightTree[talentId] === leftTree[talentId])
  })
}

export function getArchetypeTreeIds(archetype) {
  return Object.values(archetype?.trees ?? {}).map((tree) => tree.id)
}

export function pickTalentsForTreeIds(talentState, treeIds) {
  const result = {}
  treeIds.forEach((treeId) => {
    const treeTalents = talentState?.[treeId]
    if (!treeTalents || typeof treeTalents !== 'object') return
    if (Object.keys(treeTalents).length === 0) return
    result[treeId] = treeTalents
  })
  return result
}

export function ensureCreatureArchetypeBuild(talentState, creatureModel, archetypeId) {
  if (!creatureModel || creatureModel.id !== 'Creature') {
    return talentState ?? {}
  }

  const archetype = creatureModel.archetypes?.[archetypeId]
  if (!archetype) {
    return {}
  }

  const treeIds = getArchetypeTreeIds(archetype)
  const scopedTalents = pickTalentsForTreeIds(talentState ?? {}, treeIds)
  const originByTree = getCreatureOriginTalentByTree(creatureModel)
  const nextState = { ...scopedTalents }

  treeIds.forEach((treeId) => {
    const originTalentId = originByTree[treeId]
    if (!originTalentId) return
    const existingTree = nextState[treeId] ?? {}
    const currentRank = Number(existingTree[originTalentId] ?? 0)
    if (currentRank >= 1) return
    nextState[treeId] = {
      ...existingTree,
      [originTalentId]: 1
    }
  })

  return nextState
}

export function getScopedArchetypeTalentState(talentState, model, archetypeId) {
  const archetype = model?.archetypes?.[archetypeId]
  if (!archetype) {
    return {}
  }

  return pickTalentsForTreeIds(
    normalizeTalentState(talentState ?? {}),
    getArchetypeTreeIds(archetype)
  )
}

export function createNextActiveBuildsSnapshot({
  previous,
  modelId,
  archetypeId,
  skilledTalents,
  selectedPlayerModifierIds,
  models,
  metadata
}) {
  const baseline = previous && typeof previous === 'object'
    ? previous
    : {
      lastContext: { modelId: 'Player', archetypeId: '' },
      player: { archetypeId: '', skilledTalents: {}, modifierIds: [], metadata: null },
      creatures: {},
      blueprints: {}
    }

  const next = {
    lastContext: {
      modelId: modelId === 'Creature'
        ? 'Creature'
        : (modelId === BLUEPRINT_MODEL_ID ? BLUEPRINT_MODEL_ID : 'Player'),
      archetypeId: archetypeId || ''
    },
    player: {
      archetypeId: baseline.player?.archetypeId || '',
      skilledTalents: baseline.player?.skilledTalents ?? {},
      modifierIds: normalizePlayerModifierIds(baseline.player?.modifierIds),
      metadata: normalizeShareMetadata(baseline.player?.metadata)
    },
    creatures: { ...(baseline.creatures ?? {}) },
    blueprints: { ...(baseline.blueprints ?? {}) }
  }

  if (modelId === 'Creature') {
    const creatureModel = models?.Creature
    const normalizedSkilledTalents = ensureCreatureArchetypeBuild(skilledTalents, creatureModel, archetypeId)
    if (archetypeId) {
      next.creatures[archetypeId] = {
        archetypeId,
        skilledTalents: normalizedSkilledTalents,
        metadata: normalizeShareMetadata(metadata)
      }
    }
    return next
  }

  if (modelId === BLUEPRINT_MODEL_ID) {
    if (archetypeId) {
      const blueprintModel = models?.[BLUEPRINT_MODEL_ID]
      const archetype = blueprintModel?.archetypes?.[archetypeId]
      const normalizedSkilledTalents = archetype
        ? pickTalentsForTreeIds(skilledTalents ?? {}, getArchetypeTreeIds(archetype))
        : {}
      next.blueprints[archetypeId] = {
        archetypeId,
        skilledTalents: normalizedSkilledTalents,
        metadata: normalizeShareMetadata(metadata)
      }
    }
    return next
  }

  next.player = {
    archetypeId: archetypeId || '',
    skilledTalents: skilledTalents ?? {},
    modifierIds: normalizePlayerModifierIds(selectedPlayerModifierIds),
    metadata: normalizeShareMetadata(metadata)
  }

  return next
}

export function getActiveBuildMetadata(activeBuilds, modelId, archetypeId) {
  if (modelId === 'Creature') {
    return normalizeShareMetadata(activeBuilds?.creatures?.[archetypeId]?.metadata)
  }

  if (modelId === BLUEPRINT_MODEL_ID) {
    return normalizeShareMetadata(activeBuilds?.blueprints?.[archetypeId]?.metadata)
  }

  return normalizeShareMetadata(activeBuilds?.player?.metadata)
}

export function createSavedBuildId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `build-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function resolveSavedBuildContext(savedBuild, data, localeStrings) {
  const modelId = savedBuild?.modelId
  const isCreatureBuild = savedBuild?.buildType === 'creature' || modelId === 'Creature'
  const isBlueprintBuild = savedBuild?.buildType === 'blueprint' || modelId === BLUEPRINT_MODEL_ID

  if (!isCreatureBuild && !isBlueprintBuild) {
    return {
      name: 'Player',
      icon: ''
    }
  }

  const contextId = savedBuild?.contextId || savedBuild?.archetypeId || ''
  const targetModelId = isBlueprintBuild ? BLUEPRINT_MODEL_ID : 'Creature'
  const fallbackName = isBlueprintBuild ? contextId || 'Tech Tier' : contextId || 'Creature'
  const archetype = data?.models?.[targetModelId]?.archetypes?.[contextId]

  return {
    name: savedBuild?.contextName
      || resolveLocalizedValue(archetype?.display, localeStrings, fallbackName),
    icon: savedBuild?.contextIcon
      || resolveAssetImagePath(archetype?.icon)
      || ''
  }
}

export function formatSavedBuildTimestamp(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown time'
  }

  return date.toLocaleString()
}

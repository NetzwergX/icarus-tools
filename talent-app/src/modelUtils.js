import { CREATURE_MOUNT_LEVEL_CAP, CREATURE_PET_LEVEL_CAP, MAX_TALENT_POINTS, MAX_SOLO_POINTS } from './constants.js'
import { shouldHideTalent, getTreeTalentPoints, summarizeTalentPoints } from './talentUtils.js'

export function getCreatureTreeProgressById(model) {
  const byTreeId = {}

  if (!model || model.id !== 'Creature') {
    return byTreeId
  }

  Object.values(model.archetypes ?? {}).forEach((archetype) => {
    Object.values(archetype.trees ?? {}).forEach((tree) => {
      const talentIds = Object.keys(tree.talents ?? {})
      const hasCombatPetTalentPrefix = talentIds.some((talentId) => talentId.startsWith('CombatPet_'))
      const hasRegularPetTalentPrefix = talentIds.some((talentId) => talentId.startsWith('NonCombatPet_'))

      let category = hasRegularPetTalentPrefix
        ? 'regularPet'
        : (hasCombatPetTalentPrefix ? 'combatPet' : 'mount')

      // Creatures added by Homestead patch use talent naming that can misclassify them as combat pets.
      if (tree.id === 'Creature_Bull' || tree.id === 'Creature_Pig') {
        category = 'regularPet'
      }
      
      const levelCap = category === 'mount' ? CREATURE_MOUNT_LEVEL_CAP : CREATURE_PET_LEVEL_CAP

      byTreeId[tree.id] = {
        category,
        levelCap
      }
    })
  })

  return byTreeId
}

export function groupCreatureArchetypesByCategory(archetypes, creatureTreeProgressById) {
  const grouped = {
    mount: [],
    combatPet: [],
    regularPet: []
  }

  archetypes.forEach((archetype) => {
    const firstTree = Object.values(archetype.trees ?? {})[0]
    const inferredCategory = creatureTreeProgressById?.[firstTree?.id]?.category
    const category = inferredCategory && grouped[inferredCategory] ? inferredCategory : 'mount'
    grouped[category].push(archetype)
  })

  return grouped
}

export function getCreatureArchetypeCategory(archetype, creatureTreeProgressById) {
  if (!archetype) {
    return 'mount'
  }

  const firstTree = Object.values(archetype.trees ?? {})[0]
  const inferredCategory = creatureTreeProgressById?.[firstTree?.id]?.category
  return inferredCategory || 'mount'
}

export function getCreatureOriginTalentByTree(model) {
  const byTreeId = {}

  if (!model || model.id !== 'Creature') {
    return byTreeId
  }

  Object.values(model.archetypes ?? {}).forEach((archetype) => {
    Object.values(archetype.trees ?? {}).forEach((tree) => {
      const talents = Object.values(tree.talents ?? {}).filter((talent) => !shouldHideTalent(talent))
      if (talents.length === 0) {
        return
      }

      const noPrerequisiteTalents = talents.filter(
        (talent) => !Array.isArray(talent.requiredTalents) || talent.requiredTalents.length === 0
      )

      const defaultUnlockedRoot = noPrerequisiteTalents.find(
        (talent) => talent.defaultUnlocked && (talent.rewards?.length ?? 1) === 1
      )
      const fallbackRoot = noPrerequisiteTalents[0] ?? talents[0]
      const rootTalent = defaultUnlockedRoot ?? fallbackRoot

      if (rootTalent?.id) {
        byTreeId[tree.id] = rootTalent.id
      }
    })
  })

  return byTreeId
}

export function hasCreatureOvercap(talentState, creatureModel) {
  const creatureProgressByTree = getCreatureTreeProgressById(creatureModel)
  const creatureOriginByTree = getCreatureOriginTalentByTree(creatureModel)

  return Object.entries(talentState ?? {}).some(([treeId, treeTalents]) => {
    const cap = creatureProgressByTree[treeId]?.levelCap
    if (!Number.isFinite(cap)) {
      return false
    }

    const points = getTreeTalentPoints(treeTalents, creatureOriginByTree[treeId])
    return points > cap
  })
}

export function hasPlayerOvercap(talentState, model, maxTalentPoints = MAX_TALENT_POINTS) {
  const treeArchetypeMap = getTreeArchetypeMap(model)
  const pointsSummary = summarizeTalentPoints(talentState, treeArchetypeMap)

  return pointsSummary.talentPoints > maxTalentPoints || pointsSummary.soloPoints > MAX_SOLO_POINTS
}

export function getTreeArchetypeMap(model) {
  const map = {}

  Object.values(model?.archetypes ?? {}).forEach((archetype) => {
    Object.values(archetype.trees ?? {}).forEach((tree) => {
      map[tree.id] = archetype.id
    })
  })

  return map
}

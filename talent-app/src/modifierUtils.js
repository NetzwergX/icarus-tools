import { MAX_TALENT_POINTS } from './constants.js'

export function normalizePlayerModifierIds(rawModifierIds, availableModifiers) {
  if (!Array.isArray(rawModifierIds)) {
    return []
  }

  const allowedIds = new Set(
    Array.isArray(availableModifiers)
      ? availableModifiers.map((modifier) => modifier?.id).filter(Boolean)
      : []
  )

  const normalized = []
  const seen = new Set()
  rawModifierIds.forEach((modifierId) => {
    if (typeof modifierId !== 'string' || !modifierId) {
      return
    }

    if (allowedIds.size > 0 && !allowedIds.has(modifierId)) {
      return
    }

    if (seen.has(modifierId)) {
      return
    }

    seen.add(modifierId)
    normalized.push(modifierId)
  })

  return normalized
}

export function resolveModifierLabel(modifierId, modifierLabels) {
  if (typeof modifierId !== 'string' || !modifierId) {
    return ''
  }

  const localizedLabel = modifierLabels?.[modifierId]
  if (typeof localizedLabel === 'string' && localizedLabel.trim()) {
    return localizedLabel.trim()
  }

  return modifierId
}

export function getPlayerTalentPointBonus(selectedModifierIds, availableModifiers) {
  const normalizedSelectedIds = normalizePlayerModifierIds(selectedModifierIds, availableModifiers)
  if (!normalizedSelectedIds.length || !Array.isArray(availableModifiers)) {
    return 0
  }

  const modifierById = new Map(
    availableModifiers
      .filter((modifier) => modifier && typeof modifier === 'object' && modifier.id)
      .map((modifier) => [modifier.id, modifier])
  )

  return normalizedSelectedIds.reduce((total, modifierId) => {
    const modifier = modifierById.get(modifierId)
    const points = Number(modifier?.talentPointModifier)
    return total + (Number.isFinite(points) ? points : 0)
  }, 0)
}

export function getMaxPlayerTalentPoints(selectedModifierIds, availableModifiers) {
  return MAX_TALENT_POINTS + getPlayerTalentPointBonus(selectedModifierIds, availableModifiers)
}

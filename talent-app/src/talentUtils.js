/**
 * Talent-specific utility functions shared across components.
 */

export function getTalentRankCount(talent) {
  if (!talent || typeof talent !== 'object') {
    return 0
  }

  const explicitRankCount = Number(talent.rankCount)
  if (Number.isFinite(explicitRankCount) && explicitRankCount >= 0) {
    return explicitRankCount
  }

  const rewards = talent.rewards
  const rewardRankCount = Array.isArray(rewards) ? rewards.length : null

  if (isRerouteTalent(talent)) {
    return 0
  }

  if (rewardRankCount === null) {
    return 1
  }

  if (rewardRankCount > 0) {
    return rewardRankCount
  }

  return isLikelyLegacyRerouteTalent(talent) ? 0 : 1
}

export function shouldHideTalent(talent) {
  return getTalentRankCount(talent) <= 0
}

export function isRerouteTalent(talent) {
  return talent?.type === 'Reroute' || talent?.talentType === 'Reroute'
}

export function isLikelyLegacyRerouteTalent(talent) {
  return (talent?.size?.x ?? 0) === 0 && (talent?.size?.y ?? 0) === 0
}

/**
 * Resolve effective required talent IDs by expanding through hidden reroute nodes.
 * Returns an array of visible talent IDs.
 */
export function resolveEffectiveRequiredTalentIds(requiredTalents, talentMap) {
  if (!Array.isArray(requiredTalents) || requiredTalents.length === 0) {
    return []
  }

  const resolved = []
  const seen = new Set()

  requiredTalents.forEach((requiredTalentId) => {
    const expandedIds = expandRequiredTalentId(requiredTalentId, talentMap, new Set())
    expandedIds.forEach((expandedId) => {
      if (seen.has(expandedId)) {
        return
      }

      seen.add(expandedId)
      resolved.push(expandedId)
    })
  })

  return resolved
}

function expandRequiredTalentId(requiredTalentId, talentMap, visiting) {
  if (!requiredTalentId || visiting.has(requiredTalentId)) {
    return []
  }

  const requiredTalent = talentMap?.[requiredTalentId]
  if (!requiredTalent) {
    return [requiredTalentId]
  }

  if (!shouldHideTalent(requiredTalent)) {
    return [requiredTalentId]
  }

  const nestedRequiredTalents = requiredTalent.requiredTalents ?? []
  if (nestedRequiredTalents.length === 0) {
    return []
  }

  visiting.add(requiredTalentId)
  const nested = nestedRequiredTalents.flatMap((nestedId) => {
    return expandRequiredTalentId(nestedId, talentMap, visiting)
  })
  visiting.delete(requiredTalentId)

  return nested
}

/**
 * Resolve effective requirements with via-chain tracking (used by TalentTreeCanvas for edge routing).
 * Returns an array of { targetId, viaTalentIds } objects.
 */
export function resolveEffectiveRequirements(requiredTalents, talentMap) {
  if (!Array.isArray(requiredTalents) || requiredTalents.length === 0) {
    return []
  }

  const resolved = []
  const seen = new Set()

  requiredTalents.forEach((requiredTalentId) => {
    const expandedRequirements = expandRequiredTalentRequirement(requiredTalentId, talentMap, new Set(), [])
    expandedRequirements.forEach((expandedRequirement) => {
      const key = `${expandedRequirement.targetId}|${expandedRequirement.viaTalentIds.join('>')}`
      if (seen.has(key)) {
        return
      }

      seen.add(key)
      resolved.push(expandedRequirement)
    })
  })

  return resolved
}

function expandRequiredTalentRequirement(requiredTalentId, talentMap, visiting, viaTalentIds) {
  if (!requiredTalentId || visiting.has(requiredTalentId)) {
    return []
  }

  const requiredTalent = talentMap?.[requiredTalentId]
  if (!requiredTalent || !shouldHideTalent(requiredTalent)) {
    return [{ targetId: requiredTalentId, viaTalentIds }]
  }

  const nestedRequiredTalents = requiredTalent.requiredTalents ?? []
  if (nestedRequiredTalents.length === 0) {
    return []
  }

  visiting.add(requiredTalentId)
  const nextViaTalentIds = [...viaTalentIds, requiredTalentId]
  const nested = nestedRequiredTalents.flatMap((nestedId) => {
    return expandRequiredTalentRequirement(nestedId, talentMap, visiting, nextViaTalentIds)
  })
  visiting.delete(requiredTalentId)

  return nested
}

export function getTreeTalentPoints(treeTalents, excludedTalentId) {
  return Object.entries(treeTalents ?? {}).reduce((total, [talentId, rankValue]) => {
    if (excludedTalentId && talentId === excludedTalentId) {
      return total
    }

    const rank = Number(rankValue)
    if (!Number.isFinite(rank)) {
      return total
    }

    return total + rank
  }, 0)
}

export function summarizeTalentPoints(talentState, treeArchetypeMap, excludedTalentByTree) {
  let talentPoints = 0
  let soloPoints = 0

  Object.entries(talentState ?? {}).forEach(([treeId, talents]) => {
    const isSolo = treeArchetypeMap?.[treeId] === 'Solo'
    const treePoints = getTreeTalentPoints(talents, excludedTalentByTree?.[treeId])

    if (isSolo) {
      soloPoints += treePoints
    } else {
      talentPoints += treePoints
    }
  })

  return { talentPoints, soloPoints }
}

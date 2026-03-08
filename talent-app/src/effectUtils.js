/**
 * Effect formatting and template resolution utilities.
 */

import { extractModifierId, prettifyId } from './utils.js'

/**
 * Resolve effect template from modifier locale strings (used in App.jsx effects sidebar).
 * Looks up PositiveDescription or NegativeDescription by modifier ID.
 */
export function resolveModifierEffectTemplate(modifierId, value, localeStrings) {
  if (!modifierId) {
    return ''
  }

  const positiveDescription = localeStrings?.[`${modifierId}-PositiveDescription`] || ''
  const negativeDescription = localeStrings?.[`${modifierId}-NegativeDescription`] || ''

  if (value < 0) {
    return negativeDescription || positiveDescription || ''
  }

  return positiveDescription || negativeDescription || ''
}

/**
 * Resolve effect template from stat ID locale strings (used in TalentTreeCanvas tooltip).
 * Tries preferred sign key first, then fallback, then Title.
 */
export function resolveEffectTemplate(effect, localeStrings) {
  if (!localeStrings) return ''

  const statId = extractModifierId(effect)
  if (!statId) return ''

  const keys = {
    positiveDescriptionKey: `${statId}-PositiveDescription`,
    negativeDescriptionKey: `${statId}-NegativeDescription`,
    titleKey: `${statId}-Title`
  }

  const preferredKey = effect.value >= 0 ? keys.positiveDescriptionKey : keys.negativeDescriptionKey
  const fallbackKey = effect.value >= 0 ? keys.negativeDescriptionKey : keys.positiveDescriptionKey

  return (
    localeStrings[preferredKey]
    || localeStrings[fallbackKey]
    || localeStrings[keys.titleKey]
    || ''
  )
}

export function interpolateEffectTemplate(template, value) {
  if (!template) {
    return ''
  }

  if (!template.includes('{0}')) {
    return template
  }

  return template.replace(/\{0\}/g, formatTemplateInterpolationValue(value, template))
}

export function formatTemplateInterpolationValue(value, template) {
  if (value === null || value === undefined) return ''

  const num = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(num)) return String(value)

  const hasExplicitSignInTemplate = /[+-]\s*\{0\}/.test(template)
  const interpolationValue = hasExplicitSignInTemplate ? Math.abs(num) : num

  if (Number.isInteger(interpolationValue)) {
    return String(interpolationValue)
  }

  return interpolationValue.toFixed(2).replace(/\.0+$|(?<=\.[0-9]*[1-9])0+$/g, '')
}

export function formatModifierTotal(modifierId, value) {
  if (value === null || value === undefined) {
    return '0'
  }

  const numericValue = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numericValue)) {
    return String(value)
  }

  const suffixMatch = modifierId?.match(/_([+-]?)(%?)$/)
  const hasPercentSuffix = suffixMatch?.[2] === '%'
  const numberText = Number.isInteger(numericValue)
    ? String(numericValue)
    : numericValue.toFixed(2).replace(/\.0+$|(?<=\.[0-9]*[1-9])0+$/g, '')

  if (hasPercentSuffix) {
    return `${numberText}%`
  }

  return numberText
}

/**
 * Format a single effect line for display in talent tooltips.
 */
export function formatEffectLine(effect, localeStrings) {
  if (!effect) return ''

  const template = resolveEffectTemplate(effect, localeStrings)
  if (template) {
    return template.replace(/\{0\}/g, formatTemplateInterpolationValue(effect.value, template))
  }

  return formatEffectValue(extractModifierId(effect), effect.value)
}

export function formatEffectValue(statId, value) {
  // Extract the suffix from statId (e.g., _+%, _%, _+)
  const suffixMatch = statId.match(/_([+-]?)(%?)$/)

  let formattedValue = String(value)

  if (suffixMatch) {
    const sign = suffixMatch[1] // + or - or empty
    const isPercent = suffixMatch[2] === '%'

    // Add sign if value is positive
    if (value > 0 && sign === '+') {
      formattedValue = '+' + value
    } else if (value > 0) {
      formattedValue = '+' + value
    }

    // Add percent if suffix indicates it
    if (isPercent) {
      formattedValue += '%'
    }
  } else {
    // No special suffix, just show the value with + for positive
    if (value > 0) {
      formattedValue = '+' + value
    }
  }

  return formattedValue
}

export function localizeStatName(rawKey, localeStrings) {
  // rawKey is like '(Value="BasePhysicalDamageResistance_%")'
  const match = rawKey.match(/Value="([^"]+)"/)
  const statId = match ? match[1] : rawKey
  const isPercent = statId.includes('%')

  // Look up PositiveDescription → "+{0} Physical Resistance" or "+{0}% Cold Resistance"
  const template = localeStrings?.[`${statId}-PositiveDescription`]
    || localeStrings?.[`D_Stats:${statId}-PositiveDescription`]
    || ''

  if (template) {
    // Strip leading +/- and {0}/%  to get just the name
    const name = template.replace(/^[+-]?\{0\}%?\s*/, '').trim()
    if (name) return { name, isPercent }
  }

  // Fallback: strip Value wrapper, Base prefix, trailing _%, etc.
  const fallback = statId.replace(/[_]?[+-]?%?$/, '').replace(/^Base/, '')
  return { name: prettifyId(fallback), isPercent }
}

export function aggregateArmourStats(recipes) {
  const order = []
  const totals = {}
  for (const recipe of recipes) {
    if (!recipe.armourStats) continue
    for (const [rawKey, value] of Object.entries(recipe.armourStats)) {
      if (!(rawKey in totals)) {
        order.push(rawKey)
        totals[rawKey] = 0
      }
      totals[rawKey] += value
    }
  }
  if (order.length === 0) return null
  return order.map((rawKey) => ({ rawKey, total: totals[rawKey] }))
}

export function formatStatMap(statsMap) {
  if (!statsMap || typeof statsMap !== 'object') {
    return ''
  }

  return Object.entries(statsMap)
    .map(([key, value]) => {
      const numericValue = Number(value)
      if (!Number.isFinite(numericValue)) {
        return null
      }

      const prefix = numericValue > 0 ? '+' : ''
      return `${key}: ${prefix}${numericValue}`
    })
    .filter(Boolean)
    .join(', ')
}

/**
 * Shared generic utilities used across the talent viewer.
 */

export const resolveAppUrl = (relativePath) => new URL(relativePath, document.baseURI).toString()

export function parseNsLoc(value) {
  if (!value || typeof value !== 'string') {
    return null
  }

  const match = value.match(/NSLOCTEXT\("([^"]+)",\s*"([^"]+)",\s*"((?:[^"\\]|\\.)*)"\)/)
  if (!match) {
    return null
  }

  return {
    category: match[1],
    key: match[2],
    text: match[3].replace(/\\(["'])/g, '$1')
  }
}

export function resolveAssetImagePath(unrealPath) {
  if (!unrealPath || typeof unrealPath !== 'string' || !unrealPath.startsWith('/Game/')) {
    return null
  }

  const pathWithoutPrefix = unrealPath.slice('/Game/'.length)
  const packagePath = pathWithoutPrefix.split('.')[0]

  if (!packagePath) {
    return null
  }

  return resolveAppUrl(`Exports/Icarus/Content/${packagePath}.png`)
}

export function resolveLocalizedValue(value, localeStrings, fallbackText = '') {
  if (typeof value === 'string') {
    const parsed = parseNsLoc(value)
    if (!parsed) {
      return value || fallbackText
    }

    const scopedKey = `${parsed.category}:${parsed.key}`
    return localeStrings?.[scopedKey] || localeStrings?.[parsed.key] || parsed.text || fallbackText
  }

  if (!value || typeof value !== 'object') {
    return fallbackText
  }

  const scopedKey = value.category && value.key
    ? `${value.category}:${value.key}`
    : null

  return (
    (scopedKey && localeStrings?.[scopedKey])
    || (value.key && localeStrings?.[value.key])
    || value.text
    || fallbackText
  )
}

export function extractModifierId(effect) {
  const rawKey = effect?.rawKey
  if (!rawKey || typeof rawKey !== 'string') {
    return ''
  }

  const match = rawKey.match(/Value="([^"]+)"/)
  if (match) {
    return match[1]
  }

  return rawKey
}

export function prettifyId(text) {
  if (!text || typeof text !== 'string') return text ?? ''
  // If it looks like a proper display name (contains spaces or is NSLOCTEXT), return as-is
  if (text.includes(' ') || text.includes('NSLOCTEXT')) return text
  // Convert Foo_Bar_Baz → Foo Bar Baz
  return text.replace(/_/g, ' ')
}

export function formatList(values) {
  const normalized = Array.isArray(values) ? values.filter((value) => typeof value === 'string' && value.trim()) : []
  return normalized.join(' • ')
}

export function uniqueValues(values) {
  return Array.from(new Set(values))
}

export function areStringArraysEqual(left, right) {
  if (left.length !== right.length) {
    return false
  }

  return left.every((value, index) => value === right[index])
}

export function flattenLocalizationByKey(localeJson) {
  const byKey = {}
  if (!localeJson || typeof localeJson !== 'object') {
    return byKey
  }

  Object.entries(localeJson).forEach(([category, categoryEntries]) => {
    if (!categoryEntries || typeof categoryEntries !== 'object' || Array.isArray(categoryEntries)) {
      return
    }

    Object.entries(categoryEntries).forEach(([key, value]) => {
      if (typeof value === 'string') {
        byKey[key] = value
        byKey[`${category}:${key}`] = value
      }
    })
  })

  return byKey
}

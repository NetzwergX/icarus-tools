import { resolveLocalizedValue, prettifyId } from './utils.js'

export default function BlueprintRecipeBlock({ recipe, localeStrings, compact = false }) {
  if (!recipe) return null

  const craftedAtNames = (recipe.craftedAt ?? [])
    .map((station) => resolveLocalizedValue(station.display, localeStrings, prettifyId(station.id)))
    .filter(Boolean)

  const inputs = (recipe.inputs ?? []).map((input) => ({
    name: resolveLocalizedValue(input.display, localeStrings, prettifyId(input.staticItemId)),
    count: input.count
  }))

  return (
    <div className={`blueprint-recipe ${compact ? 'compact' : ''}`}>
      {craftedAtNames.length > 0 && (
        <div className="recipe-crafted-at">
          <span className="recipe-label">Crafted at:</span>{' '}
          <span className="recipe-value">{craftedAtNames.join(', ')}</span>
        </div>
      )}
      {inputs.length > 0 && (
        <div className="recipe-materials">
          <span className="recipe-label">Materials:</span>
          <div className="recipe-material-list">
            {inputs.map((input, i) => (
              <span key={i} className="recipe-material">
                {input.count}× {input.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

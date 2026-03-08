import { useEffect, useRef } from 'react'
import { resolveLocalizedValue, prettifyId, formatList } from './utils.js'
import { formatEffectLine, localizeStatName, aggregateArmourStats, formatStatMap } from './effectUtils.js'
import BlueprintRecipeBlock from './BlueprintRecipeBlock.jsx'

export default function TalentTooltip({ talent, currentRank, localeStrings, skilledTalents, mousePos, talentMap, modelId }) {
  const tooltipRef = useRef(null)
  const isBlueprint = modelId === 'Blueprint'
  const title = resolveLocalizedValue(talent.display, localeStrings, talent.id)
  const description = resolveLocalizedValue(talent.description, localeStrings, '')
  const itemDetails = talent.itemDetails && typeof talent.itemDetails === 'object' ? talent.itemDetails : null
  const itemDisplayName = resolveLocalizedValue(itemDetails?.display, localeStrings, '')
  const itemDescription = resolveLocalizedValue(itemDetails?.description, localeStrings, '')
  const itemFlavor = resolveLocalizedValue(itemDetails?.flavorText, localeStrings, '')

  const recipes = Array.isArray(itemDetails?.recipes) ? itemDetails.recipes : []
  const isMultiBlueprint = isBlueprint && recipes.length > 1
  const isSingleBlueprint = isBlueprint && recipes.length === 1

  // For blueprints: prefer the localized item name, fall back to talent display
  const blueprintTitle = isBlueprint
    ? (itemDisplayName || prettifyId(title))
    : prettifyId(title)

  // Armor stats summary: aggregate all armor stats across all recipes
  const hasAnyArmour = isBlueprint && recipes.some((r) => r.armourStats)
  const aggregatedArmourStats = hasAnyArmour ? aggregateArmourStats(recipes) : null

  const rewardRows = (talent.rewards ?? [])
    .map((reward, index) => {
      const rankNum = index + 1
      const isCurrentRank = rankNum === currentRank
      const effectValues = (reward.effects ?? [])
        .map((effect) => formatEffectLine(effect, localeStrings))
        .filter((line) => line && line.trim().length > 0)
        .join(', ')
        .trim()

      if (!effectValues) {
        return null
      }

      return {
        rankNum,
        isCurrentRank,
        effectValues
      }
    })
    .filter(Boolean)

  useEffect(() => {
    const node = tooltipRef.current
    if (!node) return

    const margin = 12
    const cursorOffset = 15
    let left = mousePos.x + cursorOffset
    let top = mousePos.y + cursorOffset

    const { width, height } = node.getBoundingClientRect()
    const maxLeft = window.innerWidth - width - margin
    const maxTop = window.innerHeight - height - margin

    left = Math.max(margin, Math.min(left, maxLeft))
    top = Math.max(margin, Math.min(top, maxTop))

    node.style.left = `${left}px`
    node.style.top = `${top}px`
  }, [mousePos])

  // ── Blueprint tooltip ──
  if (isBlueprint) {
    return (
      <div
        ref={tooltipRef}
        className="talent-tooltip-html blueprint-tooltip"
        style={{
          left: `${mousePos.x + 15}px`,
          top: `${mousePos.y + 15}px`
        }}
      >
        <div className="tooltip-header">
          <div className="tooltip-title">{blueprintTitle}</div>
        </div>

        {/* Description */}
        {isSingleBlueprint && itemDescription && (
          <div className="tooltip-description">{itemDescription}</div>
        )}
        {!isSingleBlueprint && description && (
          <div className="tooltip-description">{description}</div>
        )}

        {/* Flavor text */}
        {isSingleBlueprint && itemFlavor && (
          <div className="tooltip-flavor">{itemFlavor}</div>
        )}

        {/* Single item: crafted at + materials */}
        {isSingleBlueprint && (
          <BlueprintRecipeBlock recipe={recipes[0]} localeStrings={localeStrings} />
        )}

        {/* Multi-blueprint: list of unlocked blueprints with their recipes */}
        {isMultiBlueprint && (
          <div className="tooltip-blueprints">
            <div className="blueprints-header">Unlocks {recipes.length} Blueprints:</div>
            {recipes.map((recipe) => {
              const recipeName = resolveLocalizedValue(recipe.display, localeStrings, prettifyId(recipe.id))
              return (
                <div key={recipe.id} className="blueprint-entry">
                  <div className="blueprint-entry-name">{recipeName}</div>
                  <BlueprintRecipeBlock recipe={recipe} localeStrings={localeStrings} compact />
                </div>
              )
            })}
          </div>
        )}

        {/* Armor stats summary */}
        {aggregatedArmourStats && (
          <div className="tooltip-armour-summary">
            <div className="armour-summary-header">Set Armor Stats (all pieces):</div>
            {aggregatedArmourStats.map(({ rawKey, total }) => {
              const { name, isPercent } = localizeStatName(rawKey, localeStrings)
              return (
                <div key={rawKey} className="armour-stat-row">
                  <span className="armour-stat-name">{name}</span>
                  <span className="armour-stat-value">{total > 0 ? '+' : ''}{total}{isPercent ? '%' : ''}</span>
                </div>
              )
            })}
          </div>
        )}

      </div>
    )
  }

  // ── Standard talent tooltip ──
  const itemCategories = Array.isArray(itemDetails?.categories) ? itemDetails.categories.filter(Boolean) : []
  const itemTags = Array.isArray(itemDetails?.tags) ? itemDetails.tags.filter(Boolean) : []
  const durable = itemDetails?.durable
  const buildable = itemDetails?.buildable
  const deployable = itemDetails?.deployable
  const consumable = itemDetails?.consumable
  const equippable = itemDetails?.equippable
  const usable = itemDetails?.usable

  return (
    <div 
      ref={tooltipRef}
      className="talent-tooltip-html"
      style={{
        left: `${mousePos.x + 15}px`,
        top: `${mousePos.y + 15}px`
      }}
    >
      <div className="tooltip-header">
        <div className="tooltip-title">{title}</div>
      </div>

      {description && <div className="tooltip-description">{description}</div>}

      {itemDetails && (
        <div className="tooltip-rewards">
          {itemDisplayName && itemDisplayName !== title && (
            <div className="reward-row">
              <span className="rank-label">Item:</span>
              <span className="rank-value">{itemDisplayName}</span>
            </div>
          )}
          {itemDescription && itemDescription !== description && (
            <div className="reward-row">
              <span className="rank-label">Details:</span>
              <span className="rank-value">{itemDescription}</span>
            </div>
          )}
          {itemFlavor && (
            <div className="reward-row">
              <span className="rank-label">Flavor:</span>
              <span className="rank-value">{itemFlavor}</span>
            </div>
          )}
          {itemCategories.length > 0 && (
            <div className="reward-row">
              <span className="rank-label">Categories:</span>
              <span className="rank-value">{itemCategories.join(', ')}</span>
            </div>
          )}
          {itemTags.length > 0 && (
            <div className="reward-row">
              <span className="rank-label">Tags:</span>
              <span className="rank-value">{itemTags.join(', ')}</span>
            </div>
          )}
          {Number.isFinite(Number(itemDetails?.weight)) && (
            <div className="reward-row">
              <span className="rank-label">Weight:</span>
              <span className="rank-value">{Number(itemDetails.weight)}</span>
            </div>
          )}
          {Number.isFinite(Number(itemDetails?.maxStack)) && (
            <div className="reward-row">
              <span className="rank-label">Max Stack:</span>
              <span className="rank-value">{Number(itemDetails.maxStack)}</span>
            </div>
          )}

          {durable && (
            <>
              <div className="reward-row">
                <span className="rank-label">Durability:</span>
                <span className="rank-value">
                  {formatList([
                    `Max ${Number.isFinite(Number(durable.maxDurability)) ? Number(durable.maxDurability) : 'n/a'}`,
                    durable.destroyedAtZero ? 'Destroyed at 0' : 'Repairable at 0'
                  ])}
                </span>
              </div>
              {Array.isArray(durable.repairItems) && durable.repairItems.length > 0 && (
                <div className="reward-row">
                  <span className="rank-label">Repair:</span>
                  <span className="rank-value">
                    {durable.repairItems
                      .map((entry) => {
                        const name = resolveLocalizedValue(entry?.display, localeStrings, entry?.itemableId || entry?.staticItemId || '')
                        const amount = Number.isFinite(Number(entry?.amount)) ? Number(entry.amount) : null
                        return amount !== null ? `${amount}x ${name}` : name
                      })
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
            </>
          )}

          {buildable && (
            <div className="reward-row">
              <span className="rank-label">Buildable:</span>
              <span className="rank-value">
                {formatList([
                  buildable.typeId ? `Type ${buildable.typeId}` : '',
                  buildable.pieceType ? `Piece ${buildable.pieceType}` : '',
                  Number.isFinite(Number(buildable.variationCount)) ? `Variations ${Number(buildable.variationCount)}` : '',
                  Number.isFinite(Number(buildable.talentGatedVariationCount))
                    ? `Talent-gated ${Number(buildable.talentGatedVariationCount)}`
                    : ''
                ])}
              </span>
            </div>
          )}

          {deployable && (
            <div className="reward-row">
              <span className="rank-label">Deployable:</span>
              <span className="rank-value">
                {formatList([
                  Number.isFinite(Number(deployable.variantCount)) ? `Variants ${Number(deployable.variantCount)}` : '',
                  deployable.affectedByWeather ? 'Affected by weather' : '',
                  deployable.mustBeOutside ? 'Must be outside' : '',
                  deployable.forceShowShelterIcon ? 'Shelter icon forced' : ''
                ])}
              </span>
            </div>
          )}

          {consumable && (
            <>
              {Object.keys(consumable.stats ?? {}).length > 0 && (
                <div className="reward-row">
                  <span className="rank-label">Consumable stats:</span>
                  <span className="rank-value">{formatStatMap(consumable.stats)}</span>
                </div>
              )}
              <div className="reward-row">
                <span className="rank-label">Consumable:</span>
                <span className="rank-value">
                  {formatList([
                    consumable.modifierId ? `Modifier ${consumable.modifierId}` : '',
                    Number.isFinite(Number(consumable.modifierLifetime)) ? `Duration ${Number(consumable.modifierLifetime)}` : '',
                    Array.isArray(consumable.byproducts) && consumable.byproducts.length > 0
                      ? `Byproducts ${consumable.byproducts.join(', ')}`
                      : ''
                  ])}
                </span>
              </div>
            </>
          )}

          {equippable && (
            <>
              {Object.keys(equippable.grantedStats ?? {}).length > 0 && (
                <div className="reward-row">
                  <span className="rank-label">Granted stats:</span>
                  <span className="rank-value">{formatStatMap(equippable.grantedStats)}</span>
                </div>
              )}
              {Object.keys(equippable.globalStats ?? {}).length > 0 && (
                <div className="reward-row">
                  <span className="rank-label">Global stats:</span>
                  <span className="rank-value">{formatStatMap(equippable.globalStats)}</span>
                </div>
              )}
              <div className="reward-row">
                <span className="rank-label">Equippable:</span>
                <span className="rank-value">
                  {formatList([
                    equippable.appliesInAllInventories ? 'Applies in all inventories' : '',
                    equippable.diminishingReturns ? 'Diminishing returns' : ''
                  ])}
                </span>
              </div>
            </>
          )}

          {usable && (
            <div className="reward-row">
              <span className="rank-label">Usable:</span>
              <span className="rank-value">
                {formatList([
                  Array.isArray(usable.uses) && usable.uses.length > 0 ? `Uses ${usable.uses.join(', ')}` : '',
                  usable.alwaysShowContextMenu ? 'Always show context menu' : ''
                ])}
              </span>
            </div>
          )}
        </div>
      )}

      {rewardRows.length ? (
        <div className="tooltip-rewards">
          {rewardRows.map(({ rankNum, isCurrentRank, effectValues }, index) => {
            return (
              <div key={`reward-${index}`} className={`reward-row ${isCurrentRank ? 'current-rank' : ''}`}>
                <span className="rank-label">Rank {rankNum}:</span>
                <span className="rank-value">{effectValues}</span>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

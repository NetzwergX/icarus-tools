import { useDropdown } from './useDropdown.js'
import GameImage from './GameImage.jsx'

export default function CreatureArchetypeDropdown({
  groupId,
  groupLabel,
  groupIconPath,
  options,
  selectedOptionId,
  isActive,
  onSelectOption
}) {
  const { isOpen, setIsOpen, toggle, containerRef } = useDropdown()

  const selectedOption = options.find((option) => option.id === selectedOptionId) ?? null
  const selectedLabel = selectedOption?.label || 'Select'

  return (
    <div className="creature-meta-dropdown" ref={containerRef}>
      <button
        type="button"
        className={`meta-chip creature-meta-dropdown-trigger ${isActive ? 'active' : ''}`.trim()}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`creature-meta-menu-${groupId}`}
        onClick={toggle}
      >
        {groupIconPath ? (
          <GameImage
            src={groupIconPath}
            alt=""
            className="meta-chip-icon"
          />
        ) : null}
        <span className="meta-chip-label">{groupLabel}</span>
        <span className="creature-meta-selected" title={selectedLabel}>
          {selectedOption?.iconPath ? (
            <GameImage
              src={selectedOption.iconPath}
              alt=""
              className="creature-meta-option-icon"
            />
          ) : null}
          <span className="creature-meta-selected-label">{selectedLabel}</span>
        </span>
        <span className="creature-meta-caret" aria-hidden="true">▾</span>
      </button>

      {isOpen && (
        <div
          className="creature-meta-menu"
          id={`creature-meta-menu-${groupId}`}
          role="listbox"
          aria-label={`${groupLabel} archetypes`}
        >
          {options.map((option) => {
            const isSelected = option.id === selectedOptionId

            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`creature-meta-option ${isSelected ? 'active' : ''}`.trim()}
                onClick={() => {
                  onSelectOption(option.id)
                  setIsOpen(false)
                }}
              >
                {option.iconPath ? (
                  <GameImage
                    src={option.iconPath}
                    alt=""
                    className="creature-meta-option-icon"
                  />
                ) : null}
                <span className="creature-meta-option-label">{option.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

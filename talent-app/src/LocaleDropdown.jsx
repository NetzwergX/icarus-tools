import { BR, CN, DE, ES, FR, GB, JP, KR, RU, TW } from 'country-flag-icons/react/3x2'
import { useDropdown } from './useDropdown.js'
import { getLocaleLabel } from './localeUtils.js'

const LOCALE_FLAG_COMPONENTS = {
  'de-DE': DE,
  en: GB,
  'es-419': ES,
  'fr-FR': FR,
  'ja-JP': JP,
  'ko-KR': KR,
  'pt-BR': BR,
  'ru-RU': RU,
  'zh-Hans': CN,
  'zh-Hant': TW
}

export default function LocaleDropdown({ locales, selectedLocale, onSelectLocale }) {
  const { isOpen, setIsOpen, toggle, containerRef } = useDropdown()

  const selectedLabel = getLocaleLabel(selectedLocale)
  const SelectedFlag = LOCALE_FLAG_COMPONENTS[selectedLocale] ?? null

  return (
    <div className="locale-dropdown" ref={containerRef}>
      <button
        type="button"
        className="locale-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={toggle}
      >
        <span className="locale-trigger-content">
          {SelectedFlag ? <SelectedFlag className="locale-flag" title="" /> : null}
          <span className="locale-trigger-label">{selectedLabel}</span>
        </span>
        <span className="locale-trigger-caret">▾</span>
      </button>

      {isOpen && (
        <div className="locale-menu" role="listbox" aria-label="Language">
          {locales.map((localeCode) => {
            const LocaleFlag = LOCALE_FLAG_COMPONENTS[localeCode] ?? null
            const isActive = localeCode === selectedLocale

            return (
              <button
                key={localeCode}
                type="button"
                role="option"
                aria-selected={isActive}
                className={`locale-option ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectLocale(localeCode)
                  setIsOpen(false)
                }}
              >
                {LocaleFlag ? <LocaleFlag className="locale-flag" title="" /> : null}
                <span>{getLocaleLabel(localeCode)}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

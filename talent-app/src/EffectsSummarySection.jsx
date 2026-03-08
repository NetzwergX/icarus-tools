function EffectsSummarySection({ rows }) {
  const hasFallbackValue = rows.some((entry) => entry.hasFallbackValue)

  return (
    <div className="effects-table-wrap">
      <table className="effects-table" aria-label="Aggregated effects">
        <tbody>
          {rows.length > 0 ? (
            rows.map((entry) => (
              <tr key={entry.modifierId}>
                <td className="effects-effect-cell" title={entry.modifierId}>{entry.displayText}</td>
                {hasFallbackValue ? (
                  <td className="effects-total-column">{entry.hasFallbackValue ? entry.fallbackValue : ''}</td>
                ) : null}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={hasFallbackValue ? 2 : 1} className="effects-empty">No active effects from selected talents.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default EffectsSummarySection

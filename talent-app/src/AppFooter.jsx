function AppFooter({ projectVersion, calculatorVersion, onOpenDisclaimer }) {
  return (
    <footer className="app-footer" role="contentinfo">
      <div className="footer-build-meta">
        Version: {calculatorVersion} ({projectVersion})
      </div>
      <button
        type="button"
        className="footer-disclaimer-link"
        onClick={onOpenDisclaimer}
      >
        ICARUS and related materials are trademarks and copyrighted works of <strong>RocketWerkz</strong>. All rights reserved. This site is not affiliated with or endorsed by <strong>RocketWerkz</strong>.
      </button>
    </footer>
  )
}

export default AppFooter

import { ROCKETWERKZ_URL, ICARUS_STEAM_URL } from './constants.js'

function DisclaimerDialog({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="confirm-overlay" role="presentation" onClick={onClose}>
      <div
        className="confirm-dialog legal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-disclaimer-title"
        aria-describedby="legal-disclaimer-body"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="legal-disclaimer-title" className="confirm-title">Legal Disclaimer</h2>
        <p id="legal-disclaimer-body" className="confirm-body legal-disclaimer-body">
          The files on this Wiki comes from
          {' '}
          <a href={ICARUS_STEAM_URL} target="_blank" rel="noreferrer"><strong>ICARUS</strong></a>
          {' '}
          (data files or gameplay), from websites, or from any other content created and owned by
          {' '}
          <a href={ROCKETWERKZ_URL} target="_blank" rel="noreferrer"><strong>RocketWerkz</strong></a>
          , who hold the copyright of
          {' '}
          <a href={ICARUS_STEAM_URL} target="_blank" rel="noreferrer"><strong>ICARUS</strong></a>
          . Unless specified otherwise, all trademarks and registered trademarks present in this Wiki and all sub-pages are proprietary to
          {' '}
          <a href={ROCKETWERKZ_URL} target="_blank" rel="noreferrer"><strong>RocketWerkz</strong></a>
          . The use of images to illustrate articles concerning the subject of the images in question is believed to qualify as fair use under United States copyright law, as such display does not significantly impede the right of the copyright holder to sell the copyrighted material.
        </p>
        <div className="confirm-actions">
          <button type="button" className="confirm-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default DisclaimerDialog

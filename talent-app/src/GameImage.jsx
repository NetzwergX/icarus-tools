/**
 * Image component that hides itself on error (broken/missing image fallback).
 * Replaces the repeated `onError={(e) => { e.target.style.display = 'none' }}` pattern.
 */
function GameImage({ src, alt = '', className, title, ...rest }) {
  if (!src) return null

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      title={title}
      onError={(event) => {
        event.target.style.display = 'none'
      }}
      {...rest}
    />
  )
}

export default GameImage

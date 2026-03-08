import { useEffect, useRef, useState } from 'react'

/**
 * Shared hook for dropdown menus with click-outside and Escape-to-close behavior.
 *
 * Returns:
 *   isOpen       — current open state
 *   setIsOpen    — setter for open state
 *   toggle       — convenience toggle function
 *   containerRef — ref to attach to the dropdown container element
 */
export function useDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const handleDocumentClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const toggle = () => setIsOpen((previous) => !previous)

  return { isOpen, setIsOpen, toggle, containerRef }
}

export default useDropdown

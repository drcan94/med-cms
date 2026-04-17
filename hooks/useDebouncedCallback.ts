import { useCallback, useEffect, useRef } from "react"

/**
 * Debounced callback with cancel + flush (run immediately).
 * Useful for text autosave while allowing instant flush on blur or high-priority fields.
 */
export function useDebouncedCallback<T extends unknown[]>(
  fn: (...args: T) => void | Promise<void>,
  delayMs: number
) {
  const fnRef = useRef(fn)
  useEffect(() => {
    fnRef.current = fn
  }, [fn])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const run = useCallback(
    (...args: T) => {
      cancel()
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        void fnRef.current(...args)
      }, delayMs)
    },
    [cancel, delayMs]
  )

  const flush = useCallback((...args: T) => {
    cancel()
    void fnRef.current(...args)
  }, [cancel])

  useEffect(() => () => cancel(), [cancel])

  return { run, cancel, flush }
}

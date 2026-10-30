import { useEffect, useState } from 'react'

/**
 * Generic data-fetching hook.
 * @param {Function} fetchFn  – async function returning data
 * @param {Array}    deps     – dependency array (re-fetches on change)
 */
export function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn()
      setData(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refetch()
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch }
}

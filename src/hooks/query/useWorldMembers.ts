import { useQuery } from '@tanstack/react-query'

export function useWorldMembers(worldId: string) {
  return useQuery({
    queryKey: ['world-members', worldId],
    queryFn: async () => {
      if (!worldId) {
        throw new Error('World ID is required')
      }

      const response = await fetch(`/api/worlds/${worldId}/members`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data.members
    },
    enabled: !!worldId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  })
}

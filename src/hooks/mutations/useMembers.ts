import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useUpdateMemberRole(worldId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const response = await fetch(`/api/worlds/${worldId}/members`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ memberId, role }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data.member
    },
    onSuccess: () => {
      // Invalidate and refetch members
      queryClient.invalidateQueries({ queryKey: ['world-members', worldId] })
    },
  })
}

export function useRemoveMember(worldId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (memberId: string) => {
      const response = await fetch(`/api/worlds/${worldId}/members?memberId=${encodeURIComponent(memberId)}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch members
      queryClient.invalidateQueries({ queryKey: ['world-members', worldId] })
    },
  })
}

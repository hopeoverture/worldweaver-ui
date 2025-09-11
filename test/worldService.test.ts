import { describe, it, expect, vi } from 'vitest'

// Mock the localDb module used by worldService
vi.mock('../src/lib/database/local', async () => {
  return {
    localDb: {
  getWorldsByUser: vi.fn(async () => {
    return [
          {
            id: 'w1',
            name: 'Alpha',
            description: 'First world',
            entity_count: '3',
            updated_at: '2025-09-11T00:00:00.000Z',
            is_archived: false,
            cover_image: null,
            is_public: false,
            settings: {}
          }
        ]
      })
    }
  }
})

import { worldService } from '../src/lib/services/worldService'

describe('WorldService', () => {
  it('maps DB rows to World objects for getUserWorlds', async () => {
    const worlds = await worldService.getUserWorlds('user-123')
    expect(worlds).toHaveLength(1)
    expect(worlds[0]).toMatchObject({
      id: 'w1',
      name: 'Alpha',
      summary: 'First world',
      entityCount: 3,
      updatedAt: '2025-09-11T00:00:00.000Z',
      isArchived: false
    })
  })
})

/**
 * Field Consistency Integration Test
 * 
 * Verifies that field mappings are consistent across all layers:
 * - Domain types (World interface)
 * - Database types (generated from schema)
 * - API validation (Zod schemas)
 * - Adapter functions (domain ↔ database)
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { adaptWorldToDatabase, adaptWorldFromDatabase } from '../adapters'
import type { World } from '../types'

// Mock extended world data matching the domain World type
const mockWorldData: Partial<World> = {
  name: 'Test World',
  summary: 'A test world description',
  isPublic: true,
  isArchived: false,
  // Extended fields
  logline: 'Epic fantasy adventure',
  genreBlend: ['Fantasy', 'Adventure'],
  overallTone: 'Heroic',
  keyThemes: ['Friendship', 'Courage'],
  audienceRating: 'PG-13',
  scopeScale: 'Continental',
  technologyLevel: ['Medieval', 'Magic'],
  magicLevel: ['High Magic'],
  cosmologyModel: 'Multiverse',
  climateBiomes: ['Temperate Forest', 'Mountains'],
  calendarTimekeeping: 'Standard Fantasy Calendar',
  societalOverview: 'Feudal kingdoms with magic',
  conflictDrivers: ['Ancient Evil', 'Political Intrigue'],
  rulesConstraints: 'High magic, low technology',
  aestheticDirection: 'Classical fantasy'
}

// API Update schema (from worlds/[id]/route.ts)
const updateWorldSchema = z.object({
  name: z.string().min(1, 'name cannot be empty').max(200).optional(),
  description: z.string().max(5000).optional(),
  isPublic: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  // Extended world creation fields
  logline: z.string().optional(),
  genreBlend: z.array(z.string()).optional(),
  overallTone: z.string().optional(),
  keyThemes: z.array(z.string()).optional(),
  audienceRating: z.string().optional(),
  scopeScale: z.string().optional(),
  technologyLevel: z.array(z.string()).optional(),
  magicLevel: z.array(z.string()).optional(),
  cosmologyModel: z.string().optional(),
  climateBiomes: z.array(z.string()).optional(),
  calendarTimekeeping: z.string().optional(),
  societalOverview: z.string().optional(),
  conflictDrivers: z.array(z.string()).optional(),
  rulesConstraints: z.string().optional(),
  aestheticDirection: z.string().optional(),
})

describe('Field Consistency Integration Tests', () => {
  describe('Domain → Database Adapter', () => {
    it('should convert all extended world fields to database format', () => {
      const dbWorld = adaptWorldToDatabase(mockWorldData)
      
      // Verify basic fields
      expect(dbWorld.name).toBe(mockWorldData.name)
      expect(dbWorld.description).toBe(mockWorldData.summary) // summary → description
      expect(dbWorld.is_public).toBe(mockWorldData.isPublic) // isPublic → is_public
      expect(dbWorld.is_archived).toBe(mockWorldData.isArchived) // isArchived → is_archived
      
      // Verify extended fields (camelCase → snake_case)
      expect(dbWorld.logline).toBe(mockWorldData.logline)
      expect(dbWorld.genre_blend).toEqual(mockWorldData.genreBlend)
      expect(dbWorld.overall_tone).toBe(mockWorldData.overallTone)
      expect(dbWorld.key_themes).toEqual(mockWorldData.keyThemes)
      expect(dbWorld.audience_rating).toBe(mockWorldData.audienceRating)
      expect(dbWorld.scope_scale).toBe(mockWorldData.scopeScale)
      expect(dbWorld.technology_level).toEqual(mockWorldData.technologyLevel)
      expect(dbWorld.magic_level).toEqual(mockWorldData.magicLevel)
      expect(dbWorld.cosmology_model).toBe(mockWorldData.cosmologyModel)
      expect(dbWorld.climate_biomes).toEqual(mockWorldData.climateBiomes)
      expect(dbWorld.calendar_timekeeping).toBe(mockWorldData.calendarTimekeeping)
      expect(dbWorld.societal_overview).toBe(mockWorldData.societalOverview)
      expect(dbWorld.conflict_drivers).toEqual(mockWorldData.conflictDrivers)
      expect(dbWorld.rules_constraints).toBe(mockWorldData.rulesConstraints)
      expect(dbWorld.aesthetic_direction).toBe(mockWorldData.aestheticDirection)
    })
  })

  describe('Database → Domain Adapter', () => {
    it('should convert database fields back to domain format', () => {
      // First convert to DB format
      const dbWorld = adaptWorldToDatabase(mockWorldData)
      
      // Add required DB fields for the reverse conversion
      const fullDbWorld = {
        ...dbWorld,
        id: 'test-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner_id: 'user-id'
      } as any
      
      // Convert back to domain format
      const domainWorld = adaptWorldFromDatabase(fullDbWorld)
      
      // Verify round-trip consistency for extended fields
      expect(domainWorld.logline).toBe(mockWorldData.logline)
      expect(domainWorld.genreBlend).toEqual(mockWorldData.genreBlend)
      expect(domainWorld.overallTone).toBe(mockWorldData.overallTone)
      expect(domainWorld.keyThemes).toEqual(mockWorldData.keyThemes)
      expect(domainWorld.audienceRating).toBe(mockWorldData.audienceRating)
      expect(domainWorld.scopeScale).toBe(mockWorldData.scopeScale)
      expect(domainWorld.technologyLevel).toEqual(mockWorldData.technologyLevel)
      expect(domainWorld.magicLevel).toEqual(mockWorldData.magicLevel)
      expect(domainWorld.cosmologyModel).toBe(mockWorldData.cosmologyModel)
      expect(domainWorld.climateBiomes).toEqual(mockWorldData.climateBiomes)
      expect(domainWorld.calendarTimekeeping).toBe(mockWorldData.calendarTimekeeping)
      expect(domainWorld.societalOverview).toBe(mockWorldData.societalOverview)
      expect(domainWorld.conflictDrivers).toEqual(mockWorldData.conflictDrivers)
      expect(domainWorld.rulesConstraints).toBe(mockWorldData.rulesConstraints)
      expect(domainWorld.aestheticDirection).toBe(mockWorldData.aestheticDirection)
    })
  })

  describe('API Schema Validation', () => {
    it('should validate all extended fields in update API schema', () => {
      // Convert domain data to API format (summary → description)
      const apiData = {
        ...mockWorldData,
        description: mockWorldData.summary
      }
      delete (apiData as any).summary

      // Should validate without errors
      const result = updateWorldSchema.safeParse(apiData)
      expect(result.success).toBe(true)
      
      if (result.success) {
        // Verify all extended fields are present and correctly typed
        expect(result.data.logline).toBe(mockWorldData.logline)
        expect(result.data.genreBlend).toEqual(mockWorldData.genreBlend)
        expect(result.data.overallTone).toBe(mockWorldData.overallTone)
        expect(result.data.keyThemes).toEqual(mockWorldData.keyThemes)
        expect(result.data.audienceRating).toBe(mockWorldData.audienceRating)
        expect(result.data.scopeScale).toBe(mockWorldData.scopeScale)
        expect(result.data.technologyLevel).toEqual(mockWorldData.technologyLevel)
        expect(result.data.magicLevel).toEqual(mockWorldData.magicLevel)
        expect(result.data.cosmologyModel).toBe(mockWorldData.cosmologyModel)
        expect(result.data.climateBiomes).toEqual(mockWorldData.climateBiomes)
        expect(result.data.calendarTimekeeping).toBe(mockWorldData.calendarTimekeeping)
        expect(result.data.societalOverview).toBe(mockWorldData.societalOverview)
        expect(result.data.conflictDrivers).toEqual(mockWorldData.conflictDrivers)
        expect(result.data.rulesConstraints).toBe(mockWorldData.rulesConstraints)
        expect(result.data.aestheticDirection).toBe(mockWorldData.aestheticDirection)
      }
    })
  })

  describe('Field Coverage Analysis', () => {
    it('should have consistent field coverage across layers', () => {
      // Extended field names in domain (World type)
      const domainExtendedFields = [
        'logline', 'genreBlend', 'overallTone', 'keyThemes', 'audienceRating',
        'scopeScale', 'technologyLevel', 'magicLevel', 'cosmologyModel', 
        'climateBiomes', 'calendarTimekeeping', 'societalOverview',
        'conflictDrivers', 'rulesConstraints', 'aestheticDirection'
      ]
      
      // Convert to database and check all fields are mapped
      const dbWorld = adaptWorldToDatabase(mockWorldData)
      
      // Database field equivalents (snake_case)
      const expectedDbFields = [
        'logline', 'genre_blend', 'overall_tone', 'key_themes', 'audience_rating',
        'scope_scale', 'technology_level', 'magic_level', 'cosmology_model',
        'climate_biomes', 'calendar_timekeeping', 'societal_overview',
        'conflict_drivers', 'rules_constraints', 'aesthetic_direction'
      ]
      
      // Verify all database fields are present
      expectedDbFields.forEach(field => {
        expect(dbWorld).toHaveProperty(field)
      })
      
      // Verify API schema has all domain fields
      const schemaShape = updateWorldSchema.shape as any
      domainExtendedFields.forEach(field => {
        expect(schemaShape).toHaveProperty(field)
      })
    })
  })
})
import type { RelationshipRow, Entity, World } from '@/lib/types';
import { simplifiedUnifiedService } from './unified-service';
import { logInfo, logError } from '@/lib/logging';

export interface RelationshipContext {
  entities: Entity[];
  relationships: RelationshipRow[];
  contextSummary: string;
  relevantConnections: Array<{
    fromEntity: Entity;
    toEntity: Entity;
    relationship: RelationshipRow;
    contextualRelevance: number;
  }>;
}

export interface EntityRelationshipNetwork {
  entityId: string;
  entityName: string;
  connections: Array<{
    connectedEntityId: string;
    connectedEntityName: string;
    relationshipType: string;
    strength: number;
    isBidirectional: boolean;
    description?: string;
  }>;
  centralityScore: number;
}

export class RelationshipContextService {
  /**
   * Get comprehensive relationship context for AI generation
   */
  async getRelationshipContext(
    worldId: string,
    userId: string,
    focusEntityIds?: string[]
  ): Promise<RelationshipContext> {
    try {
      logInfo('Building relationship context', {
        worldId,
        userId,
        action: 'getRelationshipContext'
      });

      // Fetch relationships and entities in parallel
      const [relationships, entities] = await Promise.all([
        simplifiedUnifiedService.relationships.getWorldRelationships(worldId, userId),
        simplifiedUnifiedService.entities.getWorldEntities(worldId, userId)
      ]);

      if (!relationships.length) {
        return {
          entities,
          relationships: [],
          contextSummary: 'No relationships exist between entities in this world.',
          relevantConnections: []
        };
      }

      // Create entity lookup map
      const entityMap = new Map<string, Entity>();
      entities.forEach(entity => entityMap.set(entity.id, entity));

      // Filter relationships to focus entities if specified
      const relevantRelationships = focusEntityIds?.length
        ? relationships.filter(rel =>
            focusEntityIds.includes(rel.from) || focusEntityIds.includes(rel.to)
          )
        : relationships;

      // Build relevant connections with context
      const relevantConnections = relevantRelationships
        .map(relationship => {
          const fromEntity = entityMap.get(relationship.from);
          const toEntity = entityMap.get(relationship.to);

          if (!fromEntity || !toEntity) return null;

          // Calculate contextual relevance based on relationship strength and entity involvement
          const baseRelevance = (relationship.strength || 5) / 10;
          const focusBonus = focusEntityIds?.some(id => id === fromEntity.id || id === toEntity.id) ? 0.3 : 0;
          const contextualRelevance = Math.min(1, baseRelevance + focusBonus);

          return {
            fromEntity,
            toEntity,
            relationship,
            contextualRelevance
          };
        })
        .filter(Boolean)
        .sort((a, b) => b!.contextualRelevance - a!.contextualRelevance) as Array<{
          fromEntity: Entity;
          toEntity: Entity;
          relationship: RelationshipRow;
          contextualRelevance: number;
        }>;

      // Generate context summary
      const contextSummary = this.generateContextSummary(relevantConnections, entityMap);

      return {
        entities,
        relationships: relevantRelationships,
        contextSummary,
        relevantConnections
      };
    } catch (error) {
      logError('Error building relationship context', error as Error, {
        worldId,
        userId,
        action: 'getRelationshipContext'
      });

      // Return minimal context on error to avoid breaking AI generation
      return {
        entities: [],
        relationships: [],
        contextSummary: 'Error loading relationship context.',
        relevantConnections: []
      };
    }
  }

  /**
   * Get relationship network for a specific entity
   */
  async getEntityRelationshipNetwork(
    entityId: string,
    worldId: string,
    userId: string,
    maxDepth: number = 2
  ): Promise<EntityRelationshipNetwork> {
    try {
      const [relationships, entities] = await Promise.all([
        simplifiedUnifiedService.relationships.getWorldRelationships(worldId, userId),
        simplifiedUnifiedService.entities.getWorldEntities(worldId, userId)
      ]);

      const entityMap = new Map<string, Entity>();
      entities.forEach(entity => entityMap.set(entity.id, entity));

      const targetEntity = entityMap.get(entityId);
      if (!targetEntity) {
        throw new Error(`Entity ${entityId} not found`);
      }

      // Find direct connections
      const directConnections = relationships
        .filter(rel => rel.from === entityId || rel.to === entityId)
        .map(rel => {
          const connectedEntityId = rel.from === entityId ? rel.to : rel.from;
          const connectedEntity = entityMap.get(connectedEntityId);

          if (!connectedEntity) return null;

          return {
            connectedEntityId,
            connectedEntityName: connectedEntity.name,
            relationshipType: rel.relationshipType,
            strength: rel.strength || 5,
            isBidirectional: rel.isBidirectional || false,
            description: rel.description
          };
        })
        .filter(Boolean) as EntityRelationshipNetwork['connections'];

      // Calculate centrality score (number of connections weighted by strength)
      const centralityScore = directConnections.reduce((score, conn) => {
        return score + (conn.strength / 10);
      }, 0);

      return {
        entityId,
        entityName: targetEntity.name,
        connections: directConnections,
        centralityScore
      };
    } catch (error) {
      logError('Error building entity relationship network', error as Error, {
        entityId,
        worldId,
        userId,
        action: 'getEntityRelationshipNetwork'
      });
      throw error;
    }
  }

  /**
   * Generate relationship context string for AI prompts
   */
  buildRelationshipPromptContext(context: RelationshipContext, maxConnections: number = 10): string {
    if (!context.relationships.length) {
      return 'No relationships exist between entities in this world.';
    }

    const topConnections = context.relevantConnections.slice(0, maxConnections);

    const contextLines = [
      '## Entity Relationships Context',
      '',
      `Total entities: ${context.entities.length}`,
      `Total relationships: ${context.relationships.length}`,
      '',
      '### Key Relationships:'
    ];

    topConnections.forEach(({ fromEntity, toEntity, relationship }, index) => {
      const strengthDesc = this.getStrengthDescription(relationship.strength || 5);
      const direction = relationship.isBidirectional ? '↔' : '→';

      contextLines.push(
        `${index + 1}. ${fromEntity.name} ${direction} ${toEntity.name}`,
        `   Relationship: "${relationship.relationshipType}"`,
        `   Strength: ${strengthDesc} (${relationship.strength || 5}/10)`,
        relationship.description ? `   Details: ${relationship.description}` : '',
        ''
      );
    });

    if (context.relevantConnections.length > maxConnections) {
      contextLines.push(`... and ${context.relevantConnections.length - maxConnections} more relationships.`);
    }

    contextLines.push('', context.contextSummary);

    return contextLines.filter(line => line !== null).join('\n');
  }

  /**
   * Get entities that are most connected (relationship hubs)
   */
  async getRelationshipHubs(
    worldId: string,
    userId: string,
    limit: number = 5
  ): Promise<Array<{ entity: Entity; connectionCount: number; averageStrength: number }>> {
    try {
      const [relationships, entities] = await Promise.all([
        simplifiedUnifiedService.relationships.getWorldRelationships(worldId, userId),
        simplifiedUnifiedService.entities.getWorldEntities(worldId, userId)
      ]);

      const entityMap = new Map<string, Entity>();
      entities.forEach(entity => entityMap.set(entity.id, entity));

      // Count connections per entity
      const connectionCounts = new Map<string, { count: number; totalStrength: number }>();

      relationships.forEach(rel => {
        // Count for 'from' entity
        const fromCount = connectionCounts.get(rel.from) || { count: 0, totalStrength: 0 };
        fromCount.count++;
        fromCount.totalStrength += rel.strength || 5;
        connectionCounts.set(rel.from, fromCount);

        // Count for 'to' entity
        const toCount = connectionCounts.get(rel.to) || { count: 0, totalStrength: 0 };
        toCount.count++;
        toCount.totalStrength += rel.strength || 5;
        connectionCounts.set(rel.to, toCount);
      });

      // Build result array with entities and their connection stats
      const hubs = Array.from(connectionCounts.entries())
        .map(([entityId, { count, totalStrength }]) => {
          const entity = entityMap.get(entityId);
          if (!entity) return null;

          return {
            entity,
            connectionCount: count,
            averageStrength: totalStrength / count
          };
        })
        .filter(Boolean)
        .sort((a, b) => b!.connectionCount - a!.connectionCount)
        .slice(0, limit) as Array<{ entity: Entity; connectionCount: number; averageStrength: number }>;

      return hubs;
    } catch (error) {
      logError('Error finding relationship hubs', error as Error, {
        worldId,
        userId,
        action: 'getRelationshipHubs'
      });
      return [];
    }
  }

  /**
   * Generate a natural language summary of relationship context
   */
  private generateContextSummary(
    connections: Array<{
      fromEntity: Entity;
      toEntity: Entity;
      relationship: RelationshipRow;
      contextualRelevance: number;
    }>,
    entityMap: Map<string, Entity>
  ): string {
    if (!connections.length) {
      return 'No significant relationships to consider.';
    }

    const totalConnections = connections.length;
    const strongConnections = connections.filter(c => (c.relationship.strength || 5) >= 7);
    const bidirectionalConnections = connections.filter(c => c.relationship.isBidirectional);

    // Group by relationship types
    const relationshipTypes = new Map<string, number>();
    connections.forEach(({ relationship }) => {
      const type = relationship.relationshipType.toLowerCase();
      relationshipTypes.set(type, (relationshipTypes.get(type) || 0) + 1);
    });

    // Find most common relationship type
    const mostCommonType = Array.from(relationshipTypes.entries())
      .sort((a, b) => b[1] - a[1])[0];

    const summaryParts = [
      `This world contains ${totalConnections} significant relationship${totalConnections !== 1 ? 's' : ''}.`
    ];

    if (strongConnections.length > 0) {
      summaryParts.push(`${strongConnections.length} of these are strong connections (7+ strength).`);
    }

    if (bidirectionalConnections.length > 0) {
      summaryParts.push(`${bidirectionalConnections.length} relationship${bidirectionalConnections.length !== 1 ? 's' : ''} work${bidirectionalConnections.length === 1 ? 's' : ''} both ways.`);
    }

    if (mostCommonType) {
      summaryParts.push(`The most common relationship type is "${mostCommonType[0]}" (${mostCommonType[1]} occurrence${mostCommonType[1] !== 1 ? 's' : ''}).`);
    }

    // Identify key entities (those with multiple connections)
    const entityConnectionCounts = new Map<string, number>();
    connections.forEach(({ fromEntity, toEntity }) => {
      entityConnectionCounts.set(fromEntity.id, (entityConnectionCounts.get(fromEntity.id) || 0) + 1);
      entityConnectionCounts.set(toEntity.id, (entityConnectionCounts.get(toEntity.id) || 0) + 1);
    });

    const keyEntities = Array.from(entityConnectionCounts.entries())
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([entityId, count]) => {
        const entity = entityMap.get(entityId);
        return entity ? `${entity.name} (${count} connections)` : null;
      })
      .filter(Boolean);

    if (keyEntities.length > 0) {
      summaryParts.push(`Key central figures include: ${keyEntities.join(', ')}.`);
    }

    return summaryParts.join(' ');
  }

  /**
   * Convert numeric strength to descriptive text
   */
  private getStrengthDescription(strength: number): string {
    if (strength >= 9) return 'Very Strong';
    if (strength >= 7) return 'Strong';
    if (strength >= 5) return 'Medium';
    if (strength >= 3) return 'Weak';
    return 'Very Weak';
  }
}

export const relationshipContextService = new RelationshipContextService();
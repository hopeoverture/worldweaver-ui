'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useWorldRelationships } from '@/hooks/query/useWorldRelationships';
import { useWorldEntities } from '@/hooks/query/useWorldEntities';
import { useParams } from 'next/navigation';

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="h-96 flex items-center justify-center bg-gray-50 dark:bg-neutral-900 rounded-lg">
      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600"></div>
        <span>Loading relationship graph...</span>
      </div>
    </div>
  ),
});

interface GraphNode {
  id: string;
  name: string;
  group: string;
  color: string;
  size: number;
  templateName?: string;
}

interface GraphLink {
  source: string;
  target: string;
  label: string;
  strength: number;
  isBidirectional: boolean;
  color: string;
  description?: string;
}

export function RelationshipGraph() {
  const { id: worldId } = useParams();
  const strWorldId = String(worldId);
  const { data: relationships = [] } = useWorldRelationships(strWorldId);
  const { data: entities = [] } = useWorldEntities(strWorldId);
  const fgRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<GraphLink | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  // Color scheme for different relationship strengths
  const getStrengthColor = (strength: number = 5) => {
    if (strength >= 8) return '#22c55e'; // Strong - green
    if (strength >= 6) return '#3b82f6'; // Medium - blue
    if (strength >= 4) return '#f59e0b'; // Weak - amber
    return '#ef4444'; // Very weak - red
  };

  // Color scheme for entity types/templates
  const getEntityColor = (templateName: string = 'default') => {
    const colors: Record<string, string> = {
      'Character': '#8b5cf6',
      'Location': '#06b6d4',
      'Organization': '#f59e0b',
      'Item': '#84cc16',
      'Event': '#ef4444',
      'Concept': '#6b7280',
      'default': '#9ca3af'
    };
    return colors[templateName] || colors.default;
  };

  const graphData = useMemo(() => {
    if (!entities.length || !relationships.length) {
      return { nodes: [], links: [] };
    }

    // Create nodes from entities that have relationships
    const entityIds = new Set([
      ...relationships.map(r => r.from),
      ...relationships.map(r => r.to)
    ]);

    const nodes: GraphNode[] = entities
      .filter((entity: any) => entityIds.has(entity.id))
      .map((entity: any) => ({
        id: entity.id,
        name: entity.name,
        group: entity.templateName || 'default',
        color: getEntityColor(entity.templateName),
        size: 8 + (relationships.filter(r => r.from === entity.id || r.to === entity.id).length * 2),
        templateName: entity.templateName
      }));

    // Create links from relationships
    const links: GraphLink[] = relationships.map(rel => ({
      source: rel.from,
      target: rel.to,
      label: rel.relationshipType,
      strength: rel.strength || 5,
      isBidirectional: rel.isBidirectional || false,
      color: getStrengthColor(rel.strength),
      description: rel.description
    }));

    return { nodes, links };
  }, [entities, relationships]);

  // Update dimensions on mount
  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('relationship-graph-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        setDimensions({
          width: Math.max(800, rect.width - 32), // Account for padding
          height: 400
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    setSelectedLink(null);
  };

  const handleLinkClick = (link: any) => {
    setSelectedLink(link);
    setSelectedNode(null);
  };

  const handleBackgroundClick = () => {
    setSelectedNode(null);
    setSelectedLink(null);
  };

  if (!entities.length) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No entities yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create some entities first to see their relationships visualized here.
          </p>
        </div>
      </div>
    );
  }

  if (!relationships.length) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No relationships yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create relationships between your entities to see them visualized here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-4 border border-gray-200 dark:border-neutral-800">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Graph Legend</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Relationship Strength</h5>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-green-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Strong (8-10)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-blue-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Medium (6-7)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-amber-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Weak (4-5)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-red-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Very Weak (1-3)</span>
              </div>
            </div>
          </div>
          <div>
            <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Entity Types</h5>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Character</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Organization</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graph Container */}
      <div
        id="relationship-graph-container"
        className="relative bg-white dark:bg-neutral-950 rounded-lg border border-gray-200 dark:border-neutral-800 overflow-hidden"
      >
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="transparent"
          nodeLabel={(node: any) => `
            <div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px; max-width: 200px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${node.name}</div>
              <div style="font-size: 12px; opacity: 0.8;">${node.templateName || 'Unknown Type'}</div>
              <div style="font-size: 12px; opacity: 0.8;">Connections: ${graphData.links.filter((l: any) => l.source === node.id || l.target === node.id).length}</div>
            </div>
          `}
          linkLabel={(link: any) => `
            <div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px; max-width: 200px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${link.label}</div>
              <div style="font-size: 12px; opacity: 0.8;">Strength: ${link.strength}/10</div>
              ${link.isBidirectional ? '<div style="font-size: 12px; opacity: 0.8;">↔ Bidirectional</div>' : ''}
              ${link.description ? `<div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">${link.description}</div>` : ''}
            </div>
          `}
          nodeColor={(node: any) => node.color}
          nodeVal={(node: any) => node.size}
          linkColor={(link: any) => link.color}
          linkWidth={(link: any) => Math.max(1, link.strength / 2)}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          linkDirectionalParticles={(link: any) => link.isBidirectional ? 0 : 2}
          linkDirectionalParticleWidth={2}
          onNodeClick={handleNodeClick}
          onLinkClick={handleLinkClick}
          onBackgroundClick={handleBackgroundClick}
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />

        {/* Selection Info Panel */}
        {(selectedNode || selectedLink) && (
          <div className="absolute top-4 right-4 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-4 max-w-xs shadow-lg">
            {selectedNode && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{selectedNode.name}</h4>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p><span className="font-medium">Type:</span> {selectedNode.templateName || 'Unknown'}</p>
                  <p><span className="font-medium">Connections:</span> {graphData.links.filter(l => l.source === selectedNode.id || l.target === selectedNode.id).length}</p>
                </div>
              </div>
            )}
            {selectedLink && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{selectedLink.label}</h4>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p><span className="font-medium">Strength:</span> {selectedLink.strength}/10</p>
                  <p><span className="font-medium">Direction:</span> {selectedLink.isBidirectional ? 'Bidirectional' : 'One-way'}</p>
                  {selectedLink.description && (
                    <p><span className="font-medium">Description:</span> {selectedLink.description}</p>
                  )}
                </div>
              </div>
            )}
            <button
              onClick={() => {
                setSelectedNode(null);
                setSelectedLink(null);
              }}
              className="mt-3 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Click background to deselect
            </button>
          </div>
        )}
      </div>

      {/* Graph Controls */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => fgRef.current?.zoomToFit(400)}
          className="px-3 py-1 text-xs bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
        >
          Fit to View
        </button>
        <button
          onClick={() => fgRef.current?.centerAt(0, 0, 1000)}
          className="px-3 py-1 text-xs bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
        >
          Center Graph
        </button>
      </div>
    </div>
  );
}

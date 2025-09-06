'use client';
import { RelationshipRow } from '@/lib/types';
import { useStore } from '@/lib/store';

export function RelationshipTable() {
  const { relationships, entities } = useStore();

  const getEntityName = (id: string) => entities.find(e => e.id === id)?.name || 'Unknown';

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-800">
        <thead className="bg-gray-50 dark:bg-neutral-900">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relationship</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-neutral-950 divide-y divide-gray-200 dark:divide-neutral-800">
          {relationships.map(rel => (
            <tr key={rel.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{getEntityName(rel.from)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{rel.label}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{getEntityName(rel.to)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

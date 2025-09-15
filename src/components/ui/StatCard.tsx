import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string; // Now accepts emoji/string instead of LucideIcon
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  className
}: StatCardProps) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {trend && (
            <p className={`text-sm mt-1 ${
              trend.isPositive !== false ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.label}
            </p>
          )}
        </div>
        <div className="ml-4">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <span className="text-2xl">{icon}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
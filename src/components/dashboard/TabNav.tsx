'use client';
import { Tabs, TabItem } from '@/components/ui/Tabs';

interface TabNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: TabItem[];
}

export function TabNav({ activeTab, onTabChange, tabs }: TabNavProps) {
  return (
    <Tabs
      tabs={tabs}
      activeKey={activeTab}
      onChange={onTabChange}
      ariaLabel="World Sections"
    />
  );
}

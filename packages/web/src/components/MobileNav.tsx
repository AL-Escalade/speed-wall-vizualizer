/**
 * Mobile bottom tab navigation component
 */

import { Settings, Eye } from 'lucide-react';
import { useIntl } from 'react-intl';
import { useMobileTab, type MobileTab } from '@/hooks/useMobileTab';

interface TabButtonProps {
  tab: MobileTab;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function TabButton({ icon, label, isActive, onClick }: TabButtonProps) {
  return (
    <button
      className={`flex-1 flex flex-col items-center justify-center py-2 transition-colors ${
        isActive
          ? 'text-primary bg-primary/10'
          : 'text-base-content/60 hover:text-base-content'
      }`}
      onClick={onClick}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
}

export function MobileNav() {
  const intl = useIntl();
  const { activeTab, setActiveTab } = useMobileTab();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 flex z-50 safe-area-bottom">
      <TabButton
        tab="config"
        icon={<Settings size={20} />}
        label={intl.formatMessage({ id: 'mobile.configuration' })}
        isActive={activeTab === 'config'}
        onClick={() => setActiveTab('config')}
      />
      <TabButton
        tab="viewer"
        icon={<Eye size={20} />}
        label={intl.formatMessage({ id: 'mobile.wall' })}
        isActive={activeTab === 'viewer'}
        onClick={() => setActiveTab('viewer')}
      />
    </nav>
  );
}

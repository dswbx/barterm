interface Tab {
  id: number;
  title: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId: number;
  onTabClick: (id: number) => void;
  onTabClose: (id: number) => void;
  onNewTab: () => void;
}

export function TabBar({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onNewTab,
}: TabBarProps) {
  return (
    <div className="flex items-center bg-gray-800 dark:bg-gray-800 border-b border-gray-700 dark:border-gray-700 px-2 py-1 gap-1">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`
            flex items-center gap-2 px-3 py-1 rounded-md cursor-pointer
            transition-colors duration-150
            ${
              activeTabId === tab.id
                ? 'bg-gray-700 dark:bg-gray-700 text-white'
                : 'bg-transparent text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
            }
          `}
          onClick={() => onTabClick(tab.id)}
        >
          <span className="text-sm select-none">{tab.title}</span>
          {tabs.length > 1 && (
            <button
              className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              title="Close tab (Cmd+W)"
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        className="px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
        onClick={onNewTab}
        title="New tab (Cmd+T)"
      >
        +
      </button>
    </div>
  );
}

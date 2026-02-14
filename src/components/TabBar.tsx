interface Tab {
   id: number;
   title: string;
   hasBell?: boolean;
}

interface TabBarProps {
   tabs: Tab[];
   activeTabId: number;
   onTabClick: (id: number) => void;
   onTabClose: (id: number) => void;
   onNewTab: () => void;
   children?: React.ReactNode;
}

export function TabBar({
   tabs,
   activeTabId,
   onTabClick,
   onTabClose,
   onNewTab,
   children,
}: TabBarProps) {
   return (
      <div className="relative flex items-center bg-zinc-900 border-b border-zinc-800 px-2 py-1 gap-1">
         {tabs.map((tab) => (
            <div
               key={tab.id}
               className={`
            flex items-center justify-center gap-2 px-2 py-0.5 rounded-md cursor-pointer
            transition-colors duration-150 relative
            ${
               activeTabId === tab.id
                  ? "bg-zinc-800 dark:bg-zinc-800 text-white"
                  : "bg-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
            }
          `}
               onClick={() => onTabClick(tab.id)}
            >
               <span className="text-xs font-mono select-none">
                  {tab.title}
               </span>
               {tab.hasBell && (
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" title="Unread bell" />
               )}
               {tabs.length > 1 && (
                  <button
                     className="text-zinc-500 hover:text-white transition-colors text-base leading-none"
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
            className="px-2 h-full text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors text-xs leading-none"
            onClick={onNewTab}
            title="New tab (Cmd+T)"
         >
            +
         </button>
         {children}
      </div>
   );
}

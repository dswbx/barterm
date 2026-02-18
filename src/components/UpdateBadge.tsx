interface UpdateBadgeProps {
   isDark: boolean;
   onUpdate: () => void;
   isUpdating: boolean;
}

export function UpdateBadge({ onUpdate, isUpdating }: UpdateBadgeProps) {
   return (
      <button
         onClick={onUpdate}
         disabled={isUpdating}
         className="fixed bottom-3 right-3 z-50 flex items-center gap-2 px-2.5 py-1 rounded-full shadow-lg text-xs font-medium text-white bg-[#007AFF] hover:bg-[#0066d6] active:bg-[#0055b3] disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
         title="A new version of Barterm is available"
      >
         {isUpdating ? (
            <>
               <Spinner />
               <span>Updating...</span>
            </>
         ) : (
            <span>Update available</span>
         )}
      </button>
   );
}

function ArrowUpIcon() {
   return (
      <svg
         width="13"
         height="13"
         viewBox="0 0 13 13"
         fill="none"
         xmlns="http://www.w3.org/2000/svg"
         aria-hidden="true"
      >
         <path
            d="M6.5 10.5V2.5M6.5 2.5L2.5 6.5M6.5 2.5L10.5 6.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
         />
      </svg>
   );
}

function Spinner() {
   return (
      <svg
         width="13"
         height="13"
         viewBox="0 0 13 13"
         fill="none"
         xmlns="http://www.w3.org/2000/svg"
         className="animate-spin"
         aria-hidden="true"
      >
         <circle
            cx="6.5"
            cy="6.5"
            r="5"
            stroke="currentColor"
            strokeOpacity="0.3"
            strokeWidth="1.5"
         />
         <path
            d="M11.5 6.5A5 5 0 0 0 6.5 1.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
         />
      </svg>
   );
}

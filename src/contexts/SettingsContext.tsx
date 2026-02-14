import {
   createContext,
   useContext,
   useState,
   useEffect,
   ReactNode,
} from "react";
import { invoke } from "@tauri-apps/api/core";

// define the settings structure
export interface AppSettings {
   notifications_enabled: boolean;
   window_opacity: number;
   window_width?: number;
   window_height?: number;
   // add more settings here as needed
}

// default settings
const defaultSettings: AppSettings = {
   notifications_enabled: true,
   window_opacity: 1.0,
};

interface SettingsContextType {
   settings: AppSettings;
   updateSetting: <K extends keyof AppSettings>(
      key: K,
      value: AppSettings[K]
   ) => Promise<void>;
   getSetting: <K extends keyof AppSettings>(key: K) => AppSettings[K];
   isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
   undefined
);

interface SettingsProviderProps {
   children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
   const [settings, setSettings] = useState<AppSettings>(defaultSettings);
   const [isLoaded, setIsLoaded] = useState(false);

   // load all settings on mount
   useEffect(() => {
      const loadSettings = async () => {
         try {
            const allSettings =
               await invoke<Record<string, unknown>>("get_settings");
            console.log("Loaded settings:", allSettings);

            // merge with defaults
            const mergedSettings: AppSettings = {
               ...defaultSettings,
               ...allSettings,
            };

            setSettings(mergedSettings);
            setIsLoaded(true);
         } catch (error) {
            console.error("Failed to load settings:", error);
            setSettings(defaultSettings);
            setIsLoaded(true);
         }
      };

      loadSettings();
   }, []);

   // update a single setting
   const updateSetting = async <K extends keyof AppSettings>(
      key: K,
      value: AppSettings[K]
   ): Promise<void> => {
      try {
         // update local state immediately
         setSettings((prev) => ({
            ...prev,
            [key]: value,
         }));

         // persist to backend
         await invoke("set_setting", { key: String(key), value });
         console.log(`Updated setting ${String(key)}:`, value);
      } catch (error) {
         console.error(`Failed to update setting ${String(key)}:`, error);
         // revert local state on error
         const allSettings =
            await invoke<Record<string, unknown>>("get_settings");
         setSettings({ ...defaultSettings, ...allSettings });
      }
   };

   // get a single setting value
   const getSetting = <K extends keyof AppSettings>(key: K): AppSettings[K] => {
      return settings[key];
   };

   return (
      <SettingsContext.Provider
         value={{ settings, updateSetting, getSetting, isLoaded }}
      >
         {children}
      </SettingsContext.Provider>
   );
}

// custom hook to use settings
export function useSettings() {
   const context = useContext(SettingsContext);
   if (context === undefined) {
      throw new Error("useSettings must be used within a SettingsProvider");
   }
   return context;
}

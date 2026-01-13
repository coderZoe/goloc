import { create } from 'zustand';
import type { UserSettings, AnalyzeStatus, AnalyzeResponse, AppConfig } from '../types';
import { apiClient, getSettings, saveSettings } from '../api/client';

interface PageState {
    [url: string]: {
        panelExpanded: boolean;
    };
}

interface GoLocStore {
    // 主题
    theme: 'light' | 'dark' | 'auto';
    effectiveTheme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark' | 'auto') => void;

    // UI 状态
    panelExpanded: boolean;
    setPanelExpanded: (expanded: boolean, persist?: boolean) => void;
    panelPosition: { x: number; y: number };
    setPanelPosition: (pos: { x: number; y: number }, persist?: boolean) => void;
    fabPosition: { x: number; y: number };
    setFabPosition: (pos: { x: number; y: number }, persist?: boolean) => void;
    panelWidth: number;
    setPanelWidth: (width: number) => void;

    // 每个页面的展开状态（会话级，不持久化）
    pageStates: PageState;

    // 分析状态
    status: AnalyzeStatus;
    error: string | null;
    result: AnalyzeResponse | null;

    // 配置
    config: AppConfig | null;

    // 设置
    settings: UserSettings | null;
    loadSettings: () => Promise<void>;
    updateSettings: (settings: Partial<UserSettings>) => Promise<void>;

    // 分析方法
    analyze: (repoUrl: string, branch?: string) => Promise<void>;
    reset: () => void;

    // 加载配置
    loadConfig: () => Promise<void>;
    updateConfig: (config: AppConfig) => Promise<void>;

    // 获取当前页面URL
    getCurrentPageKey: () => string;
}

const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
};

export const useGoLocStore = create<GoLocStore>((set, get) => ({
    // 初始状态
    theme: 'auto',
    effectiveTheme: getSystemTheme(),
    panelExpanded: false,
    panelPosition: { x: 20, y: 20 },
    fabPosition: { x: typeof window !== 'undefined' ? window.innerWidth - 80 : 900, y: 100 },
    panelWidth: 400,
    status: 'idle',
    error: null,
    result: null,
    config: null,
    settings: null,
    pageStates: {},

    getCurrentPageKey: () => {
        if (typeof window === 'undefined') return '';
        return window.location.pathname;
    },

    setTheme: (theme) => {
        const effectiveTheme = theme === 'auto' ? getSystemTheme() : theme;
        set({ theme, effectiveTheme });
        saveSettings({ theme });
    },

    setPanelExpanded: (expanded, persist = true) => {
        set({ panelExpanded: expanded });

        // 仅当需要持久化时，才更新页面级状态
        if (persist) {
            const pageKey = get().getCurrentPageKey();
            const newPageStates = { ...get().pageStates, [pageKey]: { panelExpanded: expanded } };
            set({ pageStates: newPageStates });
        }
    },

    setPanelPosition: (pos, persist = true) => {
        set({ panelPosition: pos });
        if (persist) {
            saveSettings({ panelPosition: pos });
        }
    },

    setFabPosition: (pos, persist = true) => {
        set({ fabPosition: pos });
        if (persist) {
            saveSettings({ fabPosition: pos });
        }
    },

    setPanelWidth: (width) => {
        set({ panelWidth: width });
        saveSettings({ panelWidth: width });
    },

    loadSettings: async () => {
        try {
            const settings = await getSettings();
            const effectiveTheme = settings.theme === 'auto' ? getSystemTheme() : settings.theme;
            const pageKey = get().getCurrentPageKey();

            console.log('[GoLoc] loadSettings:', {
                theme: settings.theme,
                effectiveTheme,
                systemTheme: getSystemTheme()
            });

            // 检查当前页面是否有保存的展开状态
            const pageState = get().pageStates[pageKey];

            set({
                settings,
                theme: settings.theme,
                effectiveTheme,
                panelExpanded: pageState?.panelExpanded ?? false, // 默认不展开
                panelPosition: settings.panelPosition,
                fabPosition: settings.fabPosition,
                panelWidth: settings.panelWidth || 400,
            });
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    },

    updateSettings: async (newSettings) => {
        try {
            await saveSettings(newSettings);
            const settings = await getSettings();
            set({ settings });
        } catch (e) {
            console.error('Failed to update settings:', e);
        }
    },

    loadConfig: async () => {
        try {
            const config = await apiClient.getConfig();
            set({ config });
        } catch (e) {
            console.error('Failed to load config:', e);
        }
    },

    updateConfig: async (newConfig) => {
        try {
            const config = await apiClient.updateConfig(newConfig);
            set({ config });
        } catch (e) {
            console.error('Failed to update config:', e);
            throw e; // 抛出错误以便UI处理
        }
    },

    analyze: async (repoUrl, branch) => {
        set({ status: 'loading', error: null });
        try {
            const result = await apiClient.analyze({ repoURL: repoUrl, branch });
            set({ status: 'success', result });
            // 分析成功后不自动展开面板，需用户手动点击
            // get().setPanelExpanded(true);
        } catch (e) {
            set({
                status: 'error',
                error: e instanceof Error ? e.message : 'Unknown error',
            });
        }
    },

    reset: () => {
        set({ status: 'idle', error: null, result: null });
    },
}));

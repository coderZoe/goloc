import type { AnalyzeRequest, AppConfig, AnalyzeResponse, UserSettings, ApiResponse } from "../types";

// Base server URL (without /api path)
const DEFAULT_SERVER_URL = "http://localhost:8080";

// API path prefix - hardcoded for all requests
const API_PREFIX = "/api";

// 获取服务器URL
async function getServerUrl(): Promise<string> {
    try {
        const settings = await getSettings();
        // Remove trailing slash and /api if user accidentally included it
        let url = settings.serverUrl || DEFAULT_SERVER_URL;
        url = url.replace(/\/+$/, ''); // Remove trailing slashes
        url = url.replace(/\/api\/?$/, ''); // Remove /api suffix if present
        return url;
    } catch {
        return DEFAULT_SERVER_URL;
    }
}

// 封装通用的 fetch 处理，统一处理 JSON 和 错误
async function http<T>(path: string, config?: RequestInit): Promise<T> {
    const baseUrl = await getServerUrl();
    const response = await fetch(`${baseUrl}${API_PREFIX}${path}`, config);

    // 首先尝试解析 JSON 响应
    let responseData: ApiResponse<T>;
    try {
        responseData = await response.json();
    } catch {
        // 如果无法解析 JSON，抛出网络错误
        throw new Error(`网络错误: ${response.status} ${response.statusText}`);
    }

    // 检查后端返回的 code 字段
    if (responseData.code !== 0) {
        throw new Error(responseData.message || `请求失败: 错误码 ${responseData.code}`);
    }

    return responseData.data;
}

// 获取用户设置
export async function getSettings(): Promise<UserSettings> {
    const defaultSettings: UserSettings = {
        theme: 'auto',
        autoAnalyze: false,
        panelPosition: { x: 20, y: 20 },
        fabPosition: { x: window.innerWidth - 80, y: 100 },
        panelExpanded: false,
        serverUrl: DEFAULT_SERVER_URL,
    };

    try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            const result = await chrome.storage.sync.get('goloc_settings');
            return { ...defaultSettings, ...result.goloc_settings };
        }
        const stored = localStorage.getItem('goloc_settings');
        if (stored) {
            return { ...defaultSettings, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.error('Failed to load settings:', e);
    }
    return defaultSettings;
}

// 保存用户设置
export async function saveSettings(settings: Partial<UserSettings>): Promise<void> {
    try {
        const current = await getSettings();
        const updated = { ...current, ...settings };

        if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.sync.set({ goloc_settings: updated });
        } else {
            localStorage.setItem('goloc_settings', JSON.stringify(updated));
        }
    } catch (e) {
        console.error('Failed to save settings:', e);
    }
}

export const apiClient = {
    // 1. 获取后端配置
    getConfig: () => http<AppConfig>("/config"),

    // 1.5 更新后端配置
    updateConfig: (config: AppConfig) =>
        http<AppConfig>("/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(config)
        }),

    // 2. 发起分析请求
    analyze: (params: AnalyzeRequest) =>
        http<AnalyzeResponse>("/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                repo_url: params.repoURL,
                branch: params.branch,
            }),
        }),

    // 3. 更新设置
    updateSettings: async (settings: Partial<UserSettings>) => {
        await saveSettings(settings);
        return getSettings();
    },

    // 4. 获取设置
    getSettings,
};
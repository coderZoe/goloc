// 统计数据的最小单元
export interface Summary {
    lines: number;
    code: number;
    comments: number;
    blanks: number;
}

// 语言统计
export interface LanguageStat {
    language: string;
    files: number;
    lines: number;
    code: number;
    comments: number;
    blanks: number;
    percentage: number;
}

// 核心：文件树节点 (对应 Go 的 Node 结构)
export interface TreeNode {
    name: string;
    type: "file" | "dir";
    path: string;
    language?: string; // 只有 type="file" 时才有
    stats: Summary;
    languages?: LanguageStat[]; // 目录的语言统计
    children?: Record<string, TreeNode>; // 对应 Go 的 map[string]*Node
}

// 对应后端的 ConfigData
export interface AppConfig {
    cache_ttl_seconds: number;
    default_depth: number;
    request_timeout_seconds: number;
    max_repo_size_mb: number;
}

// 用户设置
export interface UserSettings {
    theme: 'light' | 'dark' | 'auto';
    autoAnalyze: boolean;
    panelPosition: { x: number; y: number };
    fabPosition: { x: number; y: number };
    panelExpanded: boolean;
    panelWidth?: number;
    serverUrl: string;
}

// API 请求参数
export interface AnalyzeRequest {
    repoURL: string;
    branch?: string;
}

export interface AnalyzeResponse {
    source: string;
    repo: string;
    branch: string;
    timestamp: number;
    data: TreeNode;
}

// 分析状态
export type AnalyzeStatus = 'idle' | 'loading' | 'success' | 'error';
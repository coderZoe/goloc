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
    exclude_dirs: string[];
    include_data_files: boolean;      // 是否统计数据文件（JSON/XML/YAML等）
    include_documentation: boolean;   // 是否统计文档文件（Markdown/TXT等）
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

// 统一 API 响应结构
export interface ApiResponse<T> {
    code: number;    // 响应状态码: 0 表示成功, 非0表示失败
    data: T;         // 响应数据
    message: string; // 响应消息
}
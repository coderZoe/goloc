import { useEffect, useState } from 'react';
import {
    Settings,
    Server,
    Zap,
    Save,
    AlertCircle,
    Clock,
    Database,
    Layers,
    CheckCircle2,
    Loader2,
    ExternalLink
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { UserSettings, AppConfig } from '../types';
import { formatDuration, formatBytes } from '../utils/format';

// ============================================================================
// UI Components
// ============================================================================

interface FormSectionProps {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    delay?: number;
}

const FormSection = ({ title, icon: Icon, children, delay = 0 }: FormSectionProps) => (
    <div
        className="bg-card rounded-2xl border border-border goloc-shadow overflow-hidden goloc-transition hover:border-primary/30 hover:goloc-shadow-lg animate-popup-fade-in opacity-0"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="px-5 py-3.5 border-b border-border/50 flex items-center gap-3 bg-gradient-to-r from-accent/50 to-transparent">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon size={16} className="text-primary" />
            </div>
            <h3 className="font-semibold text-sm tracking-tight text-foreground">{title}</h3>
        </div>
        <div className="p-5 space-y-5">
            {children}
        </div>
    </div>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    suffix?: React.ReactNode;
    description?: string;
    icon?: React.ElementType;
}

const Input = ({ label, suffix, description, icon: Icon, className = '', ...props }: InputProps) => (
    <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {Icon && <Icon size={11} className="text-muted-foreground/60" />}
            {label}
        </label>
        <div className="relative">
            <input
                className={`
                    w-full px-4 py-2.5 
                    bg-muted/30 border border-border rounded-xl 
                    text-sm font-medium text-foreground
                    goloc-transition goloc-focus-ring
                    hover:bg-muted/50 hover:border-primary/20
                    focus:bg-card focus:border-primary
                    ${suffix ? 'pr-20' : ''}
                    ${className}
                `}
                {...props}
            />
            {suffix && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg pointer-events-none select-none">
                    {suffix}
                </div>
            )}
        </div>
        {description && (
            <p className="text-xs text-muted-foreground/70 pl-1">{description}</p>
        )}
    </div>
);

interface ToggleProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

const Toggle = ({ label, description, checked, onChange }: ToggleProps) => (
    <label className="flex items-center justify-between cursor-pointer group py-1">
        <div className="flex-1 pr-4">
            <div className="text-sm font-medium text-foreground goloc-transition group-hover:text-primary">
                {label}
            </div>
            {description && (
                <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {description}
                </div>
            )}
        </div>
        <div className="relative">
            <input
                type="checkbox"
                className="sr-only peer"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <div className={`
                w-12 h-7 rounded-full goloc-transition
                ${checked
                    ? 'bg-primary'
                    : 'bg-muted hover:bg-muted-foreground/20'
                }
                after:content-[''] after:absolute 
                after:top-1 after:left-1
                after:bg-white after:rounded-full 
                after:h-5 after:w-5 
                after:goloc-transition
                after:shadow-sm
                ${checked ? 'after:translate-x-5' : 'after:translate-x-0'}
            `} />
        </div>
    </label>
);

// Status message component
interface StatusMessageProps {
    type: 'success' | 'error';
    text: string;
}

const StatusMessage = ({ type, text }: StatusMessageProps) => (
    <div className={`
        flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
        animate-slide-in-right
        ${type === 'success'
            ? 'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]'
            : 'bg-destructive/10 text-destructive'
        }
    `}>
        {type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
        {text}
    </div>
);

// ============================================================================
// Main Popup Component
// ============================================================================

export function Popup() {
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [userSettings, serverConfig] = await Promise.all([
                apiClient.getSettings(),
                apiClient.getConfig().catch(() => null),
            ]);
            setSettings(userSettings);
            setConfig(serverConfig);
        } catch (e) {
            console.error('Failed to load data:', e);
            setMessage({ type: 'error', text: '无法加载数据' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        setMessage(null);

        try {
            await apiClient.updateSettings(settings);
            if (config) {
                await apiClient.updateConfig(config);
            }
            setMessage({ type: 'success', text: '设置已保存' });
            setTimeout(() => setMessage(null), 3000);
        } catch (e) {
            console.error('Failed to save:', e);
            setMessage({ type: 'error', text: '保存失败，请检查服务器连接' });
        } finally {
            setSaving(false);
        }
    };

    // Loading state
    if (loading || !settings) {
        return (
            <div id="goloc-popup-root">
                <div className="w-[400px] h-[520px] flex flex-col items-center justify-center gap-4 bg-background text-foreground">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                            <Loader2 size={26} className="text-white animate-spin" />
                        </div>
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">加载中...</div>
                </div>
            </div>
        );
    }

    return (
        <div id="goloc-popup-root">
            <div className="w-[400px] min-h-[520px] bg-background text-foreground flex flex-col">

                {/* ============== Header ============== */}
                <header className="sticky top-0 z-20 bg-gradient-to-b from-background via-background to-background/95 border-b border-border/50">
                    <div className="px-6 py-5 flex items-center gap-4">
                        {/* Logo & Title */}
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-md goloc-shadow">
                            <Settings size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-foreground">GoLoc</h1>
                            <p className="text-xs text-muted-foreground font-medium">代码统计配置</p>
                        </div>
                    </div>
                </header>

                {/* ============== Main Content ============== */}
                <main className="flex-1 p-5 space-y-4 pb-24 overflow-y-auto">

                    {/* Basic Settings */}
                    <FormSection title="基础设置" icon={Zap} delay={50}>
                        <Input
                            label="服务器地址"
                            icon={ExternalLink}
                            value={settings.serverUrl}
                            onChange={(e) => setSettings({ ...settings, serverUrl: e.target.value })}
                            placeholder="http://localhost:8080"
                            spellCheck={false}
                        />

                        <div className="pt-3 border-t border-border/30">
                            <Toggle
                                label="自动分析"
                                description="进入 GitHub 仓库页面时自动开始统计分析"
                                checked={settings.autoAnalyze}
                                onChange={(checked) => setSettings({ ...settings, autoAnalyze: checked })}
                            />
                        </div>
                    </FormSection>

                    {/* Server Configuration */}
                    {config ? (
                        <FormSection title="分析参数" icon={Server} delay={100}>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="缓存有效期"
                                    icon={Clock}
                                    type="number"
                                    value={config.cache_ttl_seconds}
                                    onChange={(e) => setConfig({ ...config, cache_ttl_seconds: parseInt(e.target.value) || 0 })}
                                    suffix={formatDuration(config.cache_ttl_seconds)}
                                    min={0}
                                />
                                <Input
                                    label="请求超时"
                                    icon={Clock}
                                    type="number"
                                    value={config.request_timeout_seconds}
                                    onChange={(e) => setConfig({ ...config, request_timeout_seconds: parseInt(e.target.value) || 0 })}
                                    suffix={formatDuration(config.request_timeout_seconds)}
                                    min={0}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="最大仓库大小"
                                    icon={Database}
                                    type="number"
                                    value={config.max_repo_size_mb}
                                    onChange={(e) => setConfig({ ...config, max_repo_size_mb: parseInt(e.target.value) || 0 })}
                                    suffix="MB"
                                    min={0}
                                    description={`约 ${formatBytes(config.max_repo_size_mb * 1024 * 1024)}`}
                                />
                                <Input
                                    label="默认深度"
                                    icon={Layers}
                                    type="number"
                                    value={config.default_depth}
                                    onChange={(e) => setConfig({ ...config, default_depth: parseInt(e.target.value) || 0 })}
                                    min={1}
                                    max={20}
                                />
                            </div>
                        </FormSection>
                    ) : (
                        <div
                            className="bg-destructive/5 border border-destructive/15 rounded-2xl p-5 flex gap-4 animate-popup-fade-in opacity-0"
                            style={{ animationDelay: '100ms' }}
                        >
                            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                                <AlertCircle size={20} className="text-destructive" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-destructive mb-1">无法连接服务器</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    无法加载分析配置，请检查服务器地址是否正确。
                                </p>
                            </div>
                        </div>
                    )}
                </main>

                {/* ============== Footer ============== */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-background/90 border-t border-border/50 z-20">
                    <div className="flex items-center gap-3">
                        {message && <StatusMessage type={message.type} text={message.text} />}
                        <div className="flex-1" />
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`
                                flex items-center gap-2 px-6 py-2.5 rounded-xl 
                                text-sm font-semibold goloc-transition goloc-focus-ring
                                ${saving
                                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                    : 'bg-primary text-white hover:bg-primary/90 active:scale-[0.98] shadow-md hover:shadow-lg'
                                }
                            `}
                        >
                            {saving ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            {saving ? '保存中...' : '保存更改'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

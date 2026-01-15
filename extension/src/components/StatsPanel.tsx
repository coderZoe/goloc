import { useState, useRef, useEffect } from 'react';
import { useGoLocStore } from '../store';
import { X, ChevronDown, ChevronUp, Sun, Moon, Github, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { OverviewStats } from './OverviewStats';
import { LanguageStats } from './LanguageStats';
import { DirectoryTree } from './DirectoryTree';

export function StatsPanel({ onClose }: { onClose?: () => void }) {
    const {
        result,
        effectiveTheme,
        setPanelExpanded,
        setTheme,
        theme,
        panelWidth,
        setPanelWidth,
        status,
        error,
        reset
    } = useGoLocStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'languages' | 'tree'>('overview');
    const [isMinimized, setIsMinimized] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const isDark = effectiveTheme === 'dark';

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            setPanelExpanded(false);
        }
    };

    const handleRetry = () => {
        // 重置状态并关闭面板，用户可以重新点击按钮
        reset();
        handleClose();
    };

    // 处理调整大小
    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!panelRef.current) return;
            const rect = panelRef.current.getBoundingClientRect();
            const newWidth = rect.right - e.clientX;
            // 限制宽度在 300px 到 800px 之间
            setPanelWidth(Math.min(Math.max(newWidth, 300), 800));
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    // 如果正在载入或有错误，也要显示面板
    const isLoading = status === 'loading';
    const hasError = status === 'error';
    const hasData = result !== null;

    // 使用后端返回的完整语言统计（不受深度限制）
    const languages = hasData ? result.languages : [];

    const tabs = [
        { id: 'overview' as const, label: '概览' },
        { id: 'languages' as const, label: '语言' },
        { id: 'tree' as const, label: '目录' },
    ];

    return (
        <div
            ref={panelRef}
            className={`
                goloc-panel rounded-2xl shadow-2xl overflow-hidden relative
                ${isDark
                    ? 'bg-gray-900 border border-gray-800'
                    : 'bg-white border border-gray-200'
                }
            `}
            style={{
                width: `${panelWidth}px`,
            }}
        >
            {/* 顶部渐变装饰条 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

            {/* 左侧调整大小手柄 */}
            <div
                className={`
                    absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize
                    hover:bg-blue-500 transition-colors z-10
                    ${isResizing ? 'bg-blue-500' : ''}
                `}
                onMouseDown={() => setIsResizing(true)}
                title="拖动调整宽度"
            />

            {/* 头部 */}
            <div
                className={`
                    flex items-center justify-between px-4 py-2.5
                    border-b cursor-move
                    ${isDark
                        ? 'bg-gradient-to-r from-gray-800/80 to-gray-900/80 border-gray-800'
                        : 'bg-gradient-to-r from-gray-50 to-white border-gray-200'
                    }
                `}
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`p-1.5 rounded-lg ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                        {isLoading ? (
                            <Loader2 className={`w-4 h-4 flex-shrink-0 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                        ) : hasError ? (
                            <AlertCircle className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                        ) : (
                            <Github className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {isLoading
                                ? '正在分析...'
                                : hasError
                                    ? '分析失败'
                                    : hasData
                                        ? (result.repo.split('/').pop() || 'Repository')
                                        : 'GoLoc 统计'
                            }
                        </h2>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {isLoading ? (
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                    请稍候...
                                </span>
                            ) : hasError ? (
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                                    发生错误
                                </span>
                            ) : hasData ? (
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                                    {result.branch}
                                </span>
                            ) : null}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 -mt-1">
                    {/* 主题切换 */}
                    <button
                        onClick={() => {
                            const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'auto' : 'light';
                            setTheme(next);
                        }}
                        className={`
              p-2 rounded-lg transition-colors bg-transparent border-0
              ${isDark
                                ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                            }
            `}
                        title={`当前: ${theme === 'auto' ? '自动' : theme === 'dark' ? '暗色' : '亮色'}`}
                    >
                        {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                    </button>

                    {/* 最小化/展开 */}
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className={`
              p-2 rounded-lg transition-colors bg-transparent border-0
              ${isDark
                                ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                            }
            `}
                    >
                        {isMinimized ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>

                    {/* 关闭 */}
                    <button
                        onClick={handleClose}
                        className={`
              p-2 rounded-lg transition-colors bg-transparent border-0
              ${isDark
                                ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400'
                                : 'hover:bg-red-50 text-gray-500 hover:text-red-600'
                            }
            `}
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* 内容区域 */}
            {!isMinimized && (
                <>
                    {/* Loading 状态 */}
                    {isLoading && (
                        <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
                            <Loader2 className={`w-12 h-12 animate-spin mb-4 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                            <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                正在分析仓库...
                            </p>
                            <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                大型项目可能需要较长时间
                            </p>
                            {/* 骨架屏效果 */}
                            <div className="w-full mt-6 space-y-3">
                                <div className={`h-4 rounded animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} style={{ width: '80%' }} />
                                <div className={`h-4 rounded animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} style={{ width: '60%' }} />
                                <div className={`h-4 rounded animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} style={{ width: '70%' }} />
                            </div>
                        </div>
                    )}

                    {/* Error 状态 */}
                    {hasError && (
                        <div className="p-6 flex flex-col items-center justify-center min-h-[200px]">
                            <div className={`p-3 rounded-full mb-4 ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                                <AlertCircle className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                            </div>
                            <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                分析失败
                            </p>
                            <p className={`text-xs text-center max-w-[280px] mb-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                {error || '发生未知错误，请重试'}
                            </p>
                            <button
                                onClick={handleRetry}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                                    transition-colors border-0 cursor-pointer
                                    ${isDark
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    }
                                `}
                            >
                                <RefreshCw size={14} />
                                重新分析
                            </button>
                        </div>
                    )}

                    {/* 有数据时显示正常内容 */}
                    {hasData && !isLoading && !hasError && (
                        <>
                            {/* 标签页 */}
                            <div
                                className={`
                                    flex gap-1 px-4 pt-3
                                    border-b
                                    ${isDark ? 'border-gray-800' : 'border-gray-200'}
                                `}
                            >
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            px-3 py-2 text-xs font-medium rounded-t-lg transition-all border-0
                                            ${activeTab === tab.id
                                                ? isDark
                                                    ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                                                    : 'bg-gray-100 text-gray-900 border-b-2 border-blue-500'
                                                : `bg-transparent ${isDark
                                                    ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`
                                            }
                                        `}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* 内容 */}
                            <div className="p-4 max-h-[500px] overflow-y-auto goloc-scrollbar">
                                {activeTab === 'overview' && (
                                    <OverviewStats stats={result.data.stats} theme={effectiveTheme} />
                                )}

                                {activeTab === 'languages' && (
                                    <LanguageStats languages={languages} theme={effectiveTheme} />
                                )}

                                {activeTab === 'tree' && (
                                    <DirectoryTree data={result.data} theme={effectiveTheme} />
                                )}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}

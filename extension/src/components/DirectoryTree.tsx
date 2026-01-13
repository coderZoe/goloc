import { useState, useMemo } from "react";
import type { TreeNode, Summary } from "@/types";
import {
    Folder,
    ChevronDown,
    Code2,
    MessageSquare,
    AlignJustify,
    FileText,
    File
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "./Tooltip";

import { LANG_CONFIG } from "@/utils/languages";

// 辅助函数：格式化数字 (1234 -> 1.2k) - 这是一个简化的版本，如果需要全数字则用 formatNum
const formatNum = (num: number) => new Intl.NumberFormat().format(num);

// 排序函数
const sortChildren = (children?: Record<string, TreeNode>) => {
    if (!children) return [];
    return Object.values(children).sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
    });
};

// 带文字的文件图标组件
const FileIcon = ({ language, isDark }: { language?: string, isDark: boolean }) => {
    const config = (language && LANG_CONFIG[language]) || {
        color: isDark ? '#9ca3af' : '#6b7280',
        abbr: language ? language.slice(0, 2).toUpperCase() : '..'
    };

    let displayColor = config.color;
    if (language === 'Markdown' && isDark) displayColor = '#d1d5db';
    if (language === 'Makefile' && isDark) displayColor = '#d1d5db';

    return (
        <div className="relative w-4 h-4 flex items-center justify-center flex-shrink-0">
            <File
                className="w-full h-full"
                color={displayColor}
                strokeWidth={1.5}
            />
            <span
                className="absolute inset-0 flex items-center justify-center text-[6px] font-extrabold font-mono tracking-tighter select-none pt-[2.5px]"
                style={{ color: displayColor }}
            >
                {config.abbr}
            </span>
        </div>
    );
};

interface DirectoryTreeProps {
    data: TreeNode;
    theme?: 'light' | 'dark';
}

function TreeItem({ node, level = 0, theme = 'light' }: { node: TreeNode; level?: number; theme?: 'light' | 'dark' }) {
    const [isOpen, setIsOpen] = useState(level === 0);
    const isDir = node.type === "dir";
    const isDark = theme === 'dark';

    const hasChildren = node.children && Object.keys(node.children).length > 0;
    const sortedChildren = useMemo(() => sortChildren(node.children), [node.children]);

    // 缩进配置
    const INDENT_SIZE = 24; // 每层缩进像素

    return (
        <div className="relative">
            {/* 缩进引导线 */}
            {level > 0 && (
                <div
                    className="absolute top-0 bottom-0 pointer-events-none"
                    style={{ left: `${(level - 1) * INDENT_SIZE + 20}px` }}
                >
                    <div
                        className={`w-px h-full ${isDark ? 'bg-gray-700/50' : 'bg-gray-200'}`}
                    />
                </div>
            )}

            <div
                className={cn(
                    "flex items-center gap-1.5 py-1 pr-2 rounded-md cursor-pointer group transition-colors relative",
                    isDark ? "hover:bg-gray-800/50" : "hover:bg-gray-100/70"
                )}
                onClick={() => isDir && setIsOpen(!isOpen)}
                style={{ paddingLeft: `${level * INDENT_SIZE + 12}px` }}
            >
                {/* 箭头 */}
                <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center transition-transform duration-200" style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                    {isDir && hasChildren ? (
                        <ChevronDown className={`w-3.5 h-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    ) : <div className="w-3.5 h-3.5" />}
                </div>

                {/* 图标与名称 - 使用 overflow-hidden 确保截断生效 */}
                <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    {isDir ? (
                        <Folder className={`flex-shrink-0 w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} fill={isDark ? "#60a5fa30" : "#3b82f630"} />
                    ) : (
                        <FileIcon language={node.language} isDark={isDark} />
                    )}

                    <Tooltip content={node.name} theme={theme}>
                        <span className={`truncate block max-w-full ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {node.name}
                        </span>
                    </Tooltip>
                </div>

                {/* 统计信息 - 使用 flex-shrink-0 防止被压缩 */}
                <div className="flex-shrink-0 ml-2">
                    <StatsBadges stats={node.stats} theme={theme} />
                </div>
            </div>

            {isDir && isOpen && hasChildren && (
                <div className="relative">
                    {sortedChildren.map((child, idx) => (
                        <TreeItem
                            key={`${child.path}-${idx}`}
                            node={child}
                            level={level + 1}
                            theme={theme}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// 统计信息组件：显示代码、总行数、注释、空行
function StatsBadges({ stats, theme }: { stats: Summary; theme?: 'light' | 'dark' }) {
    if (!stats) return null;
    const isDark = theme === 'dark';

    // 生成简单的数字显示组件
    const StatItem = ({ icon: Icon, value, colorClass, title }: { icon: any, value: number, colorClass: string, title: string }) => (
        <Tooltip content={title} theme={theme}>
            <div className="flex items-center gap-1 w-16 justify-end">
                <Icon className={`w-3 h-3 ${colorClass}`} />
                <span className={`text-[10px] tabular-nums ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formatNum(value)}
                </span>
            </div>
        </Tooltip>
    );

    return (
        <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
            {/* 代码行数 (最重要) */}
            <StatItem
                icon={Code2}
                value={stats.code}
                colorClass={isDark ? 'text-green-400' : 'text-green-600'}
                title={`代码行数: ${formatNum(stats.code)}`}
            />

            {/* 总行数 (Total) - 为了节省空间，可以用 FileText 图标 */}
            <StatItem
                icon={FileText}
                value={stats.lines}
                colorClass={isDark ? 'text-blue-400' : 'text-blue-600'}
                title={`总行数: ${formatNum(stats.lines)}`}
            />

            {/* 注释 (Comment) - 仅在宽度足够或非0时显示，这里为了整齐总是显示 */}
            <div className="hidden lg:flex">
                <StatItem
                    icon={MessageSquare}
                    value={stats.comments}
                    colorClass={isDark ? 'text-gray-400' : 'text-gray-500'}
                    title={`注释行数: ${formatNum(stats.comments)}`}
                />
            </div>

            {/* 空行 (Blank) - 仅在宽度足够时显示 */}
            <div className="hidden xl:flex">
                <StatItem
                    icon={AlignJustify}
                    value={stats.blanks}
                    colorClass={isDark ? 'text-gray-500' : 'text-gray-400'}
                    title={`空行数: ${formatNum(stats.blanks)}`}
                />
            </div>
        </div>
    );
}

export function DirectoryTree({ data, theme = 'light' }: DirectoryTreeProps) {
    return (
        <div className="space-y-0.5 select-none text-sm font-medium">
            <TreeItem node={data} level={0} theme={theme} />
        </div>
    );
}

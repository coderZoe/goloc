import { useState } from "react";
import type { TreeNode, Summary } from "@/types";
import {
    Folder,
    FileCode,
    ChevronRight,
    ChevronDown,
    Code2,
    MessageSquare,
    AlignJustify
} from "lucide-react";
import { cn } from "@/lib/utils";

// 辅助函数：格式化数字 (1234 -> 1,234)
const formatNum = (num: number) => new Intl.NumberFormat().format(num);

interface TreeItemProps {
    node: TreeNode;
    level?: number; // 缩进层级
}

// 单个树节点组件 (递归核心)
function TreeItem({ node, level = 0 }: TreeItemProps) {
    const [isOpen, setIsOpen] = useState(false);
    const isDir = node.type === "dir";
    const hasChildren = node.children && Object.keys(node.children).length > 0;

    // 排序：文件夹在前，文件在后；同类按名称排序
    const sortedChildren = hasChildren
        ? Object.values(node.children!).sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === "dir" ? -1 : 1;
        })
        : [];

    return (
        <div>
            {/* 这一行是当前节点 */}
            <div
                className={cn(
                    "flex items-center justify-between py-1.5 px-2 hover:bg-zinc-100 rounded-md cursor-pointer transition-colors group",
                    level === 0 && "font-medium" // 根节点加粗
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }} // 动态缩进
                onClick={() => isDir && setIsOpen(!isOpen)}
            >
                {/* 左侧：图标 + 名字 */}
                <div className="flex items-center gap-2 overflow-hidden">
                    {isDir ? (
                        <div className="text-zinc-400">
                            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>
                    ) : (
                        // 占位符，保持对齐
                        <div className="w-4" />
                    )}

                    {isDir ? (
                        <Folder size={16} className="text-blue-500 fill-blue-500/20" />
                    ) : (
                        <FileCode size={16} className="text-zinc-500" />
                    )}

                    <span className="truncate text-sm text-zinc-700">{node.name}</span>

                    {/* 如果是文件，显示语言标签 */}
                    {!isDir && node.language && (
                        <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 rounded border">
                            {node.language}
                        </span>
                    )}
                </div>

                {/* 右侧：统计数据 (Code/Comment/Blank) */}
                <StatsBadges stats={node.stats} />
            </div>

            {/* 递归渲染子节点 */}
            {isDir && isOpen && (
                <div className="border-l border-zinc-100 ml-4">
                    {sortedChildren.map((child) => (
                        <TreeItem key={child.path} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

// 统计徽章组件
function StatsBadges({ stats }: { stats: Summary }) {
    if (!stats) return null;

    return (
        <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 text-blue-600" title="Code Lines">
                <Code2 size={12} />
                <span className="font-mono">{formatNum(stats.code)}</span>
            </div>
            {/* 只有空间足够或者是文件时，才显示注释和空行，避免太挤 */}
            <div className="hidden sm:flex items-center gap-1 text-green-600" title="Comments">
                <MessageSquare size={12} />
                <span className="font-mono">{formatNum(stats.comments)}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-zinc-400" title="Blank Lines">
                <AlignJustify size={12} />
                <span className="font-mono">{formatNum(stats.blanks)}</span>
            </div>
        </div>
    );
}

// 导出主组件
export function RepoTree({ data }: { data: TreeNode }) {
    return (
        <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
            <div className="bg-zinc-50 border-b px-4 py-2 text-xs font-medium text-zinc-500 flex justify-between">
                <span>File Structure</span>
                <div className="flex gap-4 pr-2">
                    <span>Code</span>
                    <span className="hidden sm:inline">Comm</span>
                    <span className="hidden sm:inline">Blank</span>
                </div>
            </div>
            <div className="p-2">
                {/* 根节点通常是虚拟的或 "."，我们直接渲染它的子节点，或者直接从根渲染 */}
                <TreeItem node={data} />
            </div>
        </div>
    );
}
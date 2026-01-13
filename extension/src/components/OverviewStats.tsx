import { Code2, MessageSquare, FileText, Layers } from 'lucide-react';
import { formatNumber } from '../utils/stats';
import type { Summary } from '../types';

interface OverviewStatsProps {
    stats: Summary;
    theme: 'light' | 'dark';
}

export function OverviewStats({ stats, theme }: OverviewStatsProps) {
    const isDark = theme === 'dark';

    const statItems = [
        {
            label: '总行数',
            value: stats.lines,
            icon: Layers,
            color: isDark ? 'from-purple-500 to-pink-500' : 'from-purple-400 to-pink-400',
            textColor: isDark ? 'text-purple-300' : 'text-purple-700',
        },
        {
            label: '代码',
            value: stats.code,
            icon: Code2,
            color: isDark ? 'from-blue-500 to-cyan-500' : 'from-blue-400 to-cyan-400',
            textColor: isDark ? 'text-blue-300' : 'text-blue-700',
        },
        {
            label: '注释',
            value: stats.comments,
            icon: MessageSquare,
            color: isDark ? 'from-green-500 to-emerald-500' : 'from-green-400 to-emerald-400',
            textColor: isDark ? 'text-green-300' : 'text-green-700',
        },
        {
            label: '空行',
            value: stats.blanks,
            icon: FileText,
            color: isDark ? 'from-gray-500 to-slate-500' : 'from-gray-400 to-slate-400',
            textColor: isDark ? 'text-gray-300' : 'text-gray-700',
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-3">
            {statItems.map((item, index) => {
                const Icon = item.icon;
                const percentNum = stats.lines > 0 ? (item.value / stats.lines) * 100 : 0;
                const percentage = percentNum.toFixed(1);

                return (
                    <div
                        key={index}
                        className={`
                            relative overflow-hidden rounded-xl p-4 group
                            ${isDark
                                ? 'bg-gray-800/80 border border-gray-700/50 hover:border-gray-600'
                                : 'bg-white border border-gray-200 hover:border-gray-300'
                            }
                            hover:shadow-lg transition-all duration-300
                            goloc-stat-card
                        `}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {/* 背景渐变光效 */}
                        <div
                            className={`absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br ${item.color} opacity-20 rounded-full blur-2xl group-hover:opacity-30 transition-opacity`}
                        />

                        {/* 内容 */}
                        <div className="relative">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color} bg-opacity-10`}>
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                    {percentage}%
                                </span>
                            </div>

                            <div className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {item.label}
                            </div>

                            <div className={`text-2xl font-bold tracking-tight ${item.textColor}`}>
                                {formatNumber(item.value)}
                            </div>

                            {/* 底部进度条 */}
                            <div className={`mt-3 h-1 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                <div
                                    className={`h-full rounded-full bg-gradient-to-r ${item.color} goloc-progress-bar`}
                                    style={{ width: `${Math.min(percentNum, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

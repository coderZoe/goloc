import { formatNumber, formatPercentage, getLanguageColor } from '../utils/stats';
import type { LanguageStat } from '../types';

interface LanguageStatsProps {
    languages: LanguageStat[];
    theme: 'light' | 'dark';
}

export function LanguageStats({ languages, theme }: LanguageStatsProps) {
    const isDark = theme === 'dark';

    if (languages.length === 0) {
        return (
            <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <p className="text-sm">暂无语言统计</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 语言占比条形图 */}
            <div className="space-y-3">
                <div className={`flex h-4 rounded-full overflow-hidden shadow-inner ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    {languages.slice(0, 5).map((lang, index) => (
                        <div
                            key={index}
                            className="goloc-lang-bar hover:brightness-110 transition-all duration-300 cursor-pointer relative group"
                            style={{
                                width: `${lang.percentage}%`,
                                backgroundColor: getLanguageColor(lang.language),
                                animationDelay: `${index * 100}ms`,
                            }}
                            title={`${lang.language}: ${formatPercentage(lang.percentage)}%`}
                        >
                            {/* 悬停高亮条 */}
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                        </div>
                    ))}
                </div>

                {/* 语言图例 */}
                <div className="flex flex-wrap gap-2">
                    {languages.slice(0, 5).map((lang, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full transition-colors cursor-default ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                        >
                            <div
                                className="w-2.5 h-2.5 rounded-full shadow-sm"
                                style={{
                                    backgroundColor: getLanguageColor(lang.language),
                                    boxShadow: `0 0 0 2px ${getLanguageColor(lang.language)}40`,
                                }}
                            />
                            <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {lang.language}
                            </span>
                            <span className={`font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {formatPercentage(lang.percentage)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 详细列表 */}
            <div className="space-y-2 max-h-64 overflow-y-auto goloc-scrollbar">
                {languages.map((lang, index) => (
                    <div
                        key={index}
                        className={`
              flex items-center justify-between p-3 rounded-lg
              ${isDark
                                ? 'bg-gray-800/30 hover:bg-gray-800/50'
                                : 'bg-gray-50 hover:bg-gray-100'
                            }
              transition-colors duration-150
            `}
                    >
                        <div className="flex items-center gap-3 flex-1">
                            <div
                                className="w-1 h-8 rounded-full"
                                style={{ backgroundColor: getLanguageColor(lang.language) }}
                            />
                            <div>
                                <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {lang.language}
                                </div>
                                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {lang.files} 个文件
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className={`font-mono text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {formatNumber(lang.lines)} 行
                            </div>
                            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                代码 {formatNumber(lang.code)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

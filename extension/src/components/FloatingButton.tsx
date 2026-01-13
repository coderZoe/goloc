import { useGoLocStore } from '../store';
import { BarChart3, Loader2 } from 'lucide-react';

interface FloatingButtonProps {
    onClick: () => void;
}

export function FloatingButton({ onClick }: FloatingButtonProps) {
    const { status, effectiveTheme } = useGoLocStore();
    const isLoading = status === 'loading';
    const isDark = effectiveTheme === 'dark';

    return (
        <div className="relative">
            {/* 脉冲呼吸灯效果 - 仅在空闲状态显示 */}
            {!isLoading && (
                <div
                    className={`
                        absolute inset-0 rounded-full goloc-pulse-ring
                        ${isDark ? 'bg-blue-500' : 'bg-blue-400'}
                    `}
                />
            )}
            <button
                onClick={onClick}
                disabled={isLoading}
                className={`
                    goloc-fab
                    relative w-14 h-14 rounded-full
                    flex items-center justify-center
                    transition-all duration-300 ease-out
                    ${!isLoading && 'hover:scale-110 active:scale-95'}
                    ${isDark
                        ? 'shadow-xl hover:shadow-blue-500/20 text-blue-400'
                        : 'shadow-lg hover:shadow-blue-400/30 text-blue-500'
                    }
                    ${isLoading ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={{
                    backgroundColor: isDark ? '#1f2937' : '#ffffff', // gray-800 vs white
                    border: isDark ? '1px solid rgba(55, 65, 81, 0.8)' : '1px solid rgba(229, 231, 235, 1)',
                }}
                title={isLoading ? 'GoLoc - 正在分析...' : 'GoLoc - 查看代码统计'}
            >
                {isLoading ? (
                    <Loader2 className={`w-6 h-6 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                ) : (
                    <BarChart3 className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                )}
            </button>

            {/* 加载提示 */}
            {isLoading && (
                <div
                    className={`
                        absolute top-full mt-2 left-1/2 transform -translate-x-1/2
                        px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium
                        shadow-lg pointer-events-none animate-pulse
                        ${isDark
                            ? 'bg-gray-800 text-blue-400 border border-gray-700'
                            : 'bg-white text-blue-500 border border-gray-200'
                        }
                    `}
                >
                    正在分析...
                </div>
            )}
        </div>
    );
}

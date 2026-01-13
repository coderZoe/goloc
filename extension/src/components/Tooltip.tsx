import { useState, useRef, useEffect, type ReactNode } from 'react';

interface TooltipProps {
    content: string;
    children: ReactNode;
    delay?: number; // 延迟显示时间，默认 100ms
    theme?: 'light' | 'dark';
}

export function Tooltip({ content, children, delay = 100, theme = 'dark' }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const timeoutRef = useRef<number | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    const isDark = theme === 'dark';

    const showTooltip = (e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 8
        });

        timeoutRef.current = window.setTimeout(() => {
            setIsVisible(true);
        }, delay);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsVisible(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <div
            ref={triggerRef}
            className="min-w-0 overflow-hidden"
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onMouseMove={(e) => {
                if (isVisible) {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setPosition({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8
                    });
                }
            }}
        >
            {children}
            {isVisible && content && (
                <div
                    className={`
                        fixed z-[2147483647] px-2 py-1 text-xs rounded shadow-md
                        pointer-events-none whitespace-nowrap transform -translate-x-1/2 -translate-y-full
                        animate-in fade-in-0 zoom-in-95 duration-150
                        ${isDark
                            ? 'bg-gray-900 text-gray-100'
                            : 'bg-gray-800 text-white'
                        }
                    `}
                    style={{
                        left: position.x,
                        top: position.y,
                    }}
                >
                    {content}
                    {/* 小三角 */}
                    <div
                        className={`
                            absolute left-1/2 -translate-x-1/2 top-full
                            border-4 border-transparent
                            ${isDark ? 'border-t-gray-900' : 'border-t-gray-800'}
                        `}
                    />
                </div>
            )}
        </div>
    );
}

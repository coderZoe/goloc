import React, { useRef, useState, useEffect } from 'react';

interface DraggableProps {
    children: React.ReactNode;
    position: { x: number; y: number };
    onPositionChange: (pos: { x: number; y: number }, persist?: boolean) => void;
    className?: string;
}

export function Draggable({ children, position, onPositionChange, className = '' }: DraggableProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    // 使用ref来追踪当前位置，以便在handleMouseUp中访问到最新的位置
    const currentPosRef = useRef(position);
    // 记录拖拽开始时的位置，用于区分点击和拖拽
    const dragStartPosRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        currentPosRef.current = position;
    }, [position]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const newX = e.clientX - offset.x;
            const newY = e.clientY - offset.y;

            // 确保不超出边界
            const maxX = window.innerWidth - (ref.current?.offsetWidth || 0);
            const maxY = window.innerHeight - (ref.current?.offsetHeight || 0);

            const newPos = {
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY)),
            };

            currentPosRef.current = newPos;
            onPositionChange(newPos, false); // 拖拽中不保存
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            // 拖拽结束，保存一次最终位置
            onPositionChange(currentPosRef.current, true);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, offset, onPositionChange]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (ref.current) {
            setOffset({
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            });
            setIsDragging(true);
            dragStartPosRef.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleClickCapture = (e: React.MouseEvent) => {
        const dx = e.clientX - dragStartPosRef.current.x;
        const dy = e.clientY - dragStartPosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 如果移动距离超过 5px，认为是拖拽而不是点击
        if (distance > 5) {
            e.stopPropagation();
            e.preventDefault();
        }
    };

    return (
        <div
            ref={ref}
            className={`fixed ${className}`}
            style={{
                left: position.x,
                top: position.y,
                cursor: isDragging ? 'grabbing' : 'grab',
                zIndex: 2147483647,
            }}
            onMouseDown={handleMouseDown}
            onClickCapture={handleClickCapture}
        >
            {children}
        </div>
    );
}

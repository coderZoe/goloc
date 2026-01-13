export function formatDuration(seconds: number): string {
    if (seconds === 0) return '0秒';

    const units = [
        { label: '年', value: 31536000 },
        { label: '月', value: 2592000 },
        { label: '周', value: 604800 },
        { label: '天', value: 86400 },
        { label: '小时', value: 3600 },
        { label: '分', value: 60 },
        { label: '秒', value: 1 },
    ];

    const parts: string[] = [];
    let remaining = seconds;

    for (const unit of units) {
        if (remaining >= unit.value) {
            const count = Math.floor(remaining / unit.value);
            remaining %= unit.value;
            parts.push(`${count}${unit.label}`);
        }
    }

    // 取前两个最大单位，避免太长
    return parts.slice(0, 2).join('');
}

export function parseDuration(input: string): number {
    // 简单的解析逻辑，或者只支持纯数字输入
    return parseInt(input) || 0;
}

export function formatBytes(bytes: number, decimals = 1): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

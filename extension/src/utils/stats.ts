import type { TreeNode, LanguageStat } from '../types';

// 计算语言统计
export function calculateLanguageStats(node: TreeNode): LanguageStat[] {
    const langMap = new Map<string, LanguageStat>();

    function traverse(n: TreeNode) {
        if (n.type === 'file' && n.language) {
            const existing = langMap.get(n.language);
            if (existing) {
                existing.files += 1;
                existing.lines += n.stats.lines;
                existing.code += n.stats.code;
                existing.comments += n.stats.comments;
                existing.blanks += n.stats.blanks;
            } else {
                langMap.set(n.language, {
                    language: n.language,
                    files: 1,
                    lines: n.stats.lines,
                    code: n.stats.code,
                    comments: n.stats.comments,
                    blanks: n.stats.blanks,
                    percentage: 0,
                });
            }
        }

        if (n.children) {
            Object.values(n.children).forEach(traverse);
        }
    }

    traverse(node);

    // 计算百分比
    const totalLines = Array.from(langMap.values()).reduce((sum, stat) => sum + stat.lines, 0);
    langMap.forEach(stat => {
        stat.percentage = totalLines > 0 ? (stat.lines / totalLines) * 100 : 0;
    });

    // 按行数降序排序
    return Array.from(langMap.values()).sort((a, b) => b.lines - a.lines);
}

// 格式化数字
export function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
}

// 格式化百分比
export function formatPercentage(num: number): string {
    return num.toFixed(1);
}

// 获取语言颜色
export { getLanguageColor } from './languages';

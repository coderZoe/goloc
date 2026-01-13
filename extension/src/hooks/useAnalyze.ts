import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import type { AnalyzeRequest } from "../types";

// Hook 1: 获取配置 (只读，自动缓存)
export function useAppConfig() {
    return useQuery({
        queryKey: ["appConfig"],
        queryFn: apiClient.getConfig,
        staleTime: 1000 * 60 * 5, // 5分钟内不重复请求配置
    });
}

// Hook 2: 执行分析 (动作触发)
export function useAnalyzeRepo() {
    return useMutation({
        mutationFn: (params: AnalyzeRequest) => apiClient.analyze(params),
    });
}
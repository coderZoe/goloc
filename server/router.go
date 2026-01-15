package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"runtime/debug"
	"strings"
	"time"
)

func recoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("[PANIC] %v\n%s", err, string(debug.Stack()))

				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)

				json.NewEncoder(w).Encode(Response{
					Code:    500,
					Message: fmt.Sprintf("Internal Server Error: %v", err),
					Data:    nil,
				})
			}
		}()

		next.ServeHTTP(w, r)
	})
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func handleConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodGet {
		json.NewEncoder(w).Encode(Response{
			Code:    0,
			Message: "success",
			Data:    appConfig.Get(),
		})
		return
	}

	if r.Method == http.MethodPost {
		var newCfg Config
		if err := json.NewDecoder(r.Body).Decode(&newCfg); err != nil {
			json.NewEncoder(w).Encode(Response{
				Code:    400,
				Message: "Invalid JSON: " + err.Error(),
				Data:    nil,
			})
			return
		}
		appConfig.Update(newCfg)

		json.NewEncoder(w).Encode(Response{
			Code:    0,
			Message: "success",
			Data:    appConfig.Get(),
		})
		return
	}

	json.NewEncoder(w).Encode(Response{
		Code:    405,
		Message: "Method not allowed",
		Data:    nil,
	})
}

func handleAnalyze(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		json.NewEncoder(w).Encode(Response{
			Code:    405,
			Message: "Only POST allowed",
			Data:    nil,
		})
		return
	}

	type RequestPayload struct {
		RepoURL  string `json:"repo_url"`
		Branch   string `json:"branch"`
		MaxDepth int    `json:"max_depth"`
	}
	var req RequestPayload
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		json.NewEncoder(w).Encode(Response{
			Code:    400,
			Message: "Invalid JSON: " + err.Error(),
			Data:    nil,
		})
		return
	}

	if req.RepoURL == "" {
		json.NewEncoder(w).Encode(Response{
			Code:    400,
			Message: "repo_url is required",
			Data:    nil,
		})
		return
	}

	cacheKey := fmt.Sprintf("%s|%s", req.RepoURL, req.Branch)
	var files []FileStat
	var source string

	if cachedData, found := cache.Get(cacheKey); found {
		files = cachedData
		source = "cache"
		fmt.Println("[Cache] Hit:", cacheKey)
	} else {
		source = "live"
		fmt.Println("[Cache] Miss:", cacheKey)

		ctx, cancel := context.WithTimeout(context.Background(), time.Duration(appConfig.Get().RequestTimeout)*time.Second)
		defer cancel()

		var err error
		files, err = FetchRepoStats(ctx, req.RepoURL, req.Branch)
		if err != nil {
			json.NewEncoder(w).Encode(Response{
				Code:    500,
				Message: "Analysis failed: " + err.Error(),
				Data:    nil,
			})
			return
		}

		cache.Set(cacheKey, files, appConfig.Get().CacheTTL)
	}

	// 根据当前配置过滤文件（缓存的是完整数据）
	cfg := appConfig.Get()
	filteredFiles := make([]FileStat, 0, len(files))
	for _, f := range files {
		if ShouldIncludeLanguage(f.Language, cfg.IncludeDataFiles, cfg.IncludeDocumentation) {
			filteredFiles = append(filteredFiles, f)
		}
	}
	fmt.Printf("[Filter] Applied language filter: %d -> %d files\n", len(files), len(filteredFiles))

	depth := req.MaxDepth
	if depth <= 0 {
		depth = cfg.DefaultDepth
	}
	projectName := extractProjectName(req.RepoURL)
	treeRoot := BuildTree(filteredFiles, depth, projectName)

	// 计算完整的语言统计（基于所有过滤后的文件，不受深度限制）
	languages := CalculateLanguageStats(filteredFiles)

	result := AnalyzeResult{
		Source:    source,
		Repo:      req.RepoURL,
		Branch:    req.Branch,
		Timestamp: time.Now().Unix(),
		Data:      treeRoot,
		Languages: languages,
	}

	json.NewEncoder(w).Encode(Response{
		Code:    0,
		Message: "success",
		Data:    result,
	})
}

func extractProjectName(repoURL string) string {
	// 移除.git后缀
	cleaned := repoURL
	if len(cleaned) > 4 && cleaned[len(cleaned)-4:] == ".git" {
		cleaned = cleaned[:len(cleaned)-4]
	}

	// 移除末尾的斜杠
	cleaned = strings.TrimSuffix(cleaned, "/")

	// 分割URL并取最后一部分
	parts := strings.Split(cleaned, "/")
	if len(parts) > 0 {
		return parts[len(parts)-1]
	}

	return "root"
}

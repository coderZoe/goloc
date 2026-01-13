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

				json.NewEncoder(w).Encode(map[string]interface{}{
					"error": "Internal Server Error",
					"msg":   fmt.Sprintf("Service panic: %v", err),
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
		json.NewEncoder(w).Encode(appConfig.Get())
		return
	}

	if r.Method == http.MethodPost {
		var newCfg Config
		if err := json.NewDecoder(r.Body).Decode(&newCfg); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}
		appConfig.Update(newCfg)

		json.NewEncoder(w).Encode(appConfig.Get())
		return
	}

	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func handleAnalyze(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	type RequestPayload struct {
		RepoURL  string `json:"repo_url"`
		Branch   string `json:"branch"`
		MaxDepth int    `json:"max_depth"`
	}
	var req RequestPayload
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.RepoURL == "" {
		http.Error(w, "repo_url is required", http.StatusBadRequest)
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
			http.Error(w, fmt.Sprintf("Analysis failed: %v", err), http.StatusInternalServerError)
			return
		}

		cache.Set(cacheKey, files, appConfig.Get().CacheTTL)
	}

	depth := req.MaxDepth
	if depth <= 0 {
		depth = appConfig.Get().DefaultDepth
	}
	projectName := extractProjectName(req.RepoURL)
	treeRoot := BuildTree(files, depth, projectName)

	resp := map[string]interface{}{
		"source":    source,
		"repo":      req.RepoURL,
		"branch":    req.Branch,
		"timestamp": time.Now().Unix(),
		"data":      treeRoot,
	}

	json.NewEncoder(w).Encode(resp)
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

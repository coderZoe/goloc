package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/google/uuid"
	"github.com/hhatto/gocloc"
)

// RepoMeta contains repository metadata from GitHub API
type RepoMeta struct {
	Size          int64  `json:"size"` // KB
	DefaultBranch string `json:"default_branch"`
}

// buildExcludeDirRegex 构建排除目录的正则表达式
func buildExcludeDirRegex(excludeDirs []string) *regexp.Regexp {
	if len(excludeDirs) == 0 {
		return nil
	}

	// 对每个目录名进行正则转义，然后用 | 连接
	var patterns []string
	for _, dir := range excludeDirs {
		// 转义特殊字符（如 .idea 中的点）
		escaped := regexp.QuoteMeta(dir)
		patterns = append(patterns, escaped)
	}

	// 构建正则：匹配目录名
	// 使用 (^|/) 确保匹配的是完整目录名，而不是部分匹配
	pattern := fmt.Sprintf("(^|[\\/])(%s)([\\/]|$)", strings.Join(patterns, "|"))
	re, err := regexp.Compile(pattern)
	if err != nil {
		fmt.Printf("[Warning] Failed to compile exclude regex: %v\n", err)
		return nil
	}
	return re
}

func FetchRepoStats(ctx context.Context, repoURL string, branch string) ([]FileStat, error) {
	cfg := appConfig.Get()

	// Get repository metadata (size check + default branch)
	meta, err := getRepoMeta(ctx, repoURL, cfg.GithubToken)
	if err != nil {
		return nil, fmt.Errorf("failed to get repo metadata: %v", err)
	}

	// Check repo size
	repoSizeMB := meta.Size / 1024
	if repoSizeMB > cfg.MaxRepoSizeMB {
		return nil, fmt.Errorf("repo too large: %d MB exceeds limit %d MB", repoSizeMB, cfg.MaxRepoSizeMB)
	}
	fmt.Printf("[Pre-Check] Passed. Size: %d MB, Default branch: %s\n", repoSizeMB, meta.DefaultBranch)

	// Use default branch from API if branch not specified
	targetBranch := branch
	if targetBranch == "" {
		targetBranch = meta.DefaultBranch
		fmt.Printf("[Branch] Using default branch from API: %s\n", targetBranch)
	} else {
		fmt.Printf("[Branch] Using specified branch: %s\n", targetBranch)
	}

	taskID := uuid.New().String()
	tmpDir := filepath.Join(os.TempDir(), "goloc_repo", taskID)
	defer os.RemoveAll(tmpDir)

	// Clone repository
	if err := cloneRepo(ctx, repoURL, targetBranch, tmpDir); err != nil {
		return nil, err
	}
	fmt.Printf("[Process] Successfully cloned branch: %s\n", targetBranch)

	languages := gocloc.NewDefinedLanguages()
	options := gocloc.NewClocOptions()

	// 设置排除目录
	if len(cfg.ExcludeDirs) > 0 {
		excludeRegex := buildExcludeDirRegex(cfg.ExcludeDirs)
		if excludeRegex != nil {
			options.ReNotMatchDir = excludeRegex
			fmt.Printf("[Filter] Excluding directories: %v\n", cfg.ExcludeDirs)
		}
	}

	processor := gocloc.NewProcessor(languages, options)
	result, err := processor.Analyze([]string{tmpDir})
	if err != nil {
		return nil, fmt.Errorf("gocloc analysis failed: %v", err)
	}

	// 返回所有文件，不在此处过滤
	// 缓存完整数据，过滤在 router.go 中根据当前配置进行
	var stats []FileStat
	for _, lang := range result.Languages {
		for _, filePath := range lang.Files {
			clocFile, ok := result.Files[filePath]
			if !ok {
				continue
			}
			relPath, err := filepath.Rel(tmpDir, filePath)
			if err != nil {
				relPath = filePath
			}
			stats = append(stats, FileStat{
				Path:     relPath,
				Language: lang.Name,
				Code:     int(clocFile.Code),
				Comments: int(clocFile.Comments),
				Blanks:   int(clocFile.Blanks),
			})
		}
	}
	fmt.Printf("[Process] Analysis done. Total files: %d\n", len(stats))
	return stats, nil
}

// cloneRepo clones a repository with the specified branch
// Automatically uses HTTP_PROXY/HTTPS_PROXY from environment if set
func cloneRepo(ctx context.Context, repoURL string, branch string, tmpDir string) error {
	args := []string{"clone", "--depth=1", "--single-branch"}
	if branch != "" {
		args = append(args, "--branch", branch)
	}
	args = append(args, repoURL, tmpDir)

	// Log proxy settings if present
	if proxy := os.Getenv("HTTPS_PROXY"); proxy != "" {
		fmt.Printf("[Process] Using HTTPS_PROXY: %s\n", proxy)
	} else if proxy := os.Getenv("https_proxy"); proxy != "" {
		fmt.Printf("[Process] Using https_proxy: %s\n", proxy)
	} else if proxy := os.Getenv("HTTP_PROXY"); proxy != "" {
		fmt.Printf("[Process] Using HTTP_PROXY: %s\n", proxy)
	} else if proxy := os.Getenv("http_proxy"); proxy != "" {
		fmt.Printf("[Process] Using http_proxy: %s\n", proxy)
	}

	fmt.Printf("[Process] Cloning %s (branch: %s) to %s...\n", repoURL, branch, tmpDir)

	cmd := exec.CommandContext(ctx, "git", args...)
	// Inherit all environment variables (includes HTTP_PROXY, HTTPS_PROXY, etc.)
	cmd.Env = os.Environ()

	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("git clone failed: %s, output: %s", err, strings.TrimSpace(string(out)))
	}
	return nil
}

// getRepoMeta fetches repository metadata from GitHub API
func getRepoMeta(ctx context.Context, repoURL string, token string) (*RepoMeta, error) {
	trimmed := strings.TrimSuffix(repoURL, ".git")
	parts := strings.Split(trimmed, "/")
	if len(parts) < 2 {
		return nil, fmt.Errorf("invalid github url")
	}
	repo := parts[len(parts)-1]
	owner := parts[len(parts)-2]

	apiURL := fmt.Sprintf("https://api.github.com/repos/%s/%s", owner, repo)
	req, err := http.NewRequestWithContext(ctx, "GET", apiURL, nil)
	if err != nil {
		return nil, err
	}

	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("api network error: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("github api error: %s", resp.Status)
	}

	var meta RepoMeta
	if err := json.NewDecoder(resp.Body).Decode(&meta); err != nil {
		return nil, fmt.Errorf("failed to decode api response: %v", err)
	}

	tokenStatus := "Anonymous"
	if token != "" {
		tokenStatus = "Authenticated"
	}
	fmt.Printf("[API] %s - Size: %d KB, Default branch: %s\n", tokenStatus, meta.Size, meta.DefaultBranch)

	return &meta, nil
}

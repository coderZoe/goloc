package main

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"sync"
)

// DefaultExcludeDirs 默认排除的目录列表
// 这些目录是 100% 安全排除的：包管理器依赖、版本控制、IDE 配置、缓存等
var DefaultExcludeDirs = []string{
	// 包管理器依赖 - 100% 安全
	"node_modules",     // npm/yarn/pnpm
	"vendor",           // Go modules / PHP Composer
	"Pods",             // iOS CocoaPods
	".venv",            // Python virtualenv
	"venv",             // Python virtualenv
	"env",              // Python virtualenv (注意：可能误伤，但通常 env 目录是虚拟环境)
	"virtualenv",       // Python virtualenv
	"__pycache__",      // Python 缓存
	".bundle",          // Ruby Bundler
	"bower_components", // Bower
	"jspm_packages",    // JSPM

	// 版本控制 - 100% 安全
	".git",
	".svn",
	".hg",

	// IDE 配置 - 100% 安全
	".idea",
	".vscode",
	".vs",
	".eclipse",

	// 缓存目录 - 100% 安全
	".cache",
	".npm",
	".yarn",
	".gradle",
	".nuget",
	".pnp",
}

type Config struct {
	CacheTTL             int64    `json:"cache_ttl_seconds"`
	DefaultDepth         int      `json:"default_depth"`
	RequestTimeout       int      `json:"request_timeout_seconds"`
	MaxRepoSizeMB        int64    `json:"max_repo_size_mb"`
	ExcludeDirs          []string `json:"exclude_dirs"`
	IncludeDataFiles     bool     `json:"include_data_files"`    // 是否统计数据文件（JSON/XML/YAML等）
	IncludeDocumentation bool     `json:"include_documentation"` // 是否统计文档文件（Markdown/TXT等）
	GithubToken          string   `json:"-"`
}

type AppConfig struct {
	inner Config
	mu    sync.RWMutex
}

func NewAppConfig() *AppConfig {
	defaultCfg := Config{
		CacheTTL:             60 * 60 * 24 * 7,
		DefaultDepth:         5,
		RequestTimeout:       120,
		MaxRepoSizeMB:        100,
		ExcludeDirs:          DefaultExcludeDirs,
		IncludeDataFiles:     false, // 默认不统计数据文件
		IncludeDocumentation: false, // 默认不统计文档文件
		GithubToken:          "",
	}

	if val := os.Getenv("CACHE_TTL"); val != "" {
		if i, err := strconv.ParseInt(val, 10, 64); err == nil {
			defaultCfg.CacheTTL = i
		}
	}
	if val := os.Getenv("MAX_REPO_SIZE_MB"); val != "" {
		if i, err := strconv.ParseInt(val, 10, 64); err == nil {
			defaultCfg.MaxRepoSizeMB = i
		}
	}
	if val := os.Getenv("GITHUB_TOKEN"); val != "" {
		defaultCfg.GithubToken = val
	}
	// 从环境变量读取额外的排除目录（逗号分隔）
	if val := os.Getenv("EXCLUDE_DIRS"); val != "" {
		extraDirs := strings.Split(val, ",")
		for _, dir := range extraDirs {
			dir = strings.TrimSpace(dir)
			if dir != "" {
				defaultCfg.ExcludeDirs = append(defaultCfg.ExcludeDirs, dir)
			}
		}
	}

	return &AppConfig{
		inner: defaultCfg,
	}
}

func (c *AppConfig) Get() Config {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.inner
}

func (c *AppConfig) Update(newCfg Config) {
	c.mu.Lock()
	defer c.mu.Unlock()

	// 检查排除目录是否有变化
	excludeDirsChanged := false
	if newCfg.ExcludeDirs != nil {
		if len(newCfg.ExcludeDirs) != len(c.inner.ExcludeDirs) {
			excludeDirsChanged = true
		} else {
			for i, dir := range newCfg.ExcludeDirs {
				if dir != c.inner.ExcludeDirs[i] {
					excludeDirsChanged = true
					break
				}
			}
		}
	}

	if newCfg.MaxRepoSizeMB > 0 {
		c.inner.MaxRepoSizeMB = newCfg.MaxRepoSizeMB
	}
	if newCfg.CacheTTL > 0 {
		c.inner.CacheTTL = newCfg.CacheTTL
	}
	if newCfg.DefaultDepth > 0 {
		c.inner.DefaultDepth = newCfg.DefaultDepth
	}
	if newCfg.RequestTimeout > 0 {
		c.inner.RequestTimeout = newCfg.RequestTimeout
	}
	// 如果传入了 ExcludeDirs，则更新（允许传空数组来清空）
	if newCfg.ExcludeDirs != nil {
		c.inner.ExcludeDirs = newCfg.ExcludeDirs
	}
	// 更新语言过滤选项（这些是 bool，可以直接覆盖）
	c.inner.IncludeDataFiles = newCfg.IncludeDataFiles
	c.inner.IncludeDocumentation = newCfg.IncludeDocumentation

	// 如果排除目录有变化，清空缓存
	if excludeDirsChanged && cache != nil {
		cache.Clear()
		fmt.Println("[Config] ExcludeDirs changed, cache cleared")
	}

	fmt.Printf("[Config] Updated: %+v\n", c.inner)
}

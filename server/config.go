package main

import (
	"fmt"
	"os"
	"strconv"
	"sync"
)

type Config struct {
	CacheTTL       int64  `json:"cache_ttl_seconds"`
	DefaultDepth   int    `json:"default_depth"`
	RequestTimeout int    `json:"request_timeout_seconds"`
	MaxRepoSizeMB  int64  `json:"max_repo_size_mb"`
	GithubToken    string `json:"-"`
}

type AppConfig struct {
	inner Config
	mu    sync.RWMutex
}

func NewAppConfig() *AppConfig {
	defaultCfg := Config{
		CacheTTL:       60 * 60 * 24 * 7,
		DefaultDepth:   5,
		RequestTimeout: 120,
		MaxRepoSizeMB:  100,
		GithubToken:    "",
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

	fmt.Printf("[Config] Updated: %+v\n", c.inner)
}

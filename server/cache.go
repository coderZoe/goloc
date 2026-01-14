package main

import (
	"sync"
	"time"
)

type CacheItem struct {
	value      []FileStat
	expiration int64
}

type SafeCache struct {
	cache map[string]*CacheItem
	mu    sync.RWMutex
}

func NewCache(cleanInterval time.Duration) *SafeCache {
	cache := &SafeCache{
		cache: make(map[string]*CacheItem),
	}

	go cache.startCleaner(cleanInterval)
	return cache
}

func (c *SafeCache) startCleaner(interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for range ticker.C {
		c.cleanup()
	}
}

func (c *SafeCache) cleanup() {
	c.mu.Lock()
	defer c.mu.Unlock()

	now := time.Now().UnixNano()
	for k, v := range c.cache {
		if now > v.expiration {
			delete(c.cache, k)
		}
	}
}

func (c *SafeCache) Set(key string, data []FileStat, ttlSeconds int64) {
	c.mu.Lock()
	defer c.mu.Unlock()

	exp := time.Now().Add(time.Duration(ttlSeconds) * time.Second).UnixNano()
	c.cache[key] = &CacheItem{
		value:      data,
		expiration: exp,
	}
}

func (c *SafeCache) Get(key string) ([]FileStat, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, found := c.cache[key]
	if !found {
		return nil, false
	}
	if time.Now().UnixNano() > item.expiration {
		return nil, false
	}

	return item.value, true
}

// Clear 清空所有缓存
func (c *SafeCache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.cache = make(map[string]*CacheItem)
}

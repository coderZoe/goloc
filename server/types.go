package main

type FileStat struct {
	Path     string `json:"path"`
	Language string `json:"language,omitempty"`
	Code     int    `json:"code"`
	Comments int    `json:"comments"`
	Blanks   int    `json:"blanks"`
}

type Summary struct {
	Lines    int `json:"lines"`
	Code     int `json:"code"`
	Comments int `json:"comments"`
	Blanks   int `json:"blanks"`
}

// LanguageStat 语言统计
type LanguageStat struct {
	Language   string  `json:"language"`
	Files      int     `json:"files"`
	Lines      int     `json:"lines"`
	Code       int     `json:"code"`
	Comments   int     `json:"comments"`
	Blanks     int     `json:"blanks"`
	Percentage float64 `json:"percentage"`
}

type Node struct {
	Name     string           `json:"name"`
	Type     string           `json:"type"`
	Path     string           `json:"path"`
	Language string           `json:"language,omitempty"`
	Stats    Summary          `json:"stats"`
	Children map[string]*Node `json:"children"`
}

// Response 统一API响应结构
type Response struct {
	Code    int         `json:"code"`    // 响应状态码: 0 表示成功, 非0表示失败
	Data    interface{} `json:"data"`    // 响应数据
	Message string      `json:"message"` // 响应消息
}

// AnalyzeResult 分析结果数据结构
type AnalyzeResult struct {
	Source    string         `json:"source"`
	Repo      string         `json:"repo"`
	Branch    string         `json:"branch"`
	Timestamp int64          `json:"timestamp"`
	Data      *Node          `json:"data"`
	Languages []LanguageStat `json:"languages"` // 完整的语言统计（不受深度限制）
}

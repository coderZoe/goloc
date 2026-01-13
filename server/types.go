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

type Node struct {
	Name     string           `json:"name"`
	Type     string           `json:"type"`
	Path     string           `json:"path"`
	Language string           `json:"language,omitempty"`
	Stats    Summary          `json:"stats"`
	Children map[string]*Node `json:"children"`
}


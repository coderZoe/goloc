package main

import "strings"

func BuildTree(files []FileStat, maxDepth int, projectName string) *Node {
	if projectName == "" {
		projectName = "root"
	}

	root := &Node{
		Name:     projectName,
		Type:     "dir",
		Path:     "",
		Children: make(map[string]*Node),
	}
	for _, file := range files {
		cleanPath := strings.ReplaceAll(file.Path, "\\", "/")
		parts := strings.Split(cleanPath, "/")
		current := root

		addToStats(&current.Stats, file)
		for i, part := range parts {
			if i >= maxDepth {
				break
			}
			if _, ok := current.Children[part]; !ok {
				isLast := i == len(parts)-1
				nodeType := "dir"
				lang := ""
				if isLast {
					nodeType = "file"
					lang = file.Language
				}
				current.Children[part] = &Node{
					Name:     part,
					Type:     nodeType,
					Path:     strings.Join(parts[:i+1], "/"),
					Language: lang,
					Children: make(map[string]*Node),
				}
			}
			child := current.Children[part]
			addToStats(&child.Stats, file)
			current = child
		}
	}
	return root
}

func addToStats(s *Summary, f FileStat) {
	s.Code += f.Code
	s.Comments += f.Comments
	s.Blanks += f.Blanks
	s.Lines += (f.Code + f.Comments + f.Blanks)
}

// CalculateLanguageStats 计算所有文件的语言统计（不受深度限制）
func CalculateLanguageStats(files []FileStat) []LanguageStat {
	langMap := make(map[string]*LanguageStat)
	totalLines := 0

	for _, file := range files {
		if file.Language == "" {
			continue
		}
		lines := file.Code + file.Comments + file.Blanks
		totalLines += lines

		if stat, ok := langMap[file.Language]; ok {
			stat.Files++
			stat.Lines += lines
			stat.Code += file.Code
			stat.Comments += file.Comments
			stat.Blanks += file.Blanks
		} else {
			langMap[file.Language] = &LanguageStat{
				Language: file.Language,
				Files:    1,
				Lines:    lines,
				Code:     file.Code,
				Comments: file.Comments,
				Blanks:   file.Blanks,
			}
		}
	}

	// 计算百分比并转为切片
	result := make([]LanguageStat, 0, len(langMap))
	for _, stat := range langMap {
		if totalLines > 0 {
			stat.Percentage = float64(stat.Lines) / float64(totalLines) * 100
		}
		result = append(result, *stat)
	}

	// 按行数降序排序
	for i := 0; i < len(result)-1; i++ {
		for j := i + 1; j < len(result); j++ {
			if result[j].Lines > result[i].Lines {
				result[i], result[j] = result[j], result[i]
			}
		}
	}

	return result
}

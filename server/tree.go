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

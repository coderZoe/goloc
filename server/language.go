package main

// LanguageCategory 语言分类
type LanguageCategory string

const (
	CategoryProgramming   LanguageCategory = "programming"   // 编程语言
	CategoryData          LanguageCategory = "data"          // 数据文件
	CategoryDocumentation LanguageCategory = "documentation" // 文档文件
	CategoryOther         LanguageCategory = "other"         // 其他
)

// 数据文件语言列表
var dataLanguages = map[string]bool{
	"JSON":             true,
	"XML":              true,
	"YAML":             true,
	"TOML":             true,
	"INI":              true,
	"Properties File":  true,
	"CSV":              true,
	"TSV":              true,
	"Protocol Buffers": true, // .proto 文件是数据定义
	"Thrift":           true,
	"GraphQL":          true, // Schema 定义
	"HCL":              true, // HashiCorp 配置语言
	"Jsonnet":          true,
	"Dhall":            true,
	"Nix":              true, // 配置语言
	"Plist":            true, // Apple Property List
	"XAML":             true,
	"SVG":              true,
	"Dockerfile":       true, // 配置文件
	"Docker Compose":   true,
	"Kubernetes":       true,
	"Terraform":        true,
	"Ansible":          true,
	"Puppet":           true,
	"SaltStack":        true,
	"Vagrantfile":      true,
	"Gemfile":          true, // Ruby 依赖配置
	"Podfile":          true, // iOS 依赖配置
	"Brewfile":         true,
	"EditorConfig":     true,
	"gitignore":        true,
	"gitattributes":    true,
	"npmrc":            true,
	"Cargo Lock":       true,
	"Cython":           true,
}

// 文档文件语言列表
var documentationLanguages = map[string]bool{
	"Markdown":         true,
	"Plain Text":       true,
	"Text":             true,
	"reStructuredText": true,
	"AsciiDoc":         true,
	"Org":              true, // Emacs Org mode
	"LaTeX":            true,
	"TeX":              true,
	"Groff":            true,
	"troff":            true,
	"POD":              true, // Perl documentation
	"RDoc":             true, // Ruby documentation
	"License":          true,
	"Readme":           true,
	"Changelog":        true,
	"AUTHORS":          true,
	"CONTRIBUTORS":     true,
	"COPYING":          true,
	"TODO":             true,
	"NOTICE":           true,
}

// GetLanguageCategory 获取语言的分类
func GetLanguageCategory(language string) LanguageCategory {
	if dataLanguages[language] {
		return CategoryData
	}
	if documentationLanguages[language] {
		return CategoryDocumentation
	}
	// 默认认为是编程语言
	return CategoryProgramming
}

// IsDataLanguage 判断是否是数据文件语言
func IsDataLanguage(language string) bool {
	return dataLanguages[language]
}

// IsDocumentationLanguage 判断是否是文档语言
func IsDocumentationLanguage(language string) bool {
	return documentationLanguages[language]
}

// ShouldIncludeLanguage 根据配置判断是否应该包含该语言
func ShouldIncludeLanguage(language string, includeData bool, includeDoc bool) bool {
	category := GetLanguageCategory(language)

	switch category {
	case CategoryData:
		return includeData
	case CategoryDocumentation:
		return includeDoc
	case CategoryProgramming, CategoryOther:
		return true
	default:
		return true
	}
}

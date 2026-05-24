/// Built-in note templates shipped with the application.
use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Template {
    pub id: &'static str,
    pub name: &'static str,
    pub category: &'static str,
    pub description: &'static str,
    pub source_qd_seed: &'static str,
}

const TEMPLATES: &[Template] = &[
    Template {
        id: "scientific-article",
        name: "Scientific Article",
        category: "academic",
        description: "Structured academic paper with abstract, sections, figures, and references.",
        source_qd_seed: ".doctype {paged}\n.docname {Article Title}\n.docauthor {Author Name}\n\n\
# Abstract\n\nWrite your abstract here.\n\n\
# Introduction\n\nIntroduce the topic.\n\n\
# Methodology\n\nDescribe your methodology.\n\n\
# Results\n\nPresent your results.\n\n\
# Conclusion\n\nSummarize your findings.",
    },
    Template {
        id: "slides",
        name: "Slides",
        category: "presentation",
        description: "Presentation slides with speaker notes and fragments.",
        source_qd_seed: ".doctype {slides}\n.docname {Presentation Title}\n.docauthor {Author}\n\n\
# Slide 1 — Title\n\nFirst slide content.\n\n---\n\n\
# Slide 2\n\nSecond slide content.",
    },
    Template {
        id: "school-assignment",
        name: "School Assignment",
        category: "academic",
        description: "Standard school assignment with title, sections, and conclusions.",
        source_qd_seed: ".doctype {paged}\n.docname {Assignment Title}\n.docauthor {Student Name}\n\n\
# Introduction\n\nState the objective of this assignment.\n\n\
# Development\n\nDevelop your answer here.\n\n\
# Conclusion\n\nSummarize your conclusions.",
    },
    Template {
        id: "math-work",
        name: "Math / Science Work",
        category: "academic",
        description: "Problem sets and derivations with inline and block math.",
        source_qd_seed: ".doctype {paged}\n.docname {Problem Set}\n.docauthor {Student Name}\n\n\
# Problem 1\n\nGiven: $$f(x) = x^2 + 2x + 1$$\n\nFind the roots.\n\n\
## Solution\n\nApplying the quadratic formula:\n\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$",
    },
    Template {
        id: "mermaid-flowchart",
        name: "Mermaid Flowchart",
        category: "diagram",
        description: "Diagram or flowchart using Mermaid syntax.",
        source_qd_seed: "# Process Flowchart\n\nDescribe the process below.\n\n\
.mermaid\n    flowchart TD\n        A[Start] --> B{Decision}\n        B -->|Yes| C[Action A]\n        B -->|No| D[Action B]\n        C --> E[End]\n        D --> E",
    },
    Template {
        id: "data-table",
        name: "Data Table",
        category: "data",
        description: "Structured data table with sortable columns.",
        source_qd_seed: "# Data Table\n\nDescription of the data below.\n\n\
| Column A | Column B | Column C |\n|----------|----------|----------|\n| Value 1  | Value 2  | Value 3  |\n| Value 4  | Value 5  | Value 6  |",
    },
];

#[tauri::command]
pub fn list_templates() -> Vec<Template> {
    TEMPLATES.to_vec()
}

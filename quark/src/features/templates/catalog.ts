/**
 * Front-end representation of built-in templates.
 *
 * The source of truth lives in the Rust backend (commands/templates.rs);
 * this file provides TypeScript-typed defaults for the UI layer and tests.
 */
import type { Template } from '../../core/types'

export const BUILT_IN_TEMPLATES: Template[] = [
  {
    id: 'scientific-article',
    name: 'Scientific Article',
    category: 'academic',
    description: 'Structured academic paper with abstract, sections, figures, and references.',
    sourceQdSeed:
      '.doctype {paged}\n.docname {Article Title}\n.docauthor {Author Name}\n\n# Abstract\n\nWrite your abstract here.\n\n# Introduction\n\nIntroduce the topic.',
  },
  {
    id: 'slides',
    name: 'Slides',
    category: 'presentation',
    description: 'Presentation slides powered by Quarkdown slides doctype.',
    sourceQdSeed:
      '.doctype {slides}\n.docname {Presentation Title}\n.docauthor {Author}\n\n# Slide 1\n\nFirst slide content.\n\n---\n\n# Slide 2\n\nSecond slide content.',
  },
  {
    id: 'school-assignment',
    name: 'School Assignment',
    category: 'academic',
    description: 'Standard school assignment with introduction, development, and conclusion.',
    sourceQdSeed:
      '.doctype {paged}\n.docname {Assignment Title}\n.docauthor {Student Name}\n\n# Introduction\n\n# Development\n\n# Conclusion',
  },
  {
    id: 'math-work',
    name: 'Math / Science Work',
    category: 'academic',
    description: 'Problem sets and derivations with inline and block math.',
    sourceQdSeed:
      '.doctype {paged}\n.docname {Problem Set}\n.docauthor {Student Name}\n\n# Problem 1\n\nGiven: $$f(x) = x^2$$\n\n## Solution\n\n$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$',
  },
  {
    id: 'mermaid-flowchart',
    name: 'Mermaid Flowchart',
    category: 'diagram',
    description: 'Diagram or flowchart using Mermaid syntax.',
    sourceQdSeed:
      '# Flowchart\n\n.mermaid\n    flowchart TD\n        A[Start] --> B{Decision}\n        B -->|Yes| C[Action A]\n        B -->|No| D[Action B]\n        C --> E[End]\n        D --> E',
  },
  {
    id: 'data-table',
    name: 'Data Table',
    category: 'data',
    description: 'Structured data table.',
    sourceQdSeed:
      '# Data Table\n\n| Column A | Column B | Column C |\n|----------|----------|----------|\n| Value 1  | Value 2  | Value 3  |',
  },
]

import { useDocumentStore } from '@/features/document/store'
import { buildHeading, buildParagraph, buildCodeBlock, buildFunctionCallBlock } from '@/core/ir/builders'
import { scheduleCompile } from '@/features/preview/orchestrator'
import styles from './TopToolbar.module.css'

interface ToolbarGroup {
  label: string
  items: Array<{
    label: string
    title: string
    action: () => void
  }>
}

export function TopToolbar() {
  const { appendBlock, document } = useDocumentStore()

  function insert(block: ReturnType<typeof buildParagraph>) {
    appendBlock(block)
    scheduleCompile({ ...document, blocks: [...document.blocks, block] })
  }

  const groups: ToolbarGroup[] = [
    {
      label: 'Text',
      items: [
        { label: 'H1', title: 'Heading 1', action: () => insert(buildHeading(1)) },
        { label: 'H2', title: 'Heading 2', action: () => insert(buildHeading(2)) },
        { label: 'H3', title: 'Heading 3', action: () => insert(buildHeading(3)) },
        { label: '¶', title: 'Paragraph', action: () => insert(buildParagraph()) },
        { label: '<>', title: 'Code block', action: () => insert(buildCodeBlock('', '')) },
      ],
    },
    {
      label: 'Layout',
      items: [
        {
          label: '⊞',
          title: 'Container',
          action: () => insert(buildFunctionCallBlock('container', { body: '' })),
        },
        {
          label: '▤',
          title: 'Multi-column',
          action: () => insert(buildFunctionCallBlock('column', { body: '' })),
        },
        {
          label: '⋯',
          title: 'Page break',
          action: () => insert(buildFunctionCallBlock('pagebreak')),
        },
      ],
    },
    {
      label: 'Insert',
      items: [
        {
          label: '🖼',
          title: 'Figure',
          action: () => insert(buildFunctionCallBlock('figure', {
            positionalArgs: [{ kind: 'string', value: 'image.png' }],
            namedArgs: [{ name: 'caption', value: { kind: 'string', value: '' } }],
          })),
        },
        {
          label: '📊',
          title: 'Mermaid diagram',
          action: () => insert(buildCodeBlock('mermaid', 'graph TD\n    A --> B')),
        },
        {
          label: '∑',
          title: 'Math block',
          action: () => insert(buildCodeBlock('math', 'E = mc^2')),
        },
        {
          label: '≡',
          title: 'Table of contents',
          action: () => insert(buildFunctionCallBlock('tableofcontents')),
        },
      ],
    },
    {
      label: 'Variables',
      items: [
        {
          label: 'x=',
          title: 'Declare variable (let)',
          action: () => insert(buildFunctionCallBlock('let', {
            positionalArgs: [{ kind: 'string', value: 'myvar' }],
            body: 'value',
          })),
        },
        {
          label: '?',
          title: 'Conditional (if)',
          action: () => insert(buildFunctionCallBlock('if', {
            positionalArgs: [{ kind: 'string', value: 'true' }],
            body: 'Content when true.',
          })),
        },
      ],
    },
  ]

  return (
    <div className={styles.toolbar}>
      {groups.map((group) => (
        <div key={group.label} className={styles.group}>
          <span className={styles.groupLabel}>{group.label}</span>
          {group.items.map((item) => (
            <button
              key={item.title}
              className={styles.toolbarBtn}
              title={item.title}
              onClick={item.action}
            >
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

import type { QdBlockNode } from '../../core/ir/types'
import { ParagraphBlock } from './blocks/ParagraphBlock'
import { HeadingBlock } from './blocks/HeadingBlock'
import { CodeBlock } from './blocks/CodeBlock'
import { FunctionCallBlock } from './blocks/FunctionCallBlock'
import { OpaqueBlock } from './blocks/OpaqueBlock'
import { BlockWrapper } from './BlockWrapper'

interface Props {
  block: QdBlockNode
}

/**
 * Dispatches a block node to the correct specialized component.
 * All blocks are wrapped in `BlockWrapper` for consistent selection,
 * drag handles, and contextual actions.
 */
export function BlockRenderer({ block }: Props) {
  return (
    <BlockWrapper block={block}>
      {renderInner(block)}
    </BlockWrapper>
  )
}

function renderInner(block: QdBlockNode) {
  switch (block.kind) {
    case 'paragraph':
      return <ParagraphBlock block={block} />
    case 'heading':
      return <HeadingBlock block={block} />
    case 'code':
      return <CodeBlock block={block} />
    case 'functionCall':
      return <FunctionCallBlock block={block} />
    case 'opaque':
      return <OpaqueBlock block={block} />
    case 'thematicBreak':
      return <hr style={{ border: '1px solid var(--border-subtle)', margin: '4px 0' }} />
    case 'blank':
      return <div style={{ height: '1rem' }} />
  }
}

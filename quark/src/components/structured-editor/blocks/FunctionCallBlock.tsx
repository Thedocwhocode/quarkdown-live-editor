import type { QdBlockNode, QdFunctionCallNode, QdParamValue } from '../../../core/ir/types'
import { useDocumentStore } from '../../../features/structured-editor/store'
import { lookupById, lookupByName } from '../../../core/registry/index'
import { scheduleCompile } from '../../../features/structured-editor/orchestrator'
import styles from './blocks.module.css'

interface Props {
  block: QdBlockNode
}

export function FunctionCallBlock({ block }: Props) {
  const call = block.call
  if (!call) return null

  const entry = call.registryId
    ? lookupById(call.registryId)
    : lookupByName(call.functionName)

  return (
    <div className={styles.functionBlock}>
      <div className={styles.functionHeader}>
        <span className={styles.functionDot}>.</span>
        <span className={styles.functionName}>{call.functionName}</span>
        {entry && <span className={styles.functionDisplayName}>{entry.displayName}</span>}
      </div>
      <FunctionParamsForm block={block} call={call} />
      {call.body !== undefined && <BodyEditor block={block} call={call} />}
    </div>
  )
}

function FunctionParamsForm({ block, call }: { block: QdBlockNode; call: QdFunctionCallNode }) {
  const { updateBlock, document } = useDocumentStore()
  const entry = call.registryId ? lookupById(call.registryId) : lookupByName(call.functionName)
  if (!entry || entry.params.length === 0) return null

  function handleNamedArgChange(name: string, value: string) {
    const existingIdx = call.namedArgs.findIndex((n) => n.name === name)
    const newArgs = [...call.namedArgs]
    const paramValue: QdParamValue = { kind: 'string', value }

    if (existingIdx >= 0) {
      newArgs[existingIdx] = { name, value: paramValue }
    } else {
      newArgs.push({ name, value: paramValue })
    }

    updateBlock(block.id, { call: { ...call, namedArgs: newArgs } })
    scheduleCompile(document)
  }

  function handlePositionalArgChange(index: number, value: string) {
    const newArgs = [...call.positionalArgs]
    newArgs[index] = { kind: 'string', value }
    updateBlock(block.id, { call: { ...call, positionalArgs: newArgs } })
    scheduleCompile(document)
  }

  return (
    <div className={styles.paramsForm}>
      {entry.params
        .filter((p) => !p.likelyBody)
        .map((param, idx) => {
          const namedArg = call.namedArgs.find((n) => n.name === param.name)
          const posArg = call.positionalArgs[idx]
          const currentValue = namedArg
            ? String((namedArg.value as { value: unknown }).value)
            : posArg
            ? String((posArg as { value: unknown }).value)
            : String(param.defaultValue ?? '')

          return (
            <div key={param.name} className={styles.paramField}>
              <label>{param.displayName}</label>
              {param.type === 'enum' ? (
                <select
                  value={currentValue}
                  onChange={(e) =>
                    param.likelyNamed
                      ? handleNamedArgChange(param.name, e.target.value)
                      : handlePositionalArgChange(idx, e.target.value)
                  }
                >
                  {!param.required && <option value="">— default —</option>}
                  {param.enumValues?.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={param.type === 'number' ? 'number' : 'text'}
                  value={currentValue}
                  placeholder={String(param.defaultValue ?? '')}
                  onChange={(e) =>
                    param.likelyNamed
                      ? handleNamedArgChange(param.name, e.target.value)
                      : handlePositionalArgChange(idx, e.target.value)
                  }
                />
              )}
            </div>
          )
        })}
    </div>
  )
}

function BodyEditor({ block, call }: { block: QdBlockNode; call: QdFunctionCallNode }) {
  const { updateBlock, document } = useDocumentStore()

  return (
    <div className={styles.bodyEditor}>
      <label>Body</label>
      <textarea
        className={styles.bodyTextarea}
        value={call.body ?? ''}
        placeholder="Body content…"
        rows={3}
        onChange={(e) => {
          updateBlock(block.id, { call: { ...call, body: e.target.value } })
          scheduleCompile(document)
        }}
      />
    </div>
  )
}

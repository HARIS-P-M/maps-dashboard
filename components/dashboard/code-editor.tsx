'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

const LINE_HEIGHT = 19.5 // px per line at fontSize 13px / lineHeight 1.5
const MIN_LINES = 18     // minimum visible lines (~288px)

export function CodeEditor({
  initial,
  language = 'python',
  onChange,
}: {
  initial: string
  language?: string
  onChange?: (value: string) => void
}) {
  const [code, setCode] = useState(initial)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineCount = code.split('\n').length

  // Auto-grow: height = max(MIN_LINES, actual lines) * line-height
  const editorHeight = Math.max(MIN_LINES, lineCount) * LINE_HEIGHT

  // Sync when initial prop resets (new problem generated)
  useEffect(() => {
    setCode(initial)
    onChange?.(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value)
    onChange?.(e.target.value)
  }

  // Handle Tab key for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const el = e.currentTarget
      const start = el.selectionStart
      const end = el.selectionEnd
      const newCode = code.substring(0, start) + '    ' + code.substring(end)
      setCode(newCode)
      onChange?.(newCode)
      // Move cursor after the inserted spaces
      requestAnimationFrame(() => {
        el.selectionStart = start + 4
        el.selectionEnd = start + 4
      })
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-[#282c34] font-mono text-[13px] leading-[1.5]">
      {/* macOS-style titlebar */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="size-3 rounded-full bg-[#ff5f56]" />
        <span className="size-3 rounded-full bg-[#ffbd2e]" />
        <span className="size-3 rounded-full bg-[#27c93f]" />
        <span className="ml-2 text-xs text-white/50">solution.{language === 'python' ? 'py' : language}</span>
        <span className="ml-auto text-xs text-white/25">{lineCount} lines</span>
      </div>

      {/* Editor body — grows with content, no internal scroll */}
      <div
        className="relative"
        style={{ height: editorHeight }}
      >
        {/* Syntax highlight overlay (pointer-events disabled so it never blocks textarea) */}
        <div className="pointer-events-none absolute inset-0">
          <SyntaxHighlighter
            language={language}
            style={oneDark}
            customStyle={{
              margin: 0,
              padding: '1rem',
              paddingLeft: '3.25rem',
              background: 'transparent',
              fontSize: '13px',
              lineHeight: '1.5',
              height: '100%',
              overflow: 'hidden',
            }}
            codeTagProps={{ style: { fontFamily: 'var(--font-mono), monospace' } }}
          >
            {code || ' '}
          </SyntaxHighlighter>

          {/* Line numbers */}
          <div
            className="absolute left-0 top-0 select-none px-3 py-4 text-right text-white/25"
            style={{ lineHeight: '1.5', fontSize: '13px' }}
            aria-hidden
          >
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        </div>

        {/* The actual textarea — transparent text, full height, NO overflow (auto-grows instead) */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          aria-label="Code editor"
          className="absolute inset-0 w-full resize-none overflow-hidden whitespace-pre bg-transparent py-4 pl-[3.25rem] pr-4 text-transparent caret-white outline-none"
          style={{
            fontFamily: 'var(--font-mono), monospace',
            fontSize: '13px',
            lineHeight: '1.5',
            tabSize: 4,
          }}
        />
      </div>
    </div>
  )
}

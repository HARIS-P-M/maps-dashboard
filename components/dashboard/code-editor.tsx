'use client'

import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

export function CodeEditor({
  initial,
  language = 'python',
}: {
  initial: string
  language?: string
}) {
  const [code, setCode] = useState(initial)
  const lineCount = code.split('\n').length

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-[#282c34] font-mono text-[13px] leading-[1.5]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="size-3 rounded-full bg-[#ff5f56]" />
        <span className="size-3 rounded-full bg-[#ffbd2e]" />
        <span className="size-3 rounded-full bg-[#27c93f]" />
        <span className="ml-2 text-xs text-white/50">solution.{language === 'python' ? 'py' : language}</span>
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
              minHeight: '18rem',
            }}
            codeTagProps={{ style: { fontFamily: 'var(--font-mono), monospace' } }}
          >
            {code || ' '}
          </SyntaxHighlighter>
          <div className="absolute left-0 top-0 select-none px-3 py-4 text-right text-white/25" aria-hidden>
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          aria-label="Code editor"
          className="relative block h-72 w-full resize-none overflow-auto whitespace-pre bg-transparent py-4 pl-[3.25rem] pr-4 text-transparent caret-white outline-none"
          style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '13px', lineHeight: '1.5', tabSize: 4 }}
        />
      </div>
    </div>
  )
}

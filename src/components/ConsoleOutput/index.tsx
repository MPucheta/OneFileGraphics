import React from 'react'

type Props = {
  consoleOutput: string;
}

function ConsoleOutput ({ consoleOutput }: Props) {
  return (
    <div className="mt-[4px] bg-[#1e2225] text-[#6ed4fb] rounded-b-lg p-4 min-h-[80px] font-mono text-[0.95rem]">
      <div className="font-semibold text-[#58bcff] mb-2">
        Console Log Output:
      </div>
      <pre className="m-0 whitespace-pre-wrap max-h-[100px] overflow-y-auto">
        {consoleOutput}
      </pre>
    </div>
  )
}

export default ConsoleOutput

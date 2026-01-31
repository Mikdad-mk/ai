"use client"

interface AnswerDisplayProps {
  answers: Array<{ question: string; answer: string }>
}

export default function AnswerDisplay({ answers }: AnswerDisplayProps) {
  if (!answers || answers.length === 0) {
    return null
  }

  return (
    <div className="mt-4 border-t pt-4">
      <h3 className="text-lg font-semibold text-indigo-700 mb-3">Answer Key ({answers.length} answers)</h3>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {answers.map((item, idx) => (
          <div key={idx} className="bg-indigo-50 border-l-4 border-indigo-500 p-3 rounded">
            <h4 className="font-semibold text-indigo-900 text-sm mb-1">
              Q{idx + 1}: {item.question}
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

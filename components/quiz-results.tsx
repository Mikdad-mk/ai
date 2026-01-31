"use client"

import { useState } from "react"
import StatusMessage from "./status-message"

export default function QuizResults({ quizData }: { quizData: any[] }) {
  const [scores, setScores] = useState<Record<number, string>>({})
  const [statusMessage, setStatusMessage] = useState("")
  const [statusColor, setStatusColor] = useState("")

  const handleAnswer = (questionIndex: number, selectedOption: string, correctAnswer: string) => {
    if (scores[questionIndex]) return

    const isCorrect = selectedOption === correctAnswer
    setScores({ ...scores, [questionIndex]: isCorrect ? "correct" : "incorrect" })

    if (isCorrect) {
      setStatusMessage(`Correct! Well done on Question ${questionIndex + 1}.`)
      setStatusColor("bg-green-600")
    } else {
      setStatusMessage(`Incorrect. The correct answer is highlighted.`)
      setStatusColor("bg-red-600")
    }

    setTimeout(() => setStatusMessage(""), 4000)
  }

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-xl font-semibold text-indigo-700 mb-3">Generated Quiz ({quizData.length} Questions)</h3>
      {statusMessage && <StatusMessage message={statusMessage} bgColor={statusColor} />}

      {quizData.map((item, index) => (
        <div key={index} className="mb-6 p-4 border border-indigo-100 rounded-lg bg-gray-50 shadow-inner">
          <p className="font-semibold text-gray-800 mb-3">
            {index + 1}. {item.question}
          </p>
          <div className="space-y-2">
            {item.options.map((option: string, optIdx: number) => (
              <button
                key={optIdx}
                onClick={() => handleAnswer(index, option, item.correctAnswer)}
                disabled={!!scores[index]}
                className={`w-full text-left py-2 px-3 border rounded-md transition duration-150 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  !scores[index]
                    ? "border-gray-200 hover:bg-indigo-100"
                    : option === item.correctAnswer
                      ? "bg-green-100 border-green-500"
                      : scores[index] === "incorrect" && option === item.correctAnswer
                        ? "bg-green-200 border-green-600"
                        : option === Object.keys(scores)[index] && scores[index] === "incorrect"
                          ? "bg-red-100 border-red-500"
                          : "border-gray-200"
                } disabled:cursor-not-allowed`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

'use client'

interface FinalizeSectionProps {
  onFinalize: () => void
  isDisabled: boolean
}

export default function FinalizeSection({ onFinalize, isDisabled }: FinalizeSectionProps) {
  return (
    <section className="text-center">
      <div className="p-6 bg-purple-50 rounded-xl border border-purple-200">
        <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center justify-center">
          <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
            3
          </span>
          Finalize GRN
        </h3>
        <p className="text-gray-600 mb-6">
          Review all items and details before finalizing the GRN.
        </p>
        <button
          onClick={onFinalize}
          disabled={isDisabled}
          className="bg-purple-700 hover:bg-purple-800 disabled:bg-gray-400 text-white px-12 py-3 rounded-lg text-lg font-semibold transition transform hover:scale-105 disabled:transform-none"
        >
          Finalize GRN
        </button>
      </div>
    </section>
  )
} 
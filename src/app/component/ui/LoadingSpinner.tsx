import React from 'react'

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="w-12 h-12 border-t-2 border-b-2 border-indigo-600 rounded-full animate-spin dark:border-indigo-400"></div>
    </div>
  )
}

export default LoadingSpinner

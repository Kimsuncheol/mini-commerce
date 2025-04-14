import Link from 'next/link'
import React from 'react'
import { FiArrowLeft } from 'react-icons/fi'

function BackButton({destination}: {destination: string}) {
    return (
        <Link href={destination} className="">
            <FiArrowLeft className="w-6 h-6 text-gray-500 dark:text-gray-400" />
        </Link>
    )
}

export default BackButton
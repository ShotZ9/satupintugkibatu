'use client'

type Props = {
  size?: number
  className?: string
}

export default function Spinner({ size = 16, className = '' }: Props) {
  return (
    <span
      style={{ width: size, height: size }}
      className={`inline-block border-2 border-current border-t-transparent rounded-full animate-spin ${className}`}
    />
  )
}
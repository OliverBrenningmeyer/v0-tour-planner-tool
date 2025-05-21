import type { LightbulbIcon as LucideProps } from "lucide-react"

export function Crane(props: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2v10" />
      <path d="M6 6l6-4 6 4" />
      <path d="M4 10v12" />
      <path d="M20 10v12" />
      <path d="M4 14h16" />
      <path d="M4 10h16" />
      <path d="M14 22v-4a2 2 0 0 0-4 0v4" />
    </svg>
  )
}

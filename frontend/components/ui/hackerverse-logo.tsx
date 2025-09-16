export default function HackerverseLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Metaverse cube/3D structure */}
        <g className="opacity-90">
          {/* Back face */}
          <path d="M8 12L16 8L24 12L20 14L12 18L8 16V12Z" fill="currentColor" className="opacity-30" />
          {/* Left face */}
          <path d="M8 12V20L12 22V18L8 16V12Z" fill="currentColor" className="opacity-50" />
          {/* Right face */}
          <path d="M20 14V22L24 20V12L20 14Z" fill="currentColor" className="opacity-70" />
          {/* Top face */}
          <path d="M12 18L20 14L24 12L16 8L8 12L12 14V18Z" fill="currentColor" />
        </g>

        {/* Hacker elements - code brackets and terminal cursor */}
        <g className="opacity-80">
          {/* Left bracket */}
          <path
            d="M4 10L2 12V20L4 22M4 14H6M4 18H6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Right bracket */}
          <path
            d="M28 10L30 12V20L28 22M28 14H26M28 18H26"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Terminal cursor/prompt */}
          <circle cx="16" cy="24" r="1.5" fill="currentColor" className="animate-pulse" />
        </g>

        {/* Connection lines representing network/metaverse */}
        <g className="opacity-40">
          <line x1="8" y1="12" x2="4" y2="14" stroke="currentColor" strokeWidth="0.5" />
          <line x1="24" y1="12" x2="28" y2="14" stroke="currentColor" strokeWidth="0.5" />
          <line x1="16" y1="8" x2="16" y2="4" stroke="currentColor" strokeWidth="0.5" />
        </g>
      </svg>
    </div>
  )
}

export { HackerverseLogo }

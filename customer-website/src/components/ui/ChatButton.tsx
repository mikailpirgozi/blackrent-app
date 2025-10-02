'use client'

export default function ChatButton() {
  const handleChatClick = () => {
    alert('Chat funkcionalita bude dostupná čoskoro!')
  }

  return (
    <button 
      onClick={handleChatClick}
      className="fixed bottom-8 right-8 z-[1000] w-[58px] h-[60px] bg-gradient-to-br from-blackrent-yellow-light to-blackrent-green rounded-2xl border-none cursor-pointer shadow-[0_0_40px_rgba(215,255,20,0.2)] hover:transform hover:-translate-y-0.5 hover:shadow-[0_8px_40px_rgba(215,255,20,0.3)] transition-all duration-300"
    >
      <svg 
        className="w-8 h-8 mx-auto" 
        viewBox="0 0 32 32" 
        fill="none"
      >
        <path 
          d="M26 28h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L25.4 20c-.3-.8-1-1.3-1.9-1.3H14.5c-.9 0-1.6.5-1.9 1.3l-2.1 2.1C10.2 22.3 9.5 23.1 9.5 24v3c0 .6.4 1 1 1H12" 
          fill="currentColor"
        />
        <ellipse cx="14" cy="24" rx="6" ry="6" fill="rgba(255,255,255,0.5)"/>
        <ellipse cx="24" cy="24" rx="6" ry="6" fill="rgba(255,255,255,0.5)"/>
        <ellipse cx="34" cy="24" rx="6" ry="6" fill="rgba(255,255,255,0.5)"/>
      </svg>
    </button>
  )
}

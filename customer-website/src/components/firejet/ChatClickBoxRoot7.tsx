'use client'

import ChatClickBox from './assets/ChatClickBox'

export default function ChatClickBoxRoot7({
  className = "",
}: ChatClickBoxRoot7Props) {
  return (
    <div className={`flex items-center gap-2 p-8 w-fit h-fit ${className}`}>
      <ChatClickBox className="w-[58px] h-[60px]" />
    </div>
  )
}

interface ChatClickBoxRoot7Props {
  className?: string;
}

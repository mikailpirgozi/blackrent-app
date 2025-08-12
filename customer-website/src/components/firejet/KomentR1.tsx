export default function KomentR1({
  className = "",
  container1 = "",
  container2 = "",
  attr1 = "https://www.visitestonia.com/en",
  text = "https://www.visitestonia.com/en",
  container3 = "",
  text1 = "Posuvník Referencie",
}: KomentR1Props) {
  return (
    <div
      className={`flex flex-col justify-center gap-4 rounded-lg border-2 border-solid border-x-[greenyellow] border-y-[greenyellow] bg-[lightyellow] p-3.5 ${container1} ${className}`}
    >
      <div className={`flex h-[9px] items-center underline ${container2}`}>
        <a href={attr1}>{text}</a>
      </div>
      <div className={`flex h-[9px] w-64 items-center ${container3}`}>
        {text1}
      </div>
    </div>
  );
}

interface KomentR1Props {
  className?: string;
  container1: string;
  container2: string;
  attr1: string;
  text: string;
  container3: string;
  text1: string;
}

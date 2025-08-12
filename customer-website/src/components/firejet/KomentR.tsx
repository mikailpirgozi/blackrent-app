export default function KomentR({
  className = "",
  container1 = "",
  text = "Poznámka z 2. 8. 2024",
}: KomentRProps) {
  return (
    <div
      className={`flex flex-col items-center rounded-lg border-2 border-solid border-red-500 bg-red-500 p-3.5 ${className}`}
    >
      <div
        className={`flex h-10 w-64 items-center font-bold text-[ghostwhite] ${container1}`}
      >
        <span>
          <p>{text}</p>
          <div className="h-3.5" />
          <p>23. 8. 2024 – Nieje opravené</p>
        </span>
      </div>
    </div>
  );
}

interface KomentRProps {
  className?: string;
  container1: string;
  text: string;
}

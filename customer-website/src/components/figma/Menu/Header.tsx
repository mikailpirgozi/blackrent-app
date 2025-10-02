import { Menu } from '@/components/figma/Menu';

interface HeaderProps {
  /** Callback function to handle burger menu state changes */
  onBurgerMenuToggle?: (isOpen: boolean) => void;
}

export default function Header({ onBurgerMenuToggle }: HeaderProps) {
  return (
    <header className="w-full h-[64px] bg-[#05050a]">
      <Menu onBurgerMenuToggle={onBurgerMenuToggle} />
    </header>
  );
}
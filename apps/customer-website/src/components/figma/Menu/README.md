# Menu Component

A React component converted from Figma design for the BlackRent navigation menu.

## Features

- BlackRent logo on the left
- **Navigation menu items with routing**: Ponuka vozidiel, Služby, Store, O nás, Kontakt
- **Interactive navigation links** with hover effects and smooth transitions
- Language selector (SK) with icon
- Login button with user icon
- Fully responsive design matching Figma specifications
- Uses Next.js Image optimization
- Local assets (no external URLs)

## Usage

```tsx
import { Menu } from '@/components/figma/Menu';

export default function Header() {
  return (
    <header className="w-full h-[64px] bg-[#05050a]">
      <Menu />
    </header>
  );
}
```

## Navigation Routes

The menu items link to the following routes:

- **Ponuka vozidiel** → `/vozidla`
- **Služby** → `/sluzby`
- **Store** → `/store`
- **O nás** → `/o-nas`
- **Kontakt** → `/kontakt`

## Design Colors

- Background: Dark theme (#05050a)
- Text: Light gray (#d4d4e0)
- Hover text: Light yellow accent (#d7ff14)
- Hover background: Dark gray (#1a1a1a)
- Login button background: Dark yellow (#283002)
- Login button text: Light yellow accent (#d7ff14)

## Assets Used

- Logo: `/assets/brands/blackrent-logo.svg`
- Language icon: Inline SVG (clock/globe icon)
- User icon: Inline SVG (user profile icon)

## Figma Node ID

Original Figma node: `18225:11536`

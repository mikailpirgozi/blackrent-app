# ButtonSecondary Component

A reusable secondary button component converted from Figma design with customizable icon and text.

## Features

- Dark green background (#283002) with yellow text (#d7ff14)
- Customizable SVG icon on the left
- Customizable text content
- Hover effect with darker background
- Rounded pill shape (99px border radius)
- Fixed height of 40px
- Proper spacing and typography matching Figma design

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `iconPath` | `string` | ✅ | Path to SVG icon (e.g., '/assets/icons/user.svg') |
| `iconAlt` | `string` | ❌ | Alt text for the icon (default: '') |
| `text` | `string` | ✅ | Text to display in the button |
| `onClick` | `() => void` | ❌ | Optional click handler |
| `className` | `string` | ❌ | Optional additional CSS classes |

## Usage

### Basic Usage

```tsx
import { ButtonSecondary } from '@/components/figma/ButtonSecondary';

export default function LoginButton() {
  return (
    <ButtonSecondary 
      iconPath="/assets/icons/user-icon.svg"
      iconAlt="User icon"
      text="Prihlásiť sa"
      onClick={() => console.log('Login clicked')}
    />
  );
}
```

### With Different Icons

```tsx
// Settings button
<ButtonSecondary 
  iconPath="/assets/icons/settings-icon.svg"
  iconAlt="Settings"
  text="Nastavenia"
  onClick={() => openSettings()}
/>

// Download button
<ButtonSecondary 
  iconPath="/assets/icons/download-icon.svg"
  iconAlt="Download"
  text="Stiahnuť"
  onClick={() => downloadFile()}
/>

// Profile button
<ButtonSecondary 
  iconPath="/assets/icons/profile-icon.svg"
  iconAlt="Profile"
  text="Profil"
  onClick={() => goToProfile()}
/>
```

## Design Colors

- Background: Dark yellow accent (#283002)
- Hover background: Darker green (#3a4203)
- Text: Light yellow accent (#d7ff14)
- Icon: Light yellow accent (#d7ff14)

## Styling Notes

- Uses Poppins Medium font
- 14px font size with 24px line height
- 6px gap between icon and text
- 20px left padding, 24px right padding
- 12px vertical padding
- Icon container is 24x24px with proper inset positioning

## Figma Node ID

Original Figma node: `18225:11575`

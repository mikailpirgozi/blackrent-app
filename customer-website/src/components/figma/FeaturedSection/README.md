# FeaturedSection Component

A hero section component converted from Figma design featuring car images, main title, description, and action buttons.

## Features

- **Hero layout** with car images on both sides (desktop only)
- **Main title** with custom typography and responsive sizing
- **Description text** with proper line breaks
- **Two action buttons** with hover effects and navigation
- **Fully responsive** design for all screen sizes
- **Next.js Image optimization** for all car images
- **Exact Figma styling** preserved with Tailwind classes

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | ❌ | Main hero title (default: "Autá pre každodennú potrebu, aj nezabudnuteľný zážitok") |
| `description` | `string` | ❌ | Description text with line breaks (default: Slovak description) |
| `className` | `string` | ❌ | Optional additional CSS classes |

## Usage

### Basic Usage

```tsx
import { FeaturedSection } from '@/components/figma/FeaturedSection';

export default function HomePage() {
  return (
    <section className="py-16">
      <FeaturedSection />
    </section>
  );
}
```

### Custom Content

```tsx
<FeaturedSection 
  title="Your Custom Title"
  description="Your custom description with\nline breaks"
  className="my-custom-class"
/>
```

## Design Specifications

### Colors
- **Title**: Light yellow accent (#f0ff98)
- **Description**: Light gray (#c8c8cd)
- **Primary Button**: Light yellow background (#f0ff98) with dark text (#141900)
- **Secondary Button**: Dark gray background (#28282d) with light text (#f0f0f5)

### Typography
- **Title**: SF Pro Expanded Medium, 56px (desktop) / 32px (mobile)
- **Description**: Poppins Regular, 16px (desktop) / 14px (mobile)
- **Buttons**: Poppins SemiBold/Medium, 14px

### Layout
- **Desktop**: Three-column layout with car images on sides
- **Mobile**: Single column with centered content
- **Car images**: Hidden on mobile, visible on desktop (lg+)

## Responsive Behavior

- **Mobile (< 1024px)**: Single column layout, car images hidden
- **Tablet (768px - 1024px)**: Larger text, stacked buttons
- **Desktop (1024px+)**: Full three-column layout with car images

## Navigation

- **Primary Button**: Links to `/vozidla` (Vehicle Offer)
- **Secondary Button**: Links to `/sluzby` (Services)

## Assets Required

The component expects car images in `/assets/images/`:
- `car-1.jpg` through `car-10.jpg`
- `arrow-right.svg` for the primary button icon

## Figma Node ID

Original Figma node: `18218:9991`

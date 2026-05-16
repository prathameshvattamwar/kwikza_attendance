# AttendMS — Brand Guidelines & Design System

## Brand Identity

**Product Name:** AttendMS  
**Tagline:** Smart Attendance. Effortless HR.  
**Brand Personality:** Professional, modern, trustworthy, clean

---

## Color System

### Primary — Indigo (Trust + Modern Tech)
| Token | Hex | Usage |
|-------|-----|-------|
| primary-50 | `#EEF2FF` | Light backgrounds, hover states |
| primary-100 | `#E0E7FF` | Selected row backgrounds |
| primary-200 | `#C7D2FE` | Borders on primary elements |
| primary-300 | `#A5B4FC` | Disabled primary buttons |
| primary-400 | `#818CF8` | Focus rings |
| primary-500 | `#6366F1` | **Main brand color — nav active, primary buttons, links** |
| primary-600 | `#4F46E5` | Hover state for primary buttons |
| primary-700 | `#4338CA` | Pressed/active state |
| primary-800 | `#3730A3` | Dark accents |
| primary-900 | `#312E81` | Very dark accents |

### Semantic Colors
| Role | Color | Hex | Background | Usage |
|------|-------|-----|------------|-------|
| Success / Present | Emerald | `#10B981` | `#ECFDF5` | Present status, success toasts, approve actions |
| Warning / Late | Amber | `#F59E0B` | `#FFFBEB` | Late status, pending states, warnings |
| Danger / Absent | Red | `#EF4444` | `#FEF2F2` | Absent, rejected, errors, delete actions |
| Info / On Leave | Blue | `#3B82F6` | `#EFF6FF` | On leave status, info banners |
| Special / Holiday | Violet | `#8B5CF6` | `#F5F3FF` | Holidays, purple accents |
| Orange / Half Day | Orange | `#F97316` | `#FFF7ED` | Half day status |

### Neutral Scale (Slate-based)
| Token | Hex | Usage |
|-------|-----|-------|
| slate-50 | `#F8FAFC` | Page background |
| slate-100 | `#F1F5F9` | Sidebar background, table header |
| slate-200 | `#E2E8F0` | Card borders, dividers |
| slate-300 | `#CBD5E1` | Input borders |
| slate-400 | `#94A3B8` | Placeholder text, icons |
| slate-500 | `#64748B` | Secondary/caption text |
| slate-600 | `#475569` | Body text |
| slate-700 | `#334155` | Slightly dark text |
| slate-800 | `#1E293B` | Primary text |
| slate-900 | `#0F172A` | Headlines, titles |

### Dark Mode Palette
| Element | Hex |
|---------|-----|
| Page background | `#0F172A` |
| Card background | `#1E293B` |
| Card border | `#334155` |
| Sidebar background | `#1E293B` |
| Sidebar border | `#334155` |
| Primary text | `#F1F5F9` |
| Secondary text | `#94A3B8` |
| Input background | `#334155` |
| Input border | `#475569` |

---

## Typography

**Font Family:** Inter (primary), system-ui (fallback)

```css
font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
```

### Type Scale
| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Display | 36px | 700 | 1.1 | Hero headers, empty state numbers |
| H1 | 28px | 700 | 1.2 | Page titles |
| H2 | 22px | 600 | 1.3 | Section headers |
| H3 | 18px | 600 | 1.4 | Card titles |
| H4 | 16px | 600 | 1.4 | Sub-section headers |
| Body Large | 16px | 400 | 1.5 | Primary body text |
| Body | 14px | 400 | 1.5 | Default text |
| Body Small | 13px | 400 | 1.5 | Secondary info |
| Caption | 12px | 400 | 1.4 | Labels, meta info |
| Overline | 11px | 600 | 1.2 | Section labels (UPPERCASE) |
| Stat Number | 32–40px | 700 | 1.0 | Dashboard KPI numbers |

---

## Spacing System (Tailwind-native)
- 4px base unit (Tailwind p-1)
- Card padding: 20–24px (p-5 to p-6)
- Section gaps: 24px (gap-6)
- Form field gaps: 16px (gap-4)
- Inline gaps: 8–12px (gap-2 to gap-3)

---

## Border Radius
| Component | Radius |
|-----------|--------|
| Cards, modals | 12px (rounded-xl) |
| Buttons (default) | 8px (rounded-lg) |
| Buttons (small) | 6px (rounded-md) |
| Badges, chips | 9999px (rounded-full) |
| Inputs | 8px (rounded-lg) |
| Avatar | 9999px (rounded-full) |
| Avatars (square) | 8px (rounded-lg) |

---

## Shadow Scale
```css
/* Card */
box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);

/* Card hover */
box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);

/* Modal/Dropdown */
box-shadow: 0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08);

/* Floating button */
box-shadow: 0 4px 16px rgba(99,102,241,0.3);
```

---

## Component Specifications

### Sidebar Navigation
- Width: 260px (desktop), 0 (mobile collapsed)
- Background: white / dark `#1E293B`
- Active item: `bg-primary-50 text-primary-600` / dark: `bg-primary-900/20 text-primary-400`
- Icon size: 20px
- Item height: 44px
- Section group headers: 10px, UPPERCASE, `text-slate-400`, font-weight 600
- Bottom section: avatar + name + role + logout icon

### Top Navigation Bar
- Height: 64px
- Fixed, z-index 30
- Separator line: 1px `border-b border-slate-200`
- Right side: dark mode toggle + notification bell + avatar menu

### Cards / Panels
- Background: white
- Border: 1px `border-slate-200`
- Border radius: 12px
- Shadow: card shadow (above)
- Hover: shadow increases (transition 200ms)

### Buttons
| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| Primary | `#6366F1` | white | none | `#4F46E5` |
| Secondary | white | `#1E293B` | `#E2E8F0` | `#F8FAFC` |
| Danger | `#EF4444` | white | none | `#DC2626` |
| Ghost | transparent | `#64748B` | none | `#F8FAFC` |
| Success | `#10B981` | white | none | `#059669` |

Button height: 36px (sm), 40px (default), 44px (lg)
Button padding: px-4 py-2 (default)

### Input Fields
- Border: 1px `#CBD5E1`
- Focus border: `#6366F1`
- Focus ring: `ring-2 ring-primary-500/20`
- Background: white
- Height: 40px (default)
- Border radius: 8px

### Status Badges
| Status | Background | Text |
|--------|-----------|------|
| present | `#ECFDF5` | `#065F46` |
| absent | `#FEF2F2` | `#991B1B` |
| late | `#FFFBEB` | `#92400E` |
| half_day | `#FFF7ED` | `#9A3412` |
| on_leave | `#EFF6FF` | `#1E40AF` |
| holiday | `#F5F3FF` | `#5B21B6` |
| weekend | `#F8FAFC` | `#475569` |
| pending | `#FFFBEB` | `#92400E` |
| approved | `#ECFDF5` | `#065F46` |
| rejected | `#FEF2F2` | `#991B1B` |
| cancelled | `#F8FAFC` | `#475569` |
| active | `#ECFDF5` | `#065F46` |
| inactive | `#FEF2F2` | `#991B1B` |

Badge padding: `px-2.5 py-0.5`
Badge font size: 12px, font-weight 500
Badge border radius: 9999px

### Data Tables
- Header: `bg-slate-50` or `bg-slate-50/50`, font-size 12px, uppercase, `text-slate-500`
- Row height: 52px (comfortable)
- Cell padding: `px-5 py-3.5`
- Row hover: `hover:bg-slate-50/50`
- Divider: `divide-y divide-slate-100`
- Sticky header on scroll

### KPI / Stat Cards
- Icon container: 40x40px, border-radius 10px, colored background
- Metric number: 28–32px, font-weight 700, `text-slate-900`
- Label: 13px, `text-slate-500`
- Trend: 12px with colored arrow

### Form Layout
- Label above input (not inline)
- Error messages: 12px `text-red-500` below input
- Required marker: `*` in red
- Help text: 12px `text-slate-400` below input

---

## Iconography
**Library:** Lucide React (already installed)
**Icon sizes:** 16px (sm), 20px (default), 24px (lg)
**Stroke width:** 1.5 (default Lucide)

### Key Icons Per Feature
- Dashboard: `LayoutDashboard`
- Employees: `Users`
- Attendance: `Clock`
- Check In: `LogIn`
- Check Out: `LogOut`
- Leave: `CalendarOff`
- Approve: `CheckCircle2`
- Reject: `XCircle`
- Holiday: `PartyPopper`
- Reports: `BarChart3`
- Settings: `Settings`
- Audit Log: `Shield`
- Profile: `UserCircle`
- Location: `MapPin`
- Geofence: `Navigation`
- Notifications: `Bell`
- Search: `Search`

---

## Animation & Motion
- Default transition: `transition-all duration-200 ease-out`
- Hover transforms: none (no scale effects — too playful for enterprise)
- Modal entrance: fade + slide up 8px, 200ms
- Sidebar slide: 300ms cubic-bezier
- Toast: slide in from right, 300ms
- Skeleton shimmer: `animate-pulse` 1.5s

---

## Grid System
- Page max width: 1280px (`max-w-7xl`)
- Responsive breakpoints: sm 640px, md 768px, lg 1024px, xl 1280px
- Dashboard KPIs: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- Two-column layout: `grid-cols-1 lg:grid-cols-2`
- Three-column layout: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`

---

## Email Template Style
- Max width: 600px
- Background: `#F8FAFC`
- Card background: white
- Header: indigo gradient `#6366F1 → #4F46E5`
- Logo in header: white on indigo
- Body font: `Arial, Helvetica, sans-serif` (email-safe)
- Body text: `#1E293B`
- CTA button: `#6366F1` background, white text, 8px border radius
- Footer: `#94A3B8` text, 12px

---

## Tailwind Config (Full)
```js
// client/tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        success: { DEFAULT: '#10B981', light: '#ECFDF5', dark: '#065F46' },
        warning: { DEFAULT: '#F59E0B', light: '#FFFBEB', dark: '#92400E' },
        danger:  { DEFAULT: '#EF4444', light: '#FEF2F2', dark: '#991B1B' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        modal: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)',
        'primary-glow': '0 4px 16px rgba(99,102,241,0.30)',
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
};
```

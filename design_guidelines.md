# Design Guidelines: AgriVision AI - Crop Disease Detection Platform

## Design Approach

**Hybrid System-Reference Approach**: Combining Material Design's robust component system with Linear's clean typography and Notion's information density. This agricultural productivity tool requires both systematic reliability and visual appeal to engage farmers in the field.

**Core Principles**:
- Mobile-first design (primary use case: field captures via smartphone)
- Information hierarchy that prioritizes actionable insights
- Trust-building through clarity and professional presentation
- Accessibility for multilingual users with varying tech literacy

---

## Typography System

**Font Families** (Google Fonts):
- Primary: Inter (400, 500, 600, 700) - UI elements, body text, data
- Accent: Poppins (600, 700) - Headlines, section titles, emphasis

**Scale**:
- Hero Headlines: text-4xl md:text-5xl font-bold
- Section Headers: text-2xl md:text-3xl font-semibold
- Card Titles: text-lg font-semibold
- Body Text: text-base font-normal
- Captions/Meta: text-sm font-medium
- Micro Labels: text-xs font-medium

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16 for consistent rhythm
- Component padding: p-4 to p-6
- Section spacing: py-12 md:py-16
- Grid gaps: gap-4 to gap-6
- Card spacing: p-6

**Container Strategy**:
- Full-width sections: w-full with inner max-w-7xl mx-auto px-4
- Content cards: max-w-6xl
- Forms/inputs: max-w-2xl

**Grid Patterns**:
- Disease gallery: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Weather/soil metrics: grid-cols-2 md:grid-cols-4
- Feature cards: grid-cols-1 md:grid-cols-2

---

## Component Library

### Navigation
- Sticky header with logo, language selector, user profile
- Bottom navigation for mobile: Home, Camera, History, Chatbot, Profile
- Breadcrumbs for deep navigation contexts

### Disease Detection Interface
- Large drag-drop upload zone with camera capture button
- Live preview with bbox overlay visualization
- Results card: Disease name, confidence percentage, severity badge, expandable treatment details
- Image comparison slider (healthy vs diseased)

### Dashboard Cards
- Glassmorphism effect cards (backdrop-blur-md, bg-white/90)
- Metric cards with large numbers, trend indicators (↑↓), icons
- Chart containers with headers and legend
- Map container with full-bleed treatment, overlays for disease markers

### Forms & Inputs
- Rounded input fields (rounded-lg) with floating labels
- Icon-prefixed inputs for context
- Select dropdowns with flag icons for language selection
- File upload with progress indicators

### Chatbot Interface
- Fixed bottom-right bubble trigger (mobile: bottom nav integrated)
- Slide-up panel (mobile) or side panel (desktop)
- Message bubbles: User (gradient blue), AI (white with border)
- Typing indicators, timestamp labels
- Quick action chips for common queries

### Data Visualization
- Weather cards: Large temperature display, icon representations, 5-day forecast strip
- Soil composition: Donut/bar charts with color-coded segments
- Disease trend line graphs with area fills
- Interactive map with cluster markers, zoom controls

### Status Indicators
- Disease severity: Badge system (Low/Medium/High) with color coding
- Confidence scores: Progress bars with percentage labels
- Loading states: Skeleton screens for cards, shimmer effects
- Toast notifications: Slide-in from top with icons

---

## Images

**Hero Section**: Full-width banner image showing lush green farmland with crops in foreground, farmer using smartphone/tablet in midground, bright natural lighting. Height: 60vh on desktop, 50vh on mobile. Overlay: Dark gradient (top to bottom) for text readability. Hero text: White with backdrop blur on buttons.

**Detection Results**: Uploaded crop/leaf images with bbox overlays, disease highlighting zones in semi-transparent red/orange.

**Dashboard Background**: Subtle agricultural pattern or texture, very light opacity (5-10%) behind cards.

**Empty States**: Illustrations of farmers with smartphones, crops, weather icons for sections with no data.

**Weather Icons**: Animated weather condition representations (sun, clouds, rain).

---

## Mobile Optimization

- Camera capture: Full-screen modal with orientation lock, grid overlay for framing
- Swipeable cards for history/gallery browsing
- Collapsible sections for soil/weather data
- Touch-friendly tap targets (min 44px)
- Bottom sheet patterns for filters, settings

---

## Animations (Minimal, Purposeful)

- Fade-in on scroll for section reveals (once per view)
- Smooth transitions for card hovers (transform: scale(1.02))
- Progress bar animations for confidence scores
- Map marker pop animations on load
- Chatbot message slide-in
- Loading spinners for API calls

---

## Key Screens

1. **Landing/Hero**: Full-width crop image hero, value proposition, camera upload CTA, trust indicators (detection count, languages supported)
2. **Detection Interface**: Upload zone, live camera feed option, instant results with bbox visualization, treatment recommendations, save/share actions
3. **Dashboard**: Grid of metric cards (detections, success rate, active alerts), weather widget, soil data summary, recent detections gallery, map with hotspots
4. **History**: Filterable timeline of past detections with thumbnails, dates, locations, disease types
5. **Chatbot**: Persistent chat interface with context-aware agriculture advice, quick replies, voice input option
6. **Multi-language**: Language selector prominently placed, translated UI elements, regional content adaptation

---

## Accessibility & Localization

- High contrast text (gray-900 on white, white on dark backgrounds)
- Icon + text labels for all actions
- Responsive font scaling
- RTL support preparedness
- Voice input/output for speech recognition features
- Clear error messaging in multiple languages
# Alert System - Visual Design Guide

## Color Palette & Theming

### Success State (Green Theme)

```
Primary Color:     #10B981 (Emerald 500)
Background:        #D1FAE5 (Emerald 100)
Icon:              check-circle (filled)
Button Text:       "Okay"
Use Cases:         Account created, Login success, Profile updated, Payment complete
```

**Visual Structure:**

```
┌─────────────────────────────────────┐
│                                   ✕ │
│                                     │
│        ╔══════════════╗              │
│        ║              ║              │
│        ║      ✓       ║  ← Green     │
│        ║              ║    circle    │
│        ╚══════════════╝              │
│                                     │
│         Success!                    │
│                                     │
│   Your account has been created     │
│                                     │
│   ┌───────────────────────────┐    │
│   │         Okay              │    │
│   └───────────────────────────┘    │
│        (Green button)               │
└─────────────────────────────────────┘
```

### Error State (Red Theme)

```
Primary Color:     #EF4444 (Red 500)
Background:        #FEE2E2 (Red 100)
Icon:              cancel (X symbol)
Button Text:       "Try Again"
Use Cases:         Login failed, Invalid input, Not found, Permission denied
```

**Visual Structure:**

```
┌─────────────────────────────────────┐
│                                   ✕ │
│                                     │
│        ╔══════════════╗              │
│        ║              ║              │
│        ║      ✗       ║  ← Red       │
│        ║              ║    circle    │
│        ╚══════════════╝              │
│                                     │
│         Error                       │
│                                     │
│   Unable to process your request    │
│                                     │
│   ┌───────────────────────────┐    │
│   │       Try Again           │    │
│   └───────────────────────────┘    │
│        (Red button)                 │
└─────────────────────────────────────┘
```

### Warning State (Orange Theme)

```
Primary Color:     #F59E0B (Amber 500)
Background:        #FEF3C7 (Amber 100)
Icon:              warning (triangle)
Button Text:       "Okay"
Use Cases:         Caution messages, Important notices, Non-critical warnings
```

**Visual Structure:**

```
┌─────────────────────────────────────┐
│                                   ✕ │
│                                     │
│        ╔══════════════╗              │
│        ║              ║              │
│        ║      ⚠       ║  ← Orange    │
│        ║              ║    circle    │
│        ╚══════════════╝              │
│                                     │
│         Warning                     │
│                                     │
│   This action cannot be undone      │
│                                     │
│   ┌───────────────────────────┐    │
│   │         Okay              │    │
│   └───────────────────────────┘    │
│        (Orange button)              │
└─────────────────────────────────────┘
```

## Design Specifications

### Layout Dimensions

- **Modal Width**: 90% of screen width, max 400px
- **Modal Padding**: 32px all sides
- **Icon Container**: 96x96px circle
- **Icon Size**: 64x64px
- **Border Radius**: 20px (card), 12px (button), 48px (icon circle)

### Typography Scale

```
Heading:
  Size: 24px
  Weight: 700 (Bold)
  Color: #111827 (Gray 900)
  Letter Spacing: -0.5px
  Alignment: Center

Message:
  Size: 15px
  Weight: 400 (Regular)
  Color: #6B7280 (Gray 500)
  Line Height: 22px
  Alignment: Center

Button Text:
  Size: 17px
  Weight: 600 (Semibold)
  Letter Spacing: 0.3px
  Color: #FFFFFF (White)
```

### Spacing System

```
Top to Icon:           56px (padding + margin)
Icon to Heading:       20px
Heading to Message:    12px
Message to Button:     28px
Button Height:         48px (16px × 2 padding)
```

### Shadow & Elevation

```
Card Shadow:
  - Color: #000000
  - Offset: 0px, 10px
  - Opacity: 0.15
  - Radius: 20px
  - Elevation (Android): 10

Button Shadow:
  - Color: #000000
  - Offset: 0px, 2px
  - Opacity: 0.1
  - Radius: 4px
  - Elevation (Android): 2

Overlay Background:
  - rgba(0, 0, 0, 0.5) - 50% black
```

### Interactive States

```
Close Button:
  - Default: Gray circle (#F3F4F6)
  - Size: 24px icon, 40px touch target
  - Position: Top-right, 16px inset

Primary Button:
  - Active Opacity: 0.8
  - Ripple: Platform native
  - Press State: Slight scale (0.98)
```

## Accessibility

### Semantic Structure

- Modal uses `accessible={true}` and `accessibilityRole="alert"`
- Heading uses `accessibilityRole="header"`
- Button uses `accessibilityRole="button"` with `accessibilityLabel`

### Screen Reader

```typescript
Success: "Success alert: [heading]. [message]. Okay button.";
Error: "Error alert: [heading]. [message]. Try Again button.";
Warning: "Warning alert: [heading]. [message]. Okay button.";
```

### Touch Targets

All interactive elements meet minimum 44×44pt touch target:

- Close button: 40×40pt (expandable)
- Primary button: Full width × 48pt

## Animation & Timing

### Entry Animation

```
Type: Fade
Duration: 300ms
Easing: ease-out
```

### Exit Animation

```
Type: Fade
Duration: 200ms
Easing: ease-in
```

### Auto-Dismiss Timing

```
Default: 4000ms (4 seconds)
Quick: 1500ms (1.5 seconds) - for copy/paste confirmations
Persistent: null - requires manual dismissal
```

## Responsive Behavior

### Mobile (< 400px width)

- Modal width: 90% of screen
- Padding: 32px maintained
- Font sizes: As specified (already optimized)

### Tablet/Desktop (> 400px width)

- Modal width: Fixed 400px
- Centered in viewport
- All other specs maintained

### Safe Areas

- Modal respects safe area insets
- Minimum 20px padding from screen edges

## Developer Examples

### Sign In Error

```typescript
showAlert("Invalid input", "Please enter a valid mobile number");
```

Result: Red alert with X icon, "Try Again" button

### Account Created

```typescript
showAlert("Success", "Your account has been created!");
```

Result: Green alert with checkmark, "Okay" button, auto-dismisses

### Password Mismatch

```typescript
showAlert("Invalid", "New passwords do not match");
```

Result: Red alert (inferred from "Invalid"), "Try Again" button

### Profile Updated

```typescript
showAlert("Success", "Your profile has been updated successfully.");
```

Result: Green alert, "Okay" button, auto-dismisses

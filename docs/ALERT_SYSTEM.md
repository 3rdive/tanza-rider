# Global Alert System Documentation

## Overview

The app uses a centralized, Redux-backed alert system that automatically adapts its appearance based on the alert type (success, error, warning).

## Features

- ✅ **Automatic type inference** from heading text
- 🎨 **Dynamic theming** - colors, icons, and button text adapt to alert type
- 📱 **Responsive design** - works across all screen sizes
- ⏱️ **Auto-dismiss** - configurable timeout (default: 4 seconds)
- 🎭 **Professional UI** - clean, modern design with smooth animations

## Visual States

### Success Alert

- **Icon**: Green checkmark in light green circle
- **Colors**: Green (#10B981)
- **Button**: "Okay" (green background)
- **Use case**: Successful operations, confirmations

### Error Alert

- **Icon**: Red X/cancel in light red circle
- **Colors**: Red (#EF4444)
- **Button**: "Try Again" (red background)
- **Use case**: Failed operations, validation errors, not found

### Warning Alert

- **Icon**: Orange warning triangle in light orange circle
- **Colors**: Orange (#F59E0B)
- **Button**: "Okay" (orange background)
- **Use case**: Cautions, important notices

## Usage

### Basic Usage

```typescript
import { showAlert } from "@/lib/functions";

// Simple alert (type will be inferred from heading)
showAlert("Success", "Your account has been created!");
showAlert("Error", "Unable to process your request");
showAlert("Invalid Input", "Please enter a valid email address");
```

### With Redux Dispatch (Advanced)

```typescript
import { useDispatch } from "react-redux";
import { showAlert } from "@/redux/slices/alertSlice";

const dispatch = useDispatch();

// Explicit type
dispatch(
  showAlert({
    heading: "Payment Complete",
    message: "Your payment was processed successfully",
    type: "success",
    duration: 3000, // Auto-dismiss after 3 seconds
  })
);

// Custom duration or disable auto-dismiss
dispatch(
  showAlert({
    heading: "Warning",
    message: "This action cannot be undone",
    type: "warning",
    duration: null, // Won't auto-dismiss
  })
);
```

## Type Inference

The system automatically determines the alert type from keywords in the heading:

### Error Keywords

- error, failed, fail
- invalid, denied, unauthorized, forbidden
- missing, not found, unable

### Warning Keywords

- warn, warning, caution

### Success Keywords

- success, added, done, complete
- ok, saved, updated, submitted

### Examples

```typescript
showAlert("Invalid Email", "..."); // → Error alert
showAlert("Success", "..."); // → Success alert
showAlert("Warning", "..."); // → Warning alert
showAlert("Account Not Found", "..."); // → Error alert (inferred)
showAlert("Profile Updated", "..."); // → Success alert (inferred)
```

## Customization

### Override Inferred Type

```typescript
// Even though "Success" would infer as success, force it to be warning
dispatch(
  showAlert({
    heading: "Success with Warnings",
    message: "Operation completed but some items were skipped",
    type: "warning", // Explicit override
  })
);
```

### Control Duration

```typescript
// Quick notification (1.5 seconds)
showAlert("Copied!", "Link copied to clipboard", [], undefined, 1500);

// Persistent (manual dismiss only)
dispatch(
  showAlert({
    heading: "Important Notice",
    message: "Please read carefully before proceeding",
    duration: null,
  })
);
```

## Component Architecture

### Files

- **Redux Slice**: `redux/slices/alertSlice.ts`
  - State management for alert visibility, content, and type
  - Type inference logic
- **UI Component**: `components/GlobalAlert.tsx`

  - Visual rendering with dynamic theming
  - Icon selection and color coordination
  - Auto-dismiss timer

- **Helper Function**: `lib/functions.ts`
  - `showAlert()` utility for easy dispatching

### Integration

The `GlobalAlert` component is mounted at the app root in `app/_layout.tsx`, ensuring it's visible across all screens.

## Migration from Old System

### Before (CustomAlert)

```typescript
CustomAlert.alert("Error", "Something went wrong", [], "error-outline", true);
```

### After (Global Alert)

```typescript
showAlert("Error", "Something went wrong");
// Type is automatically inferred, icon and colors adapt
```

## Best Practices

1. **Use descriptive headings** - They help with automatic type detection
2. **Keep messages concise** - Alert is for quick notifications
3. **Prefer auto-dismiss for success** - Don't require user action for confirmations
4. **Use null duration for critical errors** - Force user acknowledgment
5. **Explicit types for ambiguous cases** - When heading doesn't clearly indicate type

## Design Tokens

### Colors

```typescript
Success: #10B981 (Emerald 500)
Error:   #EF4444 (Red 500)
Warning: #F59E0B (Amber 500)

Background Overlays:
Success: #D1FAE5 (Emerald 100)
Error:   #FEE2E2 (Red 100)
Warning: #FEF3C7 (Amber 100)
```

### Typography

- Heading: 24px, Bold (700), Dark Gray
- Message: 15px, Regular, Gray
- Button: 17px, Semibold (600)

### Spacing

- Card padding: 32px
- Icon size: 64px in 96x96 container
- Button height: 48px (16px vertical padding)
- Border radius: 20px (card), 12px (button)

## Examples in Context

### Sign In Flow

```typescript
// Invalid input
showAlert("Invalid input", "Please enter a valid mobile number");
// → Error alert with red theme

// Success
showAlert("Success", "Signed in successfully!");
// → Success alert with green theme
```

### Password Change

```typescript
// Validation error
showAlert("Invalid", "New passwords do not match");
// → Error alert

// Success
showAlert("Success", "Password changed successfully");
// → Success alert, auto-dismisses, user can continue
```

### Profile Update

```typescript
// Success
showAlert("Success", "Your profile has been updated successfully.");
// → Success alert

// Failure
showAlert("Update failed", "Please try again");
// → Error alert with "Try Again" button
```

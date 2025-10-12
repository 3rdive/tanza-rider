# DocumentStatusBanner Component

A smart banner component that displays different messages and actions based on the rider's document verification status.

## Location

`components/DocumentStatusBanner.tsx`

## Usage

```tsx
import DocumentStatusBanner from "@/components/DocumentStatusBanner";

function Dashboard() {
  const { documentStatus, rejectionReason } = useRider();

  return (
    <View>
      <DocumentStatusBanner
        documentStatus={documentStatus}
        rejectionReason={rejectionReason}
      />
    </View>
  );
}
```

## Props

| Prop              | Type             | Required | Description                                                               |
| ----------------- | ---------------- | -------- | ------------------------------------------------------------------------- |
| `documentStatus`  | `string`         | Yes      | Current document status (INITIAL, PENDING, SUBMITTED, APPROVED, REJECTED) |
| `rejectionReason` | `string \| null` | No       | Reason for rejection (only shown when status is REJECTED)                 |

## Behavior by Status

### INITIAL

- **Shows:** Orange warning banner
- **Icon:** Alert circle (⚠️)
- **Title:** "Documents Required"
- **Message:** "Upload your documents to start receiving orders."
- **Action:** "Upload" button → navigates to `/profile/document`
- **Style:** Orange accent (#ff9800)

### PENDING

- **Shows:** Blue info banner
- **Icon:** Clock (⏱️)
- **Title:** "Documents Under Review"
- **Message:** "Your documents are being reviewed. You'll be notified once the review is complete."
- **Action:** None (read-only)
- **Style:** Blue accent (#2196f3)

### REJECTED

- **Shows:** Red error banner
- **Icon:** Close circle (❌)
- **Title:** "Documents Rejected"
- **Message:** Shows `rejectionReason` if provided, otherwise generic message
- **Action:** "Fix Now" button → navigates to `/profile/document`
- **Style:** Red accent (#f44336)

### SUBMITTED or APPROVED

- **Shows:** Nothing (banner is hidden)
- **Reason:** No action needed from the rider

## Design Features

✅ **Contextual Colors**: Each status has a distinct color scheme  
✅ **Clear Call-to-Action**: Buttons for actionable states (INITIAL, REJECTED)  
✅ **Icon Support**: Visual indicators for quick recognition  
✅ **Responsive Layout**: Adapts to different screen sizes  
✅ **Shadow & Elevation**: Stands out from background content  
✅ **Border Accent**: Left border highlights the status type

## Document Status Enum

```typescript
export enum DocumentStatus {
  INITIAL = "INITIAL", // Not uploaded yet
  PENDING = "PENDING", // Under review
  SUBMITTED = "SUBMITTED", // Submitted (synonym for PENDING in some flows)
  APPROVED = "APPROVED", // Verified and approved
  REJECTED = "REJECTED", // Rejected, needs resubmission
}
```

## Integration Points

1. **Home Dashboard** (`app/(tabs)/index.tsx`)

   - Displayed at the top of the bottom sheet
   - Visible when user scrolls
   - Updates via pull-to-refresh

2. **useRider Hook**

   - Provides `documentStatus` and `rejectionReason`
   - Auto-updates when rider data changes

3. **Navigation**
   - Buttons navigate to `/profile/document` using expo-router
   - Allows riders to upload/fix documents

## Example States

### Initial State (New Rider)

```tsx
<DocumentStatusBanner documentStatus="INITIAL" rejectionReason={null} />
```

### Pending Review

```tsx
<DocumentStatusBanner documentStatus="PENDING" rejectionReason={null} />
```

### Rejected with Reason

```tsx
<DocumentStatusBanner
  documentStatus="REJECTED"
  rejectionReason="Driver license photo is blurry. Please upload a clearer image."
/>
```

### Approved (No Banner)

```tsx
<DocumentStatusBanner documentStatus="APPROVED" rejectionReason={null} />
// Renders: null (nothing shown)
```

## Styling

The component uses React Native StyleSheet with:

- Flexbox layout for responsive design
- Platform-specific shadows (iOS) and elevation (Android)
- Consistent padding and spacing
- Accessible font sizes and touch targets

## Future Enhancements

Potential improvements:

- [ ] Animation on mount/unmount
- [ ] Dismiss button for non-critical statuses
- [ ] Progress indicator for PENDING status
- [ ] Expandable section for detailed rejection reasons
- [ ] Inline document preview
- [ ] Notification bell integration

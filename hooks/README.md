# Custom Hooks

## useRider Hook

Custom hook for managing rider data and document status.

### Location

`hooks/rider.hook.ts`

### Usage

```tsx
import { useRider } from "@/hooks/rider.hook";

function MyComponent() {
  const {
    // State
    rider, // Current rider data
    loading, // Loading state for fetch
    error, // Error message from fetch
    updating, // Loading state for update
    updateError, // Error message from update
    documentStatus, // Current document status (INITIAL, PENDING, etc.)
    isEditable, // Whether documents can be edited (true if INITIAL or REJECTED)

    // Actions
    fetchRider, // Function to fetch rider data
    updateRider, // Function to update rider data
  } = useRider();

  // Fetch on mount
  useEffect(() => {
    fetchRider();
  }, [fetchRider]);

  // Update rider
  const handleUpdate = async () => {
    try {
      await updateRider({ vehicleType: "bike" }).unwrap();
      console.log("Updated!");
    } catch (err) {
      console.error("Update failed:", err);
    }
  };
}
```

### Features

- **Auto-computed `isEditable`**: Returns true only when `documentStatus` is "INITIAL" or "REJECTED"
- **Type-safe**: Full TypeScript support with proper typing
- **Memoized callbacks**: Uses `useCallback` to prevent unnecessary re-renders
- **Redux integration**: Seamlessly connects to Redux store

### Document Status Values

- `INITIAL` - Documents not yet submitted (editable)
- `PENDING` - Documents submitted, awaiting review (not editable)
- `SUBMITTED` - Documents under review (not editable)
- `APPROVED` - Documents approved (not editable)
- `REJECTED` - Documents rejected, need resubmission (editable)

### API Methods Called

- `fetchRider()` → Calls `GET /api/v1/riders/me`
- `updateRider(payload)` → Calls `PATCH /api/v1/riders/me`

### Return Values

| Property         | Type                   | Description                     |
| ---------------- | ---------------------- | ------------------------------- |
| `rider`          | `IRider \| null`       | Current rider data object       |
| `loading`        | `boolean`              | True while fetching rider data  |
| `error`          | `string \| null`       | Error message if fetch failed   |
| `updating`       | `boolean`              | True while updating rider data  |
| `updateError`    | `string \| null`       | Error message if update failed  |
| `documentStatus` | `string`               | Current document status         |
| `isEditable`     | `boolean`              | Whether documents can be edited |
| `fetchRider`     | `() => Promise`        | Fetch rider data from API       |
| `updateRider`    | `(payload) => Promise` | Update rider data via API       |

# Withdrawal Options Feature

## Overview

This feature allows riders to manage their bank account withdrawal options for receiving payments. Users can add multiple bank accounts, set a default account, and delete accounts as needed.

## Architecture

### 1. API Layer (`lib/api.ts`)

#### Types

```typescript
interface IWithdrawalOption {
  id: string;
  riderId: string;
  bankName: string;
  slug: string | null;
  accountNumber: string;
  bankHoldersName: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface IAddWithdrawalOptionPayload {
  bankName: string;
  accountNumber: string;
  bankHoldersName: string;
  slug?: string;
}
```

#### API Service Methods

- **`withdrawalService.getAll()`**: Fetch all withdrawal options for the authenticated user
- **`withdrawalService.add(payload)`**: Add a new withdrawal option
- **`withdrawalService.setDefault(id)`**: Set a withdrawal option as default
- **`withdrawalService.delete(id)`**: Delete a withdrawal option

### 2. Storage Layer (`lib/storage-mechanics.ts`)

Added `WITHDRAWAL_OPTIONS` to `StorageKeys` enum for caching withdrawal options locally.

**Benefits:**

- Instant UI updates with cached data
- Reduced API calls
- Better offline experience

### 3. Custom Hook (`hooks/useWithdrawalOptions.ts`)

A comprehensive React hook that manages all withdrawal options state and operations.

#### Features:

- **Automatic cache management**: Loads from cache first, then fetches fresh data
- **Optimistic UI updates**: Updates local state immediately for better UX
- **Error handling**: Proper error messages and recovery
- **Loading states**: Separate states for initial load and refresh
- **CRUD operations**: Complete create, read, update, delete functionality

#### Hook API:

```typescript
const {
  withdrawalOptions, // Array of withdrawal options
  isLoading, // Initial loading state
  isRefreshing, // Pull-to-refresh loading state
  error, // Error message if any
  addWithdrawalOption, // Add new option
  setDefaultOption, // Set option as default
  deleteOption, // Delete option
  refresh, // Manually refresh data
  clearError, // Clear error state
} = useWithdrawalOptions();
```

### 4. UI Component (`app/payment/methods.tsx`)

A fully-featured screen for managing withdrawal options.

#### UI States:

**1. Loading State**

- Shows spinner while fetching initial data
- Message: "Loading payment methods..."

**2. Empty State**

- Shown when user has no withdrawal options
- Icon + message encouraging user to add their first method
- Form is visible below for easy addition

**3. Error State**

- Shown when API fails and no cached data available
- Error icon + error message
- Retry button to attempt reload

**4. Success State**

- List of all withdrawal options
- Each card shows:
  - Bank icon
  - Bank name
  - Account number
  - Account holder name
  - "Default" badge (if applicable)
  - Set default button (if not default)
  - Delete button

**5. Form State**

- Input fields for adding new method:
  - Bank Name (required)
  - Account Number (required)
  - Account Holder Name (required)
  - Bank Slug (optional)
- Submit button disabled when form invalid or submitting
- Shows loading spinner during submission

#### Features:

**Pull-to-Refresh**

- User can pull down to refresh the list
- Uses native refresh control

**Form Validation**

- Required fields are marked with asterisk
- Submit button disabled until all required fields filled
- Clear validation messages via alerts

**Duplicate Detection**

- Backend prevents duplicate entries
- UI shows friendly message when duplicate detected

**Set Default Account**

- Tap checkmark icon to set account as default
- Only non-default accounts show the checkmark icon
- Success confirmation via alert

**Delete Account**

- Tap trash icon to delete
- Confirmation dialog before deletion
- Success confirmation via alert

**Error Handling**

- All operations show clear error messages via alerts
- Network errors handled gracefully
- Duplicate errors handled specifically

## API Endpoints

### Get All Withdrawal Options

```bash
GET /api/v1/wallet/withdrawal-options
Headers: Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "message": "Request successful",
  "data": [
    {
      "id": "uuid",
      "riderId": "uuid",
      "bankName": "Zenith Bank",
      "slug": "zenith-bank",
      "accountNumber": "915308582",
      "bankHoldersName": "Abiodun Samuel",
      "isDefault": true,
      "createdAt": "2025-10-20T16:50:53.555Z",
      "updatedAt": "2025-10-20T16:58:06.824Z"
    }
  ]
}
```

### Add Withdrawal Option

```bash
POST /api/v1/wallet/withdrawal-options
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json
Body:
{
  "bankName": "Zenith Bank",
  "accountNumber": "915308582",
  "bankHoldersName": "Abiodun Samuel",
  "slug": "zenith-bank"
}
```

**Success Response:**

```json
{
  "success": true,
  "message": "Request successful",
  "data": {
    /* withdrawal option object */
  }
}
```

**Duplicate Error:**

```json
{
  "success": false,
  "message": "withdrawal option already exists",
  "data": null
}
```

### Set Default

```bash
PATCH /api/v1/wallet/withdrawal-options/{id}/default
Headers: Authorization: Bearer {token}
```

### Delete Option

```bash
DELETE /api/v1/wallet/withdrawal-options/{id}
Headers: Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "message": "Request successful",
  "data": { "success": true }
}
```

## Usage Example

```tsx
import { useWithdrawalOptions } from "../../hooks/useWithdrawalOptions";

function MyComponent() {
  const {
    withdrawalOptions,
    isLoading,
    addWithdrawalOption,
    setDefaultOption,
    deleteOption,
  } = useWithdrawalOptions();

  // Add new option
  const handleAdd = async () => {
    try {
      await addWithdrawalOption({
        bankName: "GT Bank",
        accountNumber: "0123456789",
        bankHoldersName: "John Doe",
      });
      Alert.alert("Success", "Account added!");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Set default
  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultOption(id);
      Alert.alert("Success", "Default account updated!");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    try {
      await deleteOption(id);
      Alert.alert("Success", "Account deleted!");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    // Your UI here
  );
}
```

## Benefits

1. **Performance**: Cache-first approach ensures instant UI updates
2. **User Experience**: Clear loading, error, and empty states
3. **Data Persistence**: Local storage prevents unnecessary API calls
4. **Type Safety**: Full TypeScript support throughout
5. **Error Recovery**: Graceful error handling with retry mechanisms
6. **Optimistic Updates**: UI updates immediately, syncs with backend
7. **Offline Support**: Shows cached data when offline

## Future Enhancements

- Bank verification via Paystack or similar
- Auto-populate account name from account number
- Search/filter for large lists
- Edit functionality (currently delete + re-add)
- Batch operations (delete multiple)
- Export options list

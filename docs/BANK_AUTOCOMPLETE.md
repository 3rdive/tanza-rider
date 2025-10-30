# Payment Methods Screen - Bank Autocomplete Feature

## Overview

The payment methods screen has been enhanced with intelligent bank search autocomplete and automatic account validation. Users can no longer manually type bank names - they must select from Nigerian banks provided by the API, and their account information is automatically validated.

## Key Features

### 🔍 Bank Search Autocomplete

- **Real-time search**: As users type, the system searches Nigerian banks
- **Debounced API calls**: 300ms delay to prevent excessive API requests
- **Dropdown selection**: Shows matching banks in a dropdown
- **Visual feedback**: Shows checkmark when bank is selected
- **Required selection**: Users MUST select a bank from the dropdown

### ✅ Automatic Account Validation

- **10-digit validation**: Automatically triggers when account number reaches 10 digits
- **Real-time verification**: Calls API to validate account with selected bank
- **Auto-populate name**: Account holder name is automatically filled
- **Visual indicators**: Shows loading spinner during validation, checkmark when validated
- **Error handling**: Clear error message if validation fails

### 🔒 Form Protection

- Bank field: Must select from API results (no manual entry)
- Account number: Must be exactly 10 digits
- Account name: Read-only, populated by API
- Submit button: Disabled until all validations pass

## User Flow

```
1. User types bank name (e.g., "Access")
   ↓
2. System searches and displays matching banks
   ↓
3. User selects "Access Bank" from dropdown
   ✓ Bank field locked with checkmark
   ↓
4. User enters 10-digit account number
   ↓
5. System automatically validates account
   ⏳ Shows loading spinner
   ↓
6. Account validated successfully
   ✓ Account name auto-populated
   ✓ Checkmark shown
   ↓
7. Submit button enabled
   ↓
8. User adds payment method
```

## API Integration

### 1. Search Banks API

**Endpoint:** `GET /api/v1/wallet/banks?query={searchTerm}`

**Purpose:** Search Nigerian banks by name

**Usage:** Called as user types in bank search field (debounced)

**Response:**

```json
{
  "success": true,
  "message": "Request successful",
  "data": [
    {
      "id": 1,
      "name": "Access Bank",
      "slug": "access-bank",
      "code": "044",
      "longcode": "044150149",
      "active": true,
      "country": "Nigeria",
      "currency": "NGN",
      "type": "nuban"
    }
  ]
}
```

### 2. Validate Account API

**Endpoint:** `GET /api/v1/wallet/banks/validate?account_number={number}&bank_code={code}`

**Purpose:** Verify account number and get account holder name

**Usage:** Automatically called when user enters 10-digit account number

**Response:**

```json
{
  "success": true,
  "message": "Request successful",
  "data": {
    "account_number": "9153065907",
    "account_name": "SAMUEL BABATUNDE ABIODUN",
    "bank_id": 171
  }
}
```

## Implementation Details

### State Management

```typescript
// Bank search
const [bankSearchQuery, setBankSearchQuery] = useState("");
const [bankSearchResults, setBankSearchResults] = useState<IBank[]>([]);
const [isSearchingBanks, setIsSearchingBanks] = useState(false);
const [showBankDropdown, setShowBankDropdown] = useState(false);
const [selectedBank, setSelectedBank] = useState<IBank | null>(null);

// Account validation
const [isValidatingAccount, setIsValidatingAccount] = useState(false);
const [accountValidated, setAccountValidated] = useState(false);

// Form data
const [form, setForm] = useState({
  bankName: "",
  accountNumber: "",
  bankHoldersName: "",
  slug: "",
  bankCode: "",
});
```

### Form Validation Logic

```typescript
const isFormValid =
  selectedBank !== null && // Bank selected
  form.accountNumber.trim().length === 10 && // 10 digits
  form.bankHoldersName.trim() !== "" && // Name populated
  accountValidated; // Account validated
```

### Bank Search (Debounced)

```typescript
useEffect(() => {
  const searchBanks = async () => {
    if (bankSearchQuery.trim().length < 2) {
      setBankSearchResults([]);
      setShowBankDropdown(false);
      return;
    }

    setIsSearchingBanks(true);
    try {
      const response = await withdrawalService.searchBanks(bankSearchQuery);
      if (response.success && response.data) {
        setBankSearchResults(response.data);
        setShowBankDropdown(true);
      }
    } catch {
      setBankSearchResults([]);
    } finally {
      setIsSearchingBanks(false);
    }
  };

  const timeoutId = setTimeout(searchBanks, 300); // 300ms debounce
  return () => clearTimeout(timeoutId);
}, [bankSearchQuery]);
```

### Automatic Account Validation

```typescript
useEffect(() => {
  if (form.accountNumber.length === 10 && selectedBank) {
    validateAccountNumber();
  } else {
    setAccountValidated(false);
    if (form.accountNumber.length !== 10) {
      setForm((prev) => ({
        ...prev,
        bankHoldersName: "",
      }));
    }
  }
}, [form.accountNumber, selectedBank]);
```

## UI Components

### Bank Search Input

- Text input with search icon
- Debounced search (300ms)
- Shows loading spinner while searching
- Shows checkmark when bank selected
- Dropdown appears below with results

### Bank Dropdown

- Positioned absolutely below input
- Max height: 200px with scroll
- Shows bank name and code
- Tap to select
- Auto-closes on selection

### Account Number Input

- Numeric keyboard
- Max length: 10 digits
- Disabled until bank selected
- Shows validation spinner
- Shows checkmark when validated

### Account Name Input

- Read-only field
- Gray background to indicate disabled
- Lock icon to show it's auto-populated
- Only filled after successful validation

## Helper Text

Dynamic helper messages guide users:

1. **No bank selected**: "💡 Please select a bank from the search results"
2. **Bank selected, no account**: "💡 Enter your 10-digit account number"
3. **Validation failed**: "⚠️ Account validation failed. Please check your account number."

## Error Handling

### Bank Search Errors

- Silent fail - just clears results
- User can retry by typing again

### Account Validation Errors

- Shows alert: "Validation Failed"
- Message: "Could not validate account number. Please check and try again."
- Clears account name field
- User must re-enter or check account number

### Duplicate Account Errors

- Caught during submission
- Shows alert: "Duplicate Entry"
- Message: "This withdrawal option already exists in your account."

## Visual Indicators

| State              | Icon     | Color   |
| ------------------ | -------- | ------- |
| Searching banks    | Spinner  | #00AA66 |
| Bank selected      | ✓ Circle | #00AA66 |
| Validating account | Spinner  | #00AA66 |
| Account validated  | ✓ Circle | #00AA66 |
| Account locked     | 🔒 Lock  | #999    |

## Styling

### Dropdown

```typescript
dropdown: {
  position: "absolute",
  top: 50,
  backgroundColor: "#fff",
  borderWidth: 1,
  borderColor: "#00AA66",
  borderRadius: 10,
  maxHeight: 200,
  zIndex: 2000,
  elevation: 5,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
}
```

### Disabled Input

```typescript
inputDisabled: {
  backgroundColor: "#f5f5f5",
  color: "#666",
}
```

## Benefits

✅ **Data Integrity**: Only valid Nigerian banks can be selected
✅ **Automatic Verification**: Account numbers are validated in real-time
✅ **Better UX**: No typing errors in bank names
✅ **Fraud Prevention**: Ensures accounts are real and valid
✅ **Reduced Errors**: Auto-populated account names prevent typos
✅ **Faster Input**: Search is faster than manual typing
✅ **Visual Feedback**: Clear indicators for each step
✅ **Mobile Optimized**: Touch-friendly dropdown and keyboard

## Testing Checklist

- [ ] Search shows results for valid bank names
- [ ] Dropdown appears and is scrollable
- [ ] Selected bank shows checkmark
- [ ] Account number field disabled until bank selected
- [ ] Account validation triggers at 10 digits
- [ ] Account name auto-populates on success
- [ ] Validation failure shows error
- [ ] Submit button disabled until all validations pass
- [ ] Form clears after successful submission
- [ ] Duplicate error handled correctly
- [ ] Pull-to-refresh works
- [ ] Loading states show correctly
- [ ] Empty state displays properly

## Future Enhancements

- Cache frequently used banks
- Show bank logos in dropdown
- Allow filtering by bank type (Commercial, Microfinance, etc.)
- Add recent banks section
- Offline support with cached bank list
- Batch validation for multiple accounts
- Bank transfer fees preview

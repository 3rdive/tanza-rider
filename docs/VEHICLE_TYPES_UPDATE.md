# Vehicle Types API Integration

## Overview
The VehicleType has been migrated from a hardcoded enum to a dynamic API-driven system. This allows for flexible vehicle type management through the backend API.

## Changes Made

### 1. API Integration (`lib/api.ts`)

#### New Interface
```typescript
export interface IVehicleType {
  id: string;
  name: string;
  description: string;
  baseFee: number;
  maxWeight: number | null;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

#### New API Endpoint
```typescript
riderService.getVehicleTypes()
```
- **Method**: GET
- **Endpoint**: `/api/v1/vehicle-types`
- **Returns**: `IApiResponse<IVehicleType[]>`
- **Description**: Fetches all vehicle types from the backend

### 2. Custom Hook (`hooks/useVehicleTypes.ts`)

A new custom hook was created to manage vehicle types state:

```typescript
export const useVehicleTypes = () => {
  const { vehicleTypes, loading, error, refetch } = useVehicleTypes();
  // ...
}
```

**Features:**
- Automatically fetches vehicle types on mount
- Filters for active vehicle types only (isActive = true, deletedAt = null)
- Provides loading and error states
- Includes refetch function for manual refresh

**Return Values:**
- `vehicleTypes`: Array of active vehicle types
- `loading`: Boolean indicating fetch status
- `error`: Error message if fetch fails
- `refetch`: Function to manually refetch vehicle types

### 3. Document Verification UI (`app/profile/document.tsx`)

#### Dynamic Vehicle Type Selection
The hardcoded vehicle type buttons (bike, bicycle, van) have been replaced with a dynamic system that:
- Fetches vehicle types from the API
- Displays all active vehicle types as selectable buttons
- Capitalizes the first letter of each vehicle type name for display
- Shows a loading indicator while fetching vehicle types

#### Default Vehicle Type Logic
- If rider has a vehicle type set: Uses rider's vehicle type
- If rider has no vehicle type:
  - Looks for "bike" in available vehicle types
  - If "bike" not found, defaults to first available vehicle type

#### Key Changes:
```typescript
// Before: Hardcoded buttons
<TouchableOpacity onPress={() => handleVehicleTypeChange("bike")}>
  <Text>Bike</Text>
</TouchableOpacity>

// After: Dynamic buttons from API
{vehicleTypes.map((type) => (
  <TouchableOpacity 
    key={type.id} 
    onPress={() => handleVehicleTypeChange(type.name)}
  >
    <Text>{type.name.charAt(0).toUpperCase() + type.name.slice(1)}</Text>
  </TouchableOpacity>
))}
```

## Document Upload
The document upload functionality remains unchanged and continues to pass `document.name` (docName) as required:

```typescript
const documentsToUpload: IDocumentUpload[] = Object.values(documentData).map((doc) => ({
  docName: doc.docName,
  docUrl: doc.docUrl,
  expirationDate: doc.expirationDate,
}));
```

## API Response Example
```json
{
  "success": true,
  "message": "Request successful",
  "data": [
    {
      "id": "42c996a9-00f6-46f3-9e57-8701f4959917",
      "name": "bike",
      "description": "Motorcycle for fast deliveries",
      "baseFee": 0,
      "maxWeight": null,
      "isActive": true,
      "deletedAt": null,
      "createdAt": "2026-01-02T11:19:06.060Z",
      "updatedAt": "2026-01-02T11:19:06.060Z"
    },
    {
      "id": "d08243ac-e087-4bed-9545-4dcaa03aec27",
      "name": "Private Jet",
      "description": "Medium-sized vehicle suitable for city and intercity deliveries.",
      "baseFee": 1500,
      "maxWeight": 1200,
      "isActive": true,
      "deletedAt": null,
      "createdAt": "2026-01-02T14:57:32.215Z",
      "updatedAt": "2026-01-02T14:57:32.215Z"
    }
  ]
}
```

## Usage

### In Components
```typescript
import { useVehicleTypes } from "@/hooks/useVehicleTypes";

function MyComponent() {
  const { vehicleTypes, loading, error } = useVehicleTypes();
  
  if (loading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error}</Text>;
  
  return (
    <View>
      {vehicleTypes.map((type) => (
        <Text key={type.id}>{type.name}</Text>
      ))}
    </View>
  );
}
```

### Direct API Call
```typescript
import { riderService } from "@/lib/api";

const response = await riderService.getVehicleTypes();
const vehicleTypes = response.data;
```

## Benefits

1. **Flexibility**: Vehicle types can be added, removed, or modified from the backend without app updates
2. **Consistency**: Single source of truth for vehicle types across the application
3. **Scalability**: Easy to add new vehicle types with custom properties (baseFee, maxWeight, etc.)
4. **Dynamic UI**: UI automatically adapts to available vehicle types

## Backward Compatibility

- Existing riders with vehicle types set will continue to work
- Default fallback to "bike" or first available type ensures smooth migration
- Document upload API remains unchanged

## Testing Checklist

- [ ] Vehicle types load correctly on document verification page
- [ ] Vehicle type selection updates rider profile
- [ ] Document submission includes correct vehicle type
- [ ] Loading state displays while fetching vehicle types
- [ ] Error handling works when API fails
- [ ] Default vehicle type is set correctly for new riders
- [ ] Existing riders see their current vehicle type selected
- [ ] Vehicle type cannot be changed after document submission

## Migration Guide

### For Developers

1. **No Code Changes Required in Most Cases**
   - Existing code that uses `rider.vehicleType` will continue to work
   - The vehicle type is still stored as a string in the rider profile
   - Backend API already handles vehicle type validation

2. **If You Need to Display Vehicle Types**
   ```typescript
   import { useVehicleTypes } from "@/hooks/useVehicleTypes";
   
   const { vehicleTypes, loading } = useVehicleTypes();
   ```

3. **If You Need to Validate Vehicle Types**
   ```typescript
   const isValidVehicleType = (name: string) => {
     return vehicleTypes.some(type => type.name === name && type.isActive);
   };
   ```

### For Backend Teams

1. **Ensure API Endpoint is Available**
   - `GET /api/v1/vehicle-types` must return the expected format
   - Include only active vehicle types in production

2. **Vehicle Type Names**
   - Names should be lowercase (e.g., "bike", "bicycle", "van")
   - Names should match what's stored in rider.vehicleType field
   - Maintain backward compatibility with existing vehicle type names

3. **Required Documents Endpoint**
   - Ensure `GET /api/v1/riders/me/documents/required?vehicleType={type}` works with new vehicle type names

### Breaking Changes

**None** - This update is fully backward compatible:
- Existing riders retain their vehicle types
- Hardcoded "bike" fallback ensures smooth operation
- Document upload API unchanged

### Rollback Plan

If issues arise, simply revert the following files:
1. `lib/api.ts` - Remove IVehicleType interface and getVehicleTypes endpoint
2. `hooks/useVehicleTypes.ts` - Delete file
3. `app/profile/document.tsx` - Restore hardcoded vehicle type buttons
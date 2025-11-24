# Multi-Delivery Implementation Guide

## Overview

This document describes the implementation of multi-delivery capability across the Tanza Rider app. The API has been updated to support orders with multiple delivery destinations, allowing riders to handle orders with multiple drop-off points from a single pickup location.

## API Changes

### 1. New Response Structure

All order-related APIs now include multi-delivery fields:

#### Common Fields Added to All Order Responses:
- `hasMultipleDeliveries` (boolean): Indicates if the order has multiple destinations
- `deliveryDestinations` (array): List of all delivery destinations for the order

#### DeliveryDestination Object Structure:
```typescript
{
  id: string;
  orderId: string;
  dropOffLocation: {
    address: string;
    latitude: string;
    longitude: string;
  };
  recipient: {
    name: string;
    role: string;
    email: string;
    phone: string;
  };
  distanceFromPickupKm: number;
  durationFromPickup: string;
  deliveryFee: number;
  delivered: boolean;
  deliveredAt: string | null;
  createdAt: string;
}
```

### 2. Updated API Endpoints

#### GET /api/v1/order/{orderId} (Get Order Details)
**New Fields:**
- `deliveryDestinations`: Array of delivery destinations
- `hasMultipleDeliveries`: Boolean flag
- `distanceInKm`: Total distance (now a number instead of string)
- `isUrgent`: Boolean indicating urgent orders
- `declinedRiderIds`: Array of rider IDs who declined the order

**Response Example:**
```json
{
  "success": true,
  "message": "Request successful",
  "data": {
    "id": "3a1df331-0b38-4b0f-83f5-31a830e5f37c",
    "hasMultipleDeliveries": true,
    "deliveryDestinations": [
      {
        "id": "79bd5aa5-a586-4a75-a841-fe0453d972f2",
        "dropOffLocation": { "address": "...", "latitude": "...", "longitude": "..." },
        "recipient": { "name": "Jane Smith", "phone": "0987654321", ... },
        "distanceFromPickupKm": 1.79,
        "deliveryFee": 179,
        "delivered": false
      }
    ]
  }
}
```

#### GET /api/v1/order/active-orders (Get Active Orders)
**New Fields:** Same as order details

#### GET /api/v1/order/assigned-orders (Get Assigned Orders)
**New Fields:** Same as order details

## TypeScript Interface Updates

### lib/api.ts

#### New Interfaces:
```typescript
export interface IRecipient {
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface IDeliveryDestination {
  id: string;
  orderId: string;
  dropOffLocation: IOrderLocation;
  recipient: IRecipient;
  distanceFromPickupKm: number;
  durationFromPickup: string;
  deliveryFee: number;
  delivered: boolean;
  deliveredAt: string | null;
  createdAt: string;
}
```

#### Updated Interfaces:

**IOrderDetail:**
- Added: `deliveryDestinations: IDeliveryDestination[]`
- Added: `hasMultipleDeliveries: boolean`
- Added: `distanceInKm: number`
- Added: `isUrgent: boolean`
- Added: `declinedRiderIds: string[]`
- Changed: `riderId: string | null` (was: `string`)
- Changed: `riderAssignedAt: string | null` (was: `string`)

**IActiveOrder:**
- Added: `hasMultipleDeliveries: boolean`
- Added: `deliveryDestinations: IDeliveryDestination[]`

**IAssignedOrder:**
- Added: `hasMultipleDeliveries: boolean`
- Added: `deliveryDestinations: IDeliveryDestination[]`
- Changed: `distanceInKm: number` (was: `string`)

### redux/slices/deliveryRequestSlice.ts

**DeliveryRequest Interface:**
- Changed: `distance: number` (was: `string`)
- Added: `hasMultipleDeliveries?: boolean`
- Added: `deliveryDestinations?: {...}[]`

## Component Updates

### 1. Home Screen (`app/(tabs)/index.tsx`)

#### Changes:
- **Map Region Calculation**: Updated to calculate bounds for all delivery destinations
- **Marker Rendering**: Shows multiple destination markers with different colors based on delivery status
- **Polylines**: Draws dashed lines from pickup to each destination
- **Coordinates**: Wrapped in `useMemo` for performance optimization

#### Features:
- Green pin for pickup location
- Red pins for undelivered destinations
- Green pins for delivered destinations
- Dashed polylines connecting pickup to each destination
- Map auto-zooms to fit all markers

### 2. Active Delivery Card (`components/home/ActiveDeliveryCard.tsx`)

#### Changes:
- **Location Display**: Shows all delivery destinations when `hasMultipleDeliveries` is true
- **Recipient Info**: Displays recipient name and phone for each destination
- **Delivery Status**: Shows checkmark icon for completed deliveries
- **Distance & Fee**: Shows individual distance and fee for each destination

#### UI Updates:
```
Pickup Location
    ↓
Drop-off 1 ✓ (if delivered)
Address
Recipient • Phone
Distance • Fee
    ↓
Drop-off 2
Address
Recipient • Phone
Distance • Fee
```

### 3. Order Details Screen (`app/orders/[id].tsx`)

#### Changes:
- **Delivery Route Section**: Updated to show multiple destinations
- **Status Indicators**: Green flag for delivered, red for pending
- **Detailed Info**: Shows recipient details, distance, fee, and delivery timestamp

#### UI Updates:
- Each destination displays:
  - Drop-off number (e.g., "Drop-off 1")
  - Delivery status (checkmark if delivered)
  - Full address
  - Recipient name and phone
  - Distance from pickup
  - Individual delivery fee
  - Delivery timestamp (if delivered)

### 4. Delivery Request Snackbar (`components/DeliveryRequestSnackbar.tsx`)

#### Changes:
- **Location Display**: Shows count and list of destinations for multi-delivery orders
- **Distance Display**: Shows total distance with "(total)" indicator for multi-delivery
- **Conversion Function**: Updated to pass through multi-delivery data

#### UI Updates:
```
📍 Pickup Location
2 Drop-off Locations
  1. First destination address
  2. Second destination address
12.5 KM (total) • ₦500
```

## Backward Compatibility

The implementation maintains backward compatibility:

1. **Single Delivery Orders**: When `hasMultipleDeliveries` is `false` or `deliveryDestinations` is empty:
   - Original `dropOffLocation` is still used
   - UI falls back to single-destination display
   - No visual changes for existing single-delivery orders

2. **Conditional Rendering**: All multi-delivery UI elements are conditionally rendered:
   ```typescript
   {order.hasMultipleDeliveries && order.deliveryDestinations?.length > 0 ? (
     // Multi-delivery UI
   ) : (
     // Single-delivery UI (original)
   )}
   ```

## Visual Indicators

### Delivery Status Colors:
- 🟢 **Green (#00AA66)**: Delivered destinations
- 🔴 **Red (#FF4C4C)**: Pending destinations
- 🟠 **Orange (#FFA500)**: In-progress destinations

### Icons:
- `checkmark-circle`: Delivered status
- `arrow-down-circle`: Drop-off locations
- `arrow-up-circle`: Pickup location
- `flag`: Destination markers

## Testing Considerations

### Test Cases:
1. **Single Delivery Order**:
   - Verify original UI appears unchanged
   - Check map shows single route
   - Confirm backward compatibility

2. **Multi-Delivery Order**:
   - Verify all destinations appear in list
   - Check map shows all markers and polylines
   - Confirm recipient information displays correctly
   - Test delivered vs. pending status indicators

3. **Mixed Status**:
   - Orders with some delivered and some pending destinations
   - Verify color coding is correct
   - Check delivery timestamps appear for completed destinations

4. **Edge Cases**:
   - Order with no destinations array
   - Order with empty destinations array
   - Large number of destinations (UI overflow)

## Performance Optimizations

1. **useMemo Hooks**: All coordinate calculations wrapped in `useMemo`
2. **Conditional Rendering**: Multi-delivery UI only renders when needed
3. **Map Region**: Efficiently calculates bounds for all markers
4. **Key Props**: Proper `key` attributes on mapped destination elements

## Future Enhancements

Potential improvements for future releases:
- Route optimization display
- Sequential delivery tracking
- Delivery order resequencing
- Estimated time for each destination
- Navigation between destinations
- Bulk delivery completion
- Per-destination notes/instructions

## Migration Notes

### For Developers:
1. Update local types to match new API responses
2. Test with both single and multi-delivery orders
3. Verify map rendering performance with multiple markers
4. Check UI responsiveness with long destination lists

### For QA:
1. Test all order-related screens with multi-delivery data
2. Verify map markers and polylines render correctly
3. Check delivery status updates reflect in real-time
4. Validate recipient information displays accurately

## Related Files

### Modified Files:
- `lib/api.ts` - Type definitions
- `app/(tabs)/index.tsx` - Home screen with map
- `app/orders/[id].tsx` - Order details screen
- `components/home/ActiveDeliveryCard.tsx` - Active delivery card
- `components/DeliveryRequestSnackbar.tsx` - Request snackbar
- `redux/slices/deliveryRequestSlice.ts` - Redux state types

### Documentation:
- This file: `docs/MULTI_DELIVERY_IMPLEMENTATION.md`

## Support

For questions or issues related to multi-delivery implementation:
1. Check this documentation
2. Review the API response examples
3. Verify type definitions in `lib/api.ts`
4. Test with sample multi-delivery orders

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: ✅ Implemented and Tested
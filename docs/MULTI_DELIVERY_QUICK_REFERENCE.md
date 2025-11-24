# Multi-Delivery Quick Reference Guide

## 🎯 Quick Overview

The Tanza Rider app now supports orders with multiple delivery destinations from a single pickup location.

## 🔄 What Changed?

### API Response Changes

#### Before (Single Delivery):
```json
{
  "pickUpLocation": {...},
  "dropOffLocation": {...},
  "recipient": {...}
}
```

#### After (Multi-Delivery Support):
```json
{
  "pickUpLocation": {...},
  "dropOffLocation": {...},  // Legacy field (first destination)
  "recipient": {...},         // Legacy field (first recipient)
  "hasMultipleDeliveries": true,
  "deliveryDestinations": [
    {
      "id": "dest-1",
      "dropOffLocation": {...},
      "recipient": {...},
      "distanceFromPickupKm": 1.79,
      "deliveryFee": 179,
      "delivered": false,
      "deliveredAt": null
    },
    {
      "id": "dest-2",
      "dropOffLocation": {...},
      "recipient": {...},
      "distanceFromPickupKm": 2.65,
      "deliveryFee": 265,
      "delivered": false,
      "deliveredAt": null
    }
  ]
}
```

### Type Changes

#### `IOrderDetail` Interface:
```typescript
// Added fields:
+ deliveryDestinations: IDeliveryDestination[]
+ hasMultipleDeliveries: boolean
+ distanceInKm: number         // Changed from string
+ isUrgent: boolean
+ declinedRiderIds: string[]
+ riderId: string | null       // Changed from string
+ riderAssignedAt: string | null
```

#### `IActiveOrder` Interface:
```typescript
// Added fields:
+ hasMultipleDeliveries: boolean
+ deliveryDestinations: IDeliveryDestination[]
```

#### `IAssignedOrder` Interface:
```typescript
// Added fields:
+ hasMultipleDeliveries: boolean
+ deliveryDestinations: IDeliveryDestination[]
+ distanceInKm: number         // Changed from string
```

#### New `IDeliveryDestination` Interface:
```typescript
{
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

## 📱 UI Changes

### Home Screen Map
- **Before**: Shows 1 pickup + 1 dropoff marker
- **After**: Shows 1 pickup + N dropoff markers
  - Undelivered destinations: Red pins
  - Delivered destinations: Green pins
  - Dashed lines from pickup to each destination

### Active Delivery Card
- **Before**: Shows single dropoff location
- **After**: Shows list of all destinations with:
  - Destination number (Drop-off 1, 2, 3...)
  - Recipient name & phone
  - Distance from pickup
  - Individual delivery fee
  - Delivery status (✓ if completed)

### Order Details Screen
- **Before**: Shows single route
- **After**: Shows pickup → multiple destinations
  - Each destination shows:
    - Address
    - Recipient info
    - Distance & fee
    - Delivery timestamp (if completed)

### Delivery Request Snackbar
- **Before**: Shows single destination
- **After**: Shows destination count + list
  ```
  📍 Pickup Location
  3 Drop-off Locations
    1. Address one
    2. Address two
    3. Address three
  12.5 KM (total) • ₦500
  ```

## 🎨 Visual Indicators

| Element | Single Delivery | Multi-Delivery |
|---------|----------------|----------------|
| Map Pins | 1 red pin | N pins (red/green) |
| Polylines | Solid line | Dashed lines |
| Dropoff Label | "Drop-off Location" | "Drop-off 1, 2, 3..." |
| Status Icon | None | ✓ (if delivered) |
| Distance | Total only | Per-destination + total |

## 🔧 Code Examples

### Checking for Multi-Delivery:
```typescript
if (order.hasMultipleDeliveries && order.deliveryDestinations?.length > 0) {
  // Handle multi-delivery
  order.deliveryDestinations.map(dest => {
    // Process each destination
  });
} else {
  // Handle single delivery (backward compatible)
  const dropoff = order.dropOffLocation;
  const recipient = order.recipient;
}
```

### Rendering Destinations:
```tsx
{order.hasMultipleDeliveries && order.deliveryDestinations?.length > 0 ? (
  order.deliveryDestinations.map((dest, index) => (
    <View key={dest.id}>
      <Text>Drop-off {index + 1}</Text>
      <Text>{dest.dropOffLocation.address}</Text>
      <Text>{dest.recipient.name} • {dest.recipient.phone}</Text>
      {dest.delivered && <Icon name="checkmark-circle" />}
    </View>
  ))
) : (
  <View>
    <Text>Drop-off Location</Text>
    <Text>{order.dropOffLocation.address}</Text>
  </View>
)}
```

### Map Markers for Multi-Delivery:
```tsx
{deliveryDestinations.map((dest, index) => (
  <Marker
    key={dest.id}
    coordinate={{
      latitude: parseFloat(dest.dropOffLocation.latitude),
      longitude: parseFloat(dest.dropOffLocation.longitude),
    }}
    title={`Drop-off ${index + 1}`}
    description={`${dest.recipient.name} - ${dest.dropOffLocation.address}`}
    pinColor={dest.delivered ? "#00AA66" : "red"}
  />
))}
```

## ⚠️ Breaking Changes

### Type Changes:
1. **`distanceInKm`**: Changed from `string` to `number`
   - **Before**: `order.distanceInKm` → "12.5"
   - **After**: `order.distanceInKm` → 12.5
   - **Fix**: Use `.toFixed(2)` for display

2. **`riderId` & `riderAssignedAt`**: Now nullable
   - **Before**: Always string
   - **After**: `string | null`
   - **Fix**: Add null checks

### Redux State:
- `DeliveryRequest.distance`: Changed from `string` to `number`

## ✅ Backward Compatibility

All changes are **backward compatible**:
- Single delivery orders still work as before
- Legacy `dropOffLocation` and `recipient` fields maintained
- UI conditionally renders based on `hasMultipleDeliveries` flag
- Empty `deliveryDestinations` array handled gracefully

## 🧪 Testing Checklist

- [ ] Test single delivery order (verify no UI changes)
- [ ] Test multi-delivery order (2+ destinations)
- [ ] Test map with multiple markers
- [ ] Test delivered vs. pending status colors
- [ ] Test recipient information display
- [ ] Test distance calculations (number type)
- [ ] Test delivery request snackbar
- [ ] Test order details screen
- [ ] Test active delivery card

## 📊 Data Flow

```
API Response (Multi-Delivery)
    ↓
IOrderDetail / IActiveOrder / IAssignedOrder
    ↓
Redux State (if applicable)
    ↓
Component Props
    ↓
Conditional Rendering
    ↓
    ├→ hasMultipleDeliveries: true → Multi-Delivery UI
    └→ hasMultipleDeliveries: false → Single Delivery UI (Original)
```

## 🚀 Quick Migration Steps

1. **Update type imports** (if needed):
   ```typescript
   import { IDeliveryDestination, IRecipient } from '@/lib/api';
   ```

2. **Add conditional rendering**:
   ```typescript
   const destinations = order.hasMultipleDeliveries 
     ? order.deliveryDestinations 
     : [{ dropOffLocation: order.dropOffLocation, recipient: order.recipient }];
   ```

3. **Update distance handling**:
   ```typescript
   // Before: order.distanceInKm (string)
   // After:  order.distanceInKm.toFixed(2) (number)
   ```

4. **Add null checks**:
   ```typescript
   if (order.riderId) { /* ... */ }
   ```

## 📚 Related Documentation

- **Full Implementation Guide**: `MULTI_DELIVERY_IMPLEMENTATION.md`
- **API Documentation**: Contact backend team
- **Type Definitions**: `lib/api.ts`

## 🆘 Common Issues

### Issue: Type error on `distanceInKm`
**Solution**: Change from string operations to number operations
```typescript
// Before:
`${order.distanceInKm} km`

// After:
`${order.distanceInKm.toFixed(2)} km`
```

### Issue: Map not showing all destinations
**Solution**: Check if `deliveryDestinations` array is populated
```typescript
console.log('Has multi:', order.hasMultipleDeliveries);
console.log('Destinations:', order.deliveryDestinations?.length);
```

### Issue: Recipient info not showing
**Solution**: Use destination-specific recipient, not order-level recipient
```typescript
// Multi-delivery: Use dest.recipient
destination.recipient.name

// Single delivery: Use order.recipient
order.recipient.name
```

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Status**: ✅ Production Ready
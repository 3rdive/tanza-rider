# Order History Implementation

## Overview

This document outlines the implementation of the order history page with API integration, infinite scroll, pull-to-refresh, and loading/empty states.

## Files Modified/Created

### 1. `/lib/api.ts`

Added new types and API service method for order history:

```typescript
export interface IOrderHistoryItem {
  id: string;
  pickUpLocationAddress: string;
  dropOffLocationAddress: string;
  userOrderRole: string;
  deliveryFee: number;
  updatedAt: string;
  eta: string;
  riderRewarded: boolean;
}

export interface IOrderHistoryParams {
  limit: number;
  page: number;
  orderStatus: string[]; // Can pass multiple statuses
}

orderService.getOrderHistory(params: IOrderHistoryParams)
```

### 2. `/hooks/useOrders.ts`

Created custom hook to manage order history state and API calls:

**Features:**

- State management for orders, loading states, pagination
- Tab switching (Upcoming, Ongoing, Completed)
- Pull-to-refresh functionality
- Infinite scroll/pagination
- Automatic status mapping based on tab:
  - **Upcoming**: `["pending"]`
  - **Ongoing**: `["accepted", "picked_up", "transit"]`
  - **Completed**: `["delivered", "cancelled"]`

### 3. `/app/(tabs)/orders.tsx`

Complete redesign with the following features:

## Features Implemented

### ✅ API Integration

- Fetches orders from `/api/v1/order/orders/rider` endpoint
- Supports multiple `orderStatus` query parameters
- Pagination with limit and page parameters

### ✅ Tab System

Three tabs with different order statuses:

- **Upcoming**: Shows pending orders
- **Ongoing**: Shows accepted, picked_up, and transit orders
- **Completed**: Shows delivered and cancelled orders

### ✅ Infinite Scroll

- Automatically loads more orders when scrolling to the bottom
- `onEndReachedThreshold={0.5}` triggers when 50% from bottom
- Shows "Loading more..." indicator at the bottom
- Prevents duplicate calls with `loadingMore` state

### ✅ Pull-to-Refresh

- Pull down to refresh the current tab's orders
- Shows native refresh indicator
- Resets pagination to page 1

### ✅ Loading States

- **Initial Load**: Full-screen spinner with "Loading orders..." text
- **Loading More**: Bottom indicator while fetching next page
- **Refreshing**: Native pull-to-refresh indicator

### ✅ Empty States

- Shows friendly empty state when no orders exist
- Custom message for each tab:
  - Upcoming: "You don't have any upcoming orders"
  - Ongoing: "You don't have any ongoing deliveries"
  - Completed: "You haven't completed any orders yet"

### ✅ Completed Tab Special Display

For completed orders, displays:

- Order ID (shortened to first 8 characters)
- Completion date
- Rider rewarded status (if applicable)

For ongoing/upcoming orders, displays:

- Pickup location address
- Drop-off location address

### ✅ Order Card Information

Each order card shows:

- **Pickup/Dropoff**: Location addresses (for ongoing/upcoming)
- **Order Details**: Order ID and date (for completed)
- **ETA**: Estimated time with clock icon
- **Delivery Fee**: Formatted in Nigerian Naira (₦)
- **Role Badge**: Shows if user is "Sender" or "Recipient"
- **Rider Rewarded**: Star icon for completed orders where rider was rated

## UI/UX Enhancements

- Consistent color scheme using `tzColors.primary` (#00B624)
- Clean card design with subtle borders
- Responsive tab switching
- Smooth scrolling with FlatList optimization
- Role badge positioned in top-right corner of each card
- Icon-based visual indicators for better UX

## Usage

The page automatically loads "Ongoing" orders on mount. Users can:

1. Switch between tabs to view different order categories
2. Pull down to refresh the current view
3. Scroll down to load more orders automatically
4. See order details in an organized card format

## API Response Structure

```json
{
  "success": true,
  "message": "Order [rider] fetched Successfully",
  "data": [
    {
      "id": "d6bf2a98-d693-4dea-848a-9b2a2d192ab3",
      "pickUpLocationAddress": "Ushafa, Bwari Abuja, FCT, Nigeria",
      "dropOffLocationAddress": "Gwarimpa, FCT, Nigeria",
      "userOrderRole": "recipient",
      "deliveryFee": 4764,
      "updatedAt": "2025-10-16T22:15:40.952Z",
      "eta": "1 hour 30 minutes 19 seconds",
      "riderRewarded": false
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

## Performance Considerations

- Uses FlatList for efficient rendering of large lists
- Implements virtualization automatically via FlatList
- Prevents unnecessary re-renders with proper state management
- Debounces API calls through state checks

## Future Enhancements

- Add order detail navigation on card tap
- Add filters (date range, delivery fee range)
- Add search functionality
- Cache orders locally for offline viewing
- Add skeleton loaders for better perceived performance

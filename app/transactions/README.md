# Transaction Detail Page

## Overview

This folder contains the transaction detail screen that displays comprehensive information about a specific transaction.

## Files

- `[id].tsx` - Dynamic route for transaction details based on transaction ID

## Features

### 1. **Transaction Status Card**

- Large visual display with transaction icon
- Transaction amount prominently displayed
- Transaction type label (Order Payment, Order Reward, Deposit, Withdrawal)
- Status badge with color-coding (Complete: Green, Failed: Red, Refunded: Yellow)

### 2. **Transaction Information Section**

- Transaction ID
- Reference number
- Date & Time (formatted)
- Description
- Amount with proper formatting (₦ symbol)

### 3. **Order Information Section** (Conditionally displayed)

Only shown if the transaction is related to an order:

- Order ID
- Vehicle Type
- User Role (Sender/Recipient)
- Delivery Fee
- Service Charge
- Total Amount

### 4. **Help Section**

- Quick access button to contact support
- Links to help and support page

### 5. **Loading & Error States**

- Loading spinner while fetching data
- Error screen with retry button
- User-friendly error messages

## API Integration

### Endpoint

```
GET /api/v1/transaction/{id}
```

### Response Structure

```typescript
interface ITransactionDetail {
  id: string;
  walletId: string;
  userId: string;
  amount: number | string;
  reference: string | null;
  orderId: string | null;
  order: IOrderData | null;
  type: string; // ORDER, ORDER_REWARD, DEPOSIT, WITHDRAWAL
  description: string | null;
  createdAt: string;
  updatedAt: string;
  status: string; // complete, failed, refunded
}
```

## Navigation

### From Wallet Screen

Users can tap on any transaction in the wallet screen to view its details:

```typescript
router.push(`/transactions/${transaction.id}`);
```

### Back Navigation

Users can navigate back using:

- Back button in header
- System back gesture (iOS/Android)

## Styling

### Color Scheme

- **Complete/Success**: `#00B624` (Green)
- **Failed/Error**: `#ef4444` (Red)
- **Refunded/Warning**: `#f59e0b` (Orange)
- **Default**: `#64748b` (Gray)

### Layout

- Clean, card-based design
- Proper spacing and padding
- Responsive to different screen sizes
- ScrollView for content that may overflow

## Transaction Types

1. **ORDER** - Payment for delivery order
2. **ORDER_REWARD** - Earnings from completing delivery
3. **DEPOSIT** - Money added to wallet
4. **WITHDRAWAL** - Money withdrawn from wallet

## Transaction Status

1. **complete** - Successfully completed
2. **failed** - Transaction failed
3. **refunded** - Transaction was refunded

## Usage Example

```typescript
import { router } from "expo-router";

// Navigate to transaction detail
router.push(`/transactions/${transactionId}`);
```

## Future Enhancements

Potential features to add:

- Share transaction receipt
- Download/Print receipt
- Dispute transaction
- View related transactions
- Transaction timeline/history

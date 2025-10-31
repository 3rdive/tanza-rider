# Tanza Go - Delivery & Logistics Mobile App 

**Tanza Go** is a comprehensive delivery and logistics mobile application built for riders and delivery personnel. The app provides a complete ecosystem for managing deliveries, tracking orders, handling payments, and maintaining rider profiles.

## 🎯 Project Overview

Tanza Go is a React Native mobile application that serves as the rider/delivery partner interface for the Tanza logistics platform. It enables delivery riders to:

- **Manage Deliveries**: Accept, track, and complete delivery orders
- **Real-time Tracking**: Live order tracking with GPS integration
- **Payment Management**: Integrated wallet system with Paystack payment gateway
- **Order History**: Complete order management and history tracking
- **Profile Management**: User authentication, profile updates, and document management
- **Communication**: In-app notifications and delivery request system

The app follows a modern mobile-first approach with a clean, intuitive interface designed specifically for delivery professionals working in the logistics industry.

## 🛠️ Technologies & Stack

### **Core Framework**

- **React Native** (0.79.5) - Cross-platform mobile development
- **Expo** (~53.0.23) - Development platform and deployment
- **TypeScript** (~5.8.3) - Type-safe JavaScript development
- **Expo Router** (~5.1.7) - File-based navigation system

### **State Management**

- **Redux Toolkit** (^2.8.2) - Predictable state container
- **React Redux** (^9.2.0) - React bindings for Redux
- **AsyncStorage** (2.1.2) - Local data persistence

### **UI & Styling**

- **React Native Reanimated** (~3.17.4) - Advanced animations
- **React Native Gesture Handler** (~2.24.0) - Touch and gesture handling
- **Expo Vector Icons** (^14.1.0) - Icon library
- **React Native Responsive FontSize** (^0.5.1) - Responsive typography

### **Navigation & Routing**

- **Expo Router** (~5.1.7) - File-based routing system
- **React Navigation** (^7.1.6) - Navigation library
- **React Navigation Bottom Tabs** (^7.3.10) - Tab navigation

### **Location & Maps**

- **Expo Location** (~18.1.6) - GPS and location services
- **React Native Maps** (1.20.1) - Map integration and visualization

### **Payment Integration**

- **React Native Paystack WebView** (^5.0.1) - Paystack payment gateway
- **React Native WebView** (13.13.5) - WebView component for payments

### **Networking & API**

- **Axios** (^1.11.0) - HTTP client for API requests
- **Socket.io Client** (^4.8.1) - Real-time communication

### **Security & Storage**

- **Expo Secure Store** (~14.2.4) - Secure storage for sensitive data
- **JWT Check Expiry** (^1.0.10) - JWT token validation

### **Development Tools**

- **ESLint** (^9.25.0) - Code linting and formatting
- **EAS CLI** - Expo Application Services for building and deployment
- **Babel** (^7.25.2) - JavaScript transpiler

### **Fonts & Typography**

- **Google Fonts Integration**:
  - Poppins (Multiple weights)
  - Manrope
  - Ubuntu

### **Device Features**

- **Expo Image Picker** (~16.1.4) - Camera and gallery access
- **Expo Haptics** (~14.1.4) - Tactile feedback
- **Expo Splash Screen** (~0.30.10) - App launch screen
- **Expo Status Bar** (~2.2.3) - Status bar management

## 📱 Key Features

### **🔐 Authentication & Security**

- Mobile-based authentication system
- OTP verification for secure login
- JWT token management with expiry checking
- Secure storage for sensitive user data
- Password reset functionality

### **📦 Order Management**

- Real-time order assignment and notifications
- Order acceptance/rejection system
- Complete order lifecycle tracking (pending → accepted → picked up → in transit → delivered)
- Order history with detailed tracking information
- Screenshot prevention for sensitive order data

### **💰 Wallet & Payments**

- Integrated wallet system for earnings management
- Paystack payment gateway integration
- Transaction history and payment tracking
- Virtual account management
- Withdrawal options and financial management

### **🗺️ Location & Navigation**

- GPS-based location tracking
- Real-time delivery route optimization
- Map integration for pickup and delivery locations
- ETA calculations and live tracking updates

### **🔔 Notifications & Communication**

- Real-time delivery request notifications
- In-app snackbar notifications for new orders
- Push notification system for order updates
- Communication tools for rider-customer interaction

### **👤 Profile Management**

- Comprehensive user profile management
- Document upload and verification system
- Profile picture management
- Settings and preferences

## 🏗️ Project Structure

```
├── app/                    # Main application screens (Expo Router)
│   ├── (auth)/            # Authentication flow
│   ├── (tabs)/            # Main tab navigation
│   ├── orders/            # Order management screens
│   ├── payment/           # Payment-related screens
│   └── profile/           # Profile management screens
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries and API services
├── redux/                 # State management (Redux slices)
├── theme/                 # Design system (colors, fonts)
├── types/                 # TypeScript type definitions
├── assets/                # Static assets (images, fonts)
└── docs/                  # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI
- iOS Simulator (macOS) or Android Emulator

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd tanza-go
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npx expo start
   ```

4. **Run on different platforms**

   ```bash
   # iOS Simulator
   npm run ios

   # Android Emulator
   npm run android

   # Web browser
   npm run web

   # iPhone 16 Simulator (specific)
   npm run iphone16
   ```

### Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint for code quality

## 🏗️ Build & Deployment

This project uses **Expo Application Services (EAS)** for building and deployment:

### Build Profiles

- **Development**: Development builds with debugging enabled
- **Preview**: Internal distribution for testing
- **Production**: Production builds for app stores

### Build Commands

```bash
# Development build
eas build --profile development

# Preview build
eas build --profile preview

# Production build
eas build --profile production
```

## 🔧 Configuration

### Environment Setup

- **Bundle Identifier**: `com.thirdive.tanzago`
- **App Scheme**: `tanzago`
- **Platform Support**: iOS, Android, Web
- **Architecture**: New Architecture enabled

### API Configuration

- Base URL configured in `lib/api.ts`
- Axios interceptors for request/response handling
- JWT token management and refresh logic

## 📋 Development Guidelines

### Code Quality

- TypeScript strict mode enabled
- ESLint configuration for code consistency
- File-based routing with Expo Router
- Component-based architecture

### State Management

- Redux Toolkit for global state
- Custom hooks for specific functionality
- Local state for component-specific data

### Security

- Secure storage for sensitive data
- JWT token validation and expiry handling
- Screenshot prevention for sensitive screens

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software developed by 3rdive for the Tanza logistics platform.

## 📞 Support

For development support and questions:

- Repository: [tanza-rider](https://github.com/3rdive/tanza-rider)
- Owner: 3rdive
- Current Branch: main

---

**Tanza Go** - _Logistics Made Simple_ 🚀

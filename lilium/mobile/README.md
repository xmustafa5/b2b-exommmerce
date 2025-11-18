# Lilium Mobile

A React Native mobile application built with Expo and TypeScript.

## Tech Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform for React Native
- **TypeScript** - Type-safe development
- **Axios** - HTTP client
- **React Query** - Server state management
- **Zustand** - Client state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Async Storage** - Local data persistence

## Features

- Cross-platform (iOS & Android) support
- JWT-based authentication
- Persistent login state
- API integration with backend
- Form validation
- State management

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Expo CLI installed globally (optional)
- Expo Go app on your phone (for testing)
- Backend server running on port 3000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure API URL:
   - Open `src/services/api.ts`
   - Update the `API_BASE_URL` with your local IP address for testing on physical devices

### Development

Start the Expo development server:

```bash
npm start
```

This will open the Expo Dev Tools in your browser.

### Running the App

After starting the development server, you can run the app on:

- **iOS Simulator** (macOS only):
  ```bash
  npm run ios
  ```

- **Android Emulator**:
  ```bash
  npm run android
  ```

- **Physical Device**: Scan the QR code with:
  - iOS: Camera app or Expo Go
  - Android: Expo Go app

- **Web Browser** (experimental):
  ```bash
  npm run web
  ```

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device (macOS only)
- `npm run web` - Run in web browser

## Project Structure

```
mobile/
├── src/
│   ├── services/       # API services
│   │   └── api.ts      # Axios API client
│   ├── store/          # Zustand stores
│   │   └── auth.ts     # Authentication store
│   └── components/     # React Native components
├── assets/             # Images, fonts, and other assets
├── App.tsx            # Main application component
├── app.json          # Expo configuration
├── package.json      # Dependencies and scripts
└── tsconfig.json     # TypeScript configuration
```

## API Configuration

### For Development Testing

The API base URL needs to be configured differently depending on your testing environment:

1. **iOS Simulator**: Use `http://localhost:3000/api`
2. **Android Emulator**: Use `http://10.0.2.2:3000/api`
3. **Physical Device**: Use `http://YOUR_LOCAL_IP:3000/api`
   - Find your local IP:
     - macOS/Linux: `ifconfig | grep inet`
     - Windows: `ipconfig`

Update the `API_BASE_URL` in `src/services/api.ts` accordingly.

## State Management

- **Zustand** for global client state (authentication, user data)
- **React Query** for server state (API data caching)
- **AsyncStorage** for persistent storage

## Authentication Flow

1. User credentials are sent to the backend API
2. JWT token is received and stored in AsyncStorage
3. Token is automatically attached to subsequent API requests
4. Auth state is persisted across app restarts

## Building for Production

### iOS (requires macOS)
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## Environment Notes

- The app uses `__DEV__` to detect development mode
- API calls timeout after 10 seconds
- Token and user data persist across app restarts

## Troubleshooting

### Connection Issues
- Ensure backend is running on port 3000
- Check firewall settings
- Verify correct IP address in API configuration

### Android Emulator
- Use `http://10.0.2.2:3000` instead of localhost
- Enable network permissions in AndroidManifest.xml

### iOS Simulator
- localhost works directly
- For physical devices, use your machine's IP address
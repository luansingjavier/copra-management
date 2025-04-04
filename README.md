# Luansing Copra Management

A mobile application for managing copra business operations, built with Expo and React Native.

## Features

- User authentication and login
- Default values management for copra price and transportation fee
- Database management with Realm
- Settings management

## Database

The application uses Realm database for data persistence. Realm is a mobile database that is optimized for mobile applications with offline capabilities and synchronization options.

### Schema

- **User**: Stores user authentication information

  - username
  - password
  - createdAt

- **Setting**: Stores application settings
  - key
  - value

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/copra-management.git
   cd copra-management
   ```

2. Install dependencies

   ```bash
   yarn install
   ```

3. Start the application
   ```bash
   yarn start
   ```

## Default Users

The application comes with default users for testing:

- Username: luansingjavier / Password: thgirb11
- Username: admin / Password: admin123

## Development

### Reset Database

To reset the database to its default state:

1. Log in to the application
2. Navigate to the Settings tab
3. Tap "Reset Database"

This will clear all data and recreate the default users and settings.

## Built With

- [Expo](https://expo.dev/) - React Native framework
- [React Native](https://reactnative.dev/) - UI framework
- [Realm](https://realm.io/) - Database
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Expo Router](https://docs.expo.dev/router/introduction/) - Navigation and routing

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

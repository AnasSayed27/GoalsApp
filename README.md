# 🎯 Goals App

A powerful, gamified productivity application built with **React Native** and **Expo**. This app helps users track daily tasks, long-term goals, and build discipline through a unique streak system.

## ✨ Features

### 📝 Daily Tasks
- **Quick Add**: Easily add daily tasks with custom durations.
- **Progress Tracking**: Visual progress bar showing daily completion rate.
- **Smart Sorting**: Reorder tasks and move completed ones to the bottom.
- **Persistence**: Tasks are saved automatically and reset daily (logic can be extended).

### 🎯 Long-Term Goals
- **Goal Management**: Create goals with start/end dates.
- **Breakdown**: Divide goals into **Sub-goals** and **Weekly Tasks**.
- **Visual Progress**: Track progress for the main goal, sub-goals, and individual weeks.
- **Nested Logic**: Completing weekly tasks automatically updates the overall goal progress.

### 🔥 Streaks & Gamification (Monthly Discipline)
- **Heatmap**: GitHub-style contribution graph to visualize daily effort.
- **Tier System**: Dynamic ranking based on consistency and intensity (Titan, Warrior, Guardian, etc.).
- **Stats Dashboard**: View "Win Rate", "7-Day Trend", and "Average Intensity".
- **Log Hours**: Track hours spent on goals each day.

## 🛠 Tech Stack & Architecture

- **Framework**: React Native (Expo)
- **Routing**: Expo Router (File-based routing)
- **Storage**: `AsyncStorage` (Local persistence)
- **Icons**: Material Community Icons
- **UI Components**: `react-native-progress`, `react-native-calendars`

### 🏗 Architecture (Refactored)
The app follows a **Service-Hook-Component** pattern for robustness and maintainability:

1.  **Services** (`/services`):
    - `StorageService.js`: Centralized, safe wrapper for all database operations.
2.  **Hooks** (`/hooks`):
    - `useTasksData.js`: Manages daily task logic.
    - `useGoalsData.js`: Handles complex nested goal updates.
    - `useStreaksData.js`: Calculates gamification scores and stats.
3.  **Components** (`/components`):
    - Reusable UI elements (e.g., `TaskItem`, `TierCard`, `HeatmapGrid`) separated from business logic.

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- Expo Go app on your phone (or Android Emulator/iOS Simulator)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Sober-Human/GoalsApp.git
    cd GoalsApp
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the app**:
    ```bash
    npx expo start
    ```

4.  **Scan the QR code** with the Expo Go app (Android) or Camera (iOS).

## 📱 Building the APK (Android)

To generate a standalone APK file for installation:

1.  **Install EAS CLI**:
    ```bash
    npm install -g eas-cli
    ```

2.  **Login to Expo**:
    ```bash
    eas login
    ```

3.  **Build**:
    ```bash
    eas build -p android --profile preview
    ```

## 📂 Project Structure

```
/app
  /(tabs)          # Main tab screens (Tasks, Goals, Streaks, Settings)
  /_layout.js      # Main app navigation layout
/components        # Reusable UI components
/constants         # App-wide constants (Colors, StorageKeys)
/hooks             # Custom React hooks for business logic
/services          # Backend/Storage services
/assets            # Images and fonts
```

## 🤝 Contributing

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---
*Built with ❤️ by Anas Sayed*

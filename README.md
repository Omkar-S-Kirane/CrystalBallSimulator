# Crystal Ball Drop Simulator (React Native CLI + TypeScript)

This is a React Native CLI application written in TypeScript that simulates the **two-crystal ball (egg dropping) problem** using the optimal two-ball strategy.  
It includes both **step-by-step** and **auto-simulation** modes to visualize how the algorithm determines the breaking floor with minimal drops in the worst case.

---

## 📦 Prerequisites

Make sure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (>= 20, as defined in `package.json`)
- [Yarn](https://yarnpkg.com/) or npm
- [React Native CLI](https://reactnative.dev/docs/environment-setup)  
- Xcode (for iOS) or Android Studio (for Android)

---

## 🚀 Installation & Running

### 1. Clone the repository
```bash
git clone https://github.com/Omkar-S-Kirane/CrystalBallSimulator.git
cd CrystalBallSimulator

2. Install dependencies
# with yarn
yarn install

# or with npm
npm install

3. Start Metro bundler
yarn start
# or
npm run start

4. Run the app
On Android:
yarn android
# or
npm run android

On iOS:
yarn ios
# or
npm run ios

🧠 Algorithm Explanation

The app solves the two-crystal ball problem:

Given a building with n floors and 2 crystal balls that break if dropped from floor f or higher, find the smallest such f with the minimum number of drops in the worst case.

Strategy

Compute the smallest integer k such that:

k * (k + 1) / 2 >= n


This ensures that in the worst case, no more than k drops are required.

Drop the first ball at floors:

k, k + (k-1), k + (k-1) + (k-2), ...


until it breaks.

Once the first ball breaks at some floor, use the second ball to linearly scan floors between the last safe floor + 1 and the breaking floor.

Example

For n = 10, the optimal k = 4

First ball drop sequence: 4, 7, 9

If the first ball breaks at 7, scan floors 5, 6, 7 with the second ball

Worst-case drops = 4

🖥 Features

Input controls for total floors (n) and secret breaking floor (f)

Step-by-step mode → manually test each drop

Auto-simulation mode → runs the full algorithm with delays

Building visualization:

Highlight tested floors

Mark floors where balls break

Indicate current test floor

Displays:

Found breaking floor

Total number of drops

Secret floor (for validation)

⚙️ Scripts

Available via yarn or npm run:

start → Start Metro bundler

android → Build and run on Android emulator/device

ios → Build and run on iOS simulator/device

lint → Run ESLint checks

test → Run Jest tests
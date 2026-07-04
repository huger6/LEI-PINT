# mobile

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

## Steps to Build and Run

1. **Start the API server**:
   - Navigate to the `/api` folder.
   - Run the following command in a terminal:
     ```bash
     npm run dev
     ```

2. **Install Flutter dependencies**:
   - Open a terminal in the `mobile` folder.
   - Run the following command:
     ```bash
     flutter pub get
     ```

3. **Set up device connection**:
   - Ensure a device is connected and recognized by your system.
   - Run the following command to enable communication between the device and the API:
     ```bash
     adb reverse tcp:3000 tcp:3000
     ```

4. **Run the Flutter application**:
   - In the same terminal, run:
     ```bash
     flutter run
     ```
  - Use this command to filter useless debug prints (Windows only):
    ```bash
    flutter run | Select-String -Pattern "OpenGLRenderer|ViewRootImpl|SurfaceView" -NotMatch
    ```


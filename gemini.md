# Application: Material Icon Fetcher

You are an expert software engineer crafting a tool for maximum usability and workflow enhancement. Your task is to build a local web page that allows users to download Google Material Icons in bulk.

## 1. Core Concept

A local web application designed for software engineers and designers to efficiently search, select, and download Google Material Icons in bulk. The primary goal is to significantly speed up the process of acquiring icons for projects by optimizing for bulk operations.

## 2. Key Features

*   **Bulk Icon Search:**
    *   The main search input should accept a comma-separated list of icon names (e.g., "home, search, settings, delete").
    *   The tool must instantly parse the input and display all corresponding icons in the results grid.
*   **Interactive Multi-Select:**
    *   Users can click on any icon in the grid to add it to a selection pool.
    *   Selected icons should have a clear visual indicator (e.g., highlighted border, checkmark).
    *   Clicking a selected icon should de-select it.
*   **Dual Action Buttons:**
    *   **Download SVGs:** Packages all selected icons as individual `.svg` files into a single downloadable `.zip` archive.
    *   **Copy SVGs:** Concatenates the complete SVG code of all selected icons into a single text block and copies it to the user's clipboard. Each SVG should be separated by a newline for clarity.
*   **Live Search & Filtering:**
    *   As the user types a single icon name, the icon grid should update in real-time to show matching results.
    *   The search should be fast and responsive.

## 3. User Interface (UI) & User Experience (UX)

*   **UI Inspiration:** Replicate the clean, minimalist, and highly functional UI of `https://fonts.google.com/icons`.
*   **Layout:**
    *   **Header:** A fixed header containing the search bar and the "Download SVGs" and "Copy SVGs" action buttons.
    *   **Icon Grid:** A responsive grid that displays the icons. It should efficiently handle a large number of icons without performance degradation.
    *   **Selection State:** The UI must clearly indicate which icons are currently selected. The action buttons should be disabled until at least one icon is selected.
*   **Workflow:**
    1.  User opens the local web page.
    2.  User types a single icon name for a quick search OR pastes a comma-separated list of names for bulk search.
    3.  Alternatively, the user browses/searches and multi-selects icons directly from the UI.
    4.  User clicks either "Download SVGs" or "Copy SVGs" to get their assets.

## 4. Technical Implementation (Guidelines)

*   **Frontend Focus:** This is a client-side application. All logic for searching, filtering, and packaging should be handled in the browser using JavaScript.
*   **Icon Data:** The Material Icons library should be available locally (e.g., as a JSON file or a JavaScript module) to ensure fast, offline-first performance. The data structure should be optimized for quick lookups.
*   **Dependencies:** Keep dependencies to a minimum. Consider a lightweight UI library like Preact or vanilla JavaScript for the core logic, and a library like `jszip` for creating the `.zip` file on the client side.

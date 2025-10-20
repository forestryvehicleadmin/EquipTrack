# **App Name**: EquipTrack

## Core Features:

- Inventory Display: Displays inventory items in a categorized, scrollable list with item names, quantities, and condition stats.
- Filtering: Allows users to filter inventory items by name, category, location, and condition.
- Item Editing: Enables users to modify item details, quantities, and conditions via a modal.
- Data Persistence: Saves any edits done to the inventory to Firestore
- Automated Category Suggestions: When the user edits an item's data in the modal, use an LLM tool to predict the optimal category for the inventory item.

## Style Guidelines:

- Primary color: Soft moss green (#A8CFA1) to evoke a sense of calm and reliability.
- Background color: Light beige (#F2F1E9), close in hue to the primary, but very desaturated, to give the interface a clean, neutral background.
- Accent color: Dusty rose (#C4A4A4) to highlight interactive elements and call attention to important actions, creating contrast.
- Font: Use 'Inter' for both body and headline text; sans-serif with a modern, objective, neutral look; suitable for user interfaces.
- Use simple, clear icons from a consistent set (e.g., Material Design Icons) to represent item categories and actions.
- Cards should be well-spaced, with clear visual separation between items and categories, and sections in the modals.
- Use subtle transitions for modal appearances and data updates to provide visual feedback without being distracting.
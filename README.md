Here is a concise English version of the README:

🎮 2D Team Lineup Editor
A React & TypeScript interactive editor for building and previewing team rosters with data-driven logic and seamless UI.

🚀 Key Features
1. Dynamic Lineup System
Auto-Initialization: Detects images in assets/players/ and creates matching slots.

Empty Slot Visualization: Displays "Empty Capsule" dash-borders for vacant positions.

Grid Sync: Real-time control over columns, gaps, and scaling via EditorContext.

2. Smart Bench Management
Auto-Fill: Click a player on the bench to fill the first available slot.

Availability Tracking: Selected players are grayed out and disabled to prevent duplicates.

Aspect Ratio Preservation: Optimized for rectangular player cards to ensure zero distortion.

3. Advanced UX & Interactions
Context Menu: Right-click any rostered player to access the "Remove" option.

Scroll & Focus Control:

Locks background scrolling when popups are active.

Prevents layout jumping using scrollbar-gutter technology.

Auto-focuses popups with click-away-to-close functionality.

4. Export Tools
High-Res Export: Save the finalized lineup as a PNG image.

Live Tuning: Instant updates for background, cell size, and spacing.

🛠 Tech Stack
Core: React (Hooks) & TypeScript

State: Multi-Context architecture (Editor & Team)

Layout: CSS Grid, Flexbox, and react-rnd

📖 Quick Start
Select: Click a player from the Available Players section.

Remove: Right-click a player in the Lineup area and select Remove.

Adjust: Use the toolbar to tweak the layout and spacing.

Export: Click the export button to download the final image.
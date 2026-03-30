# Design: Gas Pump Simulator

## System
- React frontend for the game loop and UI.
- Node/Express backend only if needed for AI-generated customer scenarios.
- Main simulation runs entirely client-side.

## Gameplay
1. Customer arrives with a target order.
2. Player starts/stops pumping, selects grade, and manages timing.
3. Overshooting fuel or taking too long hurts score.
4. Queue pressure increases difficulty.
5. Run ends with score and station performance summary.

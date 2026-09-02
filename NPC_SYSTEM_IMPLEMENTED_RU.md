# NPC System — implemented foundation

- Groups store one logical state (`count`, center, target, state, seed) instead of one database record per NPC.
- Visual representatives are created only near the player and capped at 48.
- Group AI ticks at 5 Hz; visual movement interpolates every frame.
- Population can exist as statistics without physical NPC objects.
- No NPC movement writes to the database in offline mode.
- Offline battle checkpoint storage is prepared via localStorage; multiplayer authority is intentionally not implemented yet.

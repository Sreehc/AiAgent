export const OPEN_COMMAND_PALETTE_EVENT = "aiagent.command-palette.open";

export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT));
}

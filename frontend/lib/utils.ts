// Minimal class-name merge helper (replaces the Vite project's `cn`).
// Install `clsx` + `tailwind-merge` for the full version, or keep this.

export function cn(
  ...inputs: Array<string | false | null | undefined>
): string {
  return inputs.filter(Boolean).join(" ");
}

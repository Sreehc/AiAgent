import { cn } from "@/lib/utils";

type AppBrandMarkProps = {
  className?: string;
};

export function AppBrandMark({ className }: AppBrandMarkProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
      className={cn("app-brand__mark", className)}
    >
      <rect x="0" y="0" width="40" height="40" rx="12" fill="currentColor" />
      <circle cx="20" cy="20" r="13.5" fill="#111318" />
      <path d="M20 7.5C23.9 9.4 26.5 11.9 28.4 15.8C24.8 15 21.6 14.5 18 14.9C18.9 11.8 19.2 10.3 20 7.5Z" fill="#22D3EE" />
      <path d="M32.5 20C30.6 23.9 28.1 26.5 24.2 28.4C25 24.8 25.5 21.6 25.1 18C28.2 18.9 29.7 19.2 32.5 20Z" fill="#5EEAD4" />
      <path d="M20 32.5C16.1 30.6 13.5 28.1 11.6 24.2C15.2 25 18.4 25.5 22 25.1C21.1 28.2 20.8 29.7 20 32.5Z" fill="#67E8F9" />
      <path d="M7.5 20C9.4 16.1 11.9 13.5 15.8 11.6C15 15.2 14.5 18.4 14.9 22C11.8 21.1 10.3 20.8 7.5 20Z" fill="#0891B2" />
      <circle cx="20" cy="20" r="3.8" fill="#F8FAFC" />
      <circle cx="20" cy="20" r="1.5" fill="#111318" />
    </svg>
  );
}

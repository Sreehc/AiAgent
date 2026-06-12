type MobileNavProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  if (!isOpen) return null;
  return <button type="button" className="mobile-nav-backdrop" aria-label="关闭主导航" onClick={onClose} />;
}

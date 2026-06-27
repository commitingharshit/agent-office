import { clsx } from 'clsx';
// Simple class name merger using clsx only
// Removed tailwind-merge to save ~69KB in bundle
export function cn(...inputs) {
    return clsx(inputs);
}
//# sourceMappingURL=utils.js.map
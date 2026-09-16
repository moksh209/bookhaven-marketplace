// Legacy helper — used by components that don't yet use CurrencyContext.
// New components should use formatPrice() from useCurrency() instead.
export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getConditionBadge(condition) {
  switch (condition) {
    case 'New':
      return {
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        dot: 'bg-emerald-500',
        label: 'Brand New',
        desc: 'Unread, untouched copy in mint condition'
      };
    case 'Like New':
      return {
        bg: 'bg-blue-50 border-blue-200 text-blue-800',
        dot: 'bg-blue-500',
        label: 'Like New',
        desc: 'Appears unread, pristine cover with sharp corners'
      };
    case 'Good':
      return {
        bg: 'bg-amber-50 border-amber-200 text-amber-800',
        dot: 'bg-amber-500',
        label: 'Good Condition',
        desc: 'Clean copy, pages fully intact, minor spine crease'
      };
    case 'Acceptable':
      return {
        bg: 'bg-stone-100 border-stone-300 text-stone-700',
        dot: 'bg-stone-500',
        label: 'Acceptable',
        desc: 'Readable study copy, may have notes/highlighter'
      };
    default:
      return {
        bg: 'bg-stone-100 border-stone-200 text-stone-700',
        dot: 'bg-stone-400',
        label: condition || 'Used',
        desc: 'Pre-owned book'
      };
  }
}

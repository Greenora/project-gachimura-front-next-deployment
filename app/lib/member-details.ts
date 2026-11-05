export function normalizeMemberPhone(value: string): string | null {
  const phone = value.replace(/[\s-]/g, "");
  return /^0\d{8,10}$/.test(phone) ? phone : null;
}

export function isMemberBirthdate(value: string, today = new Date().toISOString().slice(0, 10)): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1000-01-01" || value > today) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function normalizeMemberBirthdate(value: string, today = new Date().toISOString().slice(0, 10)): string | null {
  const trimmed = value.trim();
  const date = /^\d{8}$/.test(trimmed)
    ? `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6)}`
    : trimmed;
  return isMemberBirthdate(date, today) ? date : null;
}

export function normalizeMemberPhone(value: string): string | null {
  const phone = value.replace(/[\s-]/g, "");
  return /^0\d{8,10}$/.test(phone) ? phone : null;
}

export function isMemberBirthdate(value: string, today = new Date().toISOString().slice(0, 10)): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1000-01-01" || value > today) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

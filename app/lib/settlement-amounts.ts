interface AllocationItem {
  price: number;
  quantity: number;
  members?: { userId: number }[];
}

export function formatSettlementMoney(amount: number, language: "korean" | "japanese"): string {
  return new Intl.NumberFormat(language === "japanese" ? "ja-JP" : "ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getSettlementAmounts(items: readonly AllocationItem[]): Record<number, number> {
  const amounts: Record<number, number> = {};
  for (const item of items) {
    const userIds = (item.members || []).map(member => member.userId).sort((a, b) => a - b);
    if (!userIds.length) continue;
    const total = item.price * item.quantity;
    const share = Math.floor(total / userIds.length);
    const remainder = total % userIds.length;
    userIds.forEach((userId, index) => {
      amounts[userId] = (amounts[userId] || 0) + share + (index < remainder ? 1 : 0);
    });
  }
  return amounts;
}

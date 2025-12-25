import type {
  CostEstimate,
  CostCategory,
  CostLineItem,
  UICostEstimate,
  UICostCategory,
  UICostLineItem
} from '@/types/cost';

export function toUICostEstimate(
  estimate: CostEstimate,
  currency: 'INR' | 'USD'
): UICostEstimate {
  const categories: UICostCategory[] = Object.entries(estimate.breakdown).map(
    ([key, category]) => ({
      id: key,
      name: category.name,
      amount: category.amount[currency],
      itemCount: category.items.length,
      items: category.items.map(
        (item): UICostLineItem => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice[currency],
          total: item.totalPrice[currency],
          recommended: !item.isUserModified && item.confidence > 0.8
        })
      )
    })
  );

  const subtotal = categories.reduce((sum, c) => sum + c.amount, 0);

  return {
    subtotal,
    tax: estimate.breakdown.tax.amount[currency],
    total: estimate.totalCost[currency],
    pricePerSqFt: estimate.costPerSqFt[currency],
    categories
  };
}

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/** Formatea un número como precio en ARS: 198500 -> "$198.500" */
export function formatPrice(amount: number): string {
  return currencyFormatter.format(amount);
}

import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function ProductPrice({ product, className = "" }: { product: Product; className?: string }) {
  const list = product.listPrice ?? product.price;
  const sale = product.salePrice;
  const onSale = sale != null && sale > 0 && sale < list;
  const savings = onSale ? list - sale : 0;

  if (!onSale) {
    return <p className={className}>{formatPrice(product.price)}</p>;
  }

  return (
    <div className={className}>
      <p className="flex items-baseline gap-2">
        <span className="text-muted line-through font-mono text-sm">{formatPrice(list)}</span>
        <span className="font-mono">{formatPrice(sale)}</span>
      </p>
      <p className="text-[10px] tracking-wider text-accent-secondary font-mono mt-1">SAVE {formatPrice(savings)}</p>
    </div>
  );
}

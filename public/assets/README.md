# Brand assets

Drop files here so the storefront can use them without a redesign.

```
public/assets/
  logo.png                 # Primary logo (already in use)
  brand/                   # Extra brand graphics, wordmarks, textures
  promo/                   # Homepage / seasonal promotional graphics
  products/
    placeholder.svg
    {SKU}/
      01.jpg               # Front
      02.jpg               # Side / back
      03.jpg               # Detail / tags / condition
```

Then update the `images` array on each product in `src/data/products.ts`:

```
images: [
  "/assets/products/RS-NIKE-001/01.jpg",
  "/assets/products/RS-NIKE-001/02.jpg",
]
```

Do not replace `logo.png` with a generated mark. The live site uses this file.

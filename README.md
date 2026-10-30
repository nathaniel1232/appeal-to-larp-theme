# An Appeal to LARP · Shopify theme

A clean, white Online Store 2.0 theme for a t-shirt store. Pine tree, sun and sea.

## Connect it to your store

1. Shopify admin → **Online Store → Themes**.
2. **Add theme → Connect from GitHub**, log in to GitHub and pick this repo and the `main` branch.
3. The theme shows up in your theme library. Click **Customize** to add images, then **Publish**.

Every push to `main` syncs to the store automatically, and edits made in the theme editor are committed back to GitHub.

## Set up the store

- **Products:** add tees with options named `Color` and `Size`. Colors White, Black and Sand get matching swatches (Pine, Navy, Grey, Cream and a few more work too). Tag a product `new` to show a "New" badge. Add a second photo to get the hover image swap on product cards.
- **Home page tees:** in the theme editor, pick a collection in the "Featured products" section. If you leave it empty, all products are shown.
- **Menus:** Online Store → Navigation. The header uses `main-menu` (for example Shop, About), and the footer uses `footer`.
- **About page:** create a page called "About" and set its template to `page.about`.
- **Free shipping bar:** Theme settings → Store info sets the amount the cart bar counts towards. Set up the real free-shipping rate in Settings → Shipping and delivery to match.

## Where your images go

| Section | Image slots |
| --- | --- |
| Hero | 1 portrait image |
| Pinterest board | 8 images (add up to 24), each with Auto / Tall / Portrait / Square shape |
| Image with text | 1 portrait image |
| About intro | 1 wide image, plus a 6-image Pinterest board |

Empty slots show a light placeholder with the pine tree until you add an image.

## Files

- `layout/theme.liquid`: page shell, fonts, cart drawer
- `sections/`: all editable sections (hero, featured products, Pinterest board, image with text, email signup, product, collection, cart and more)
- `snippets/product-card.liquid`: product card with quick add by size
- `assets/base.css`, `assets/theme.js`: styles, the AJAX cart drawer, the variant picker and the sticky add-to-cart bar

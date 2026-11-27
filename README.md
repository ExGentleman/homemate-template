# Homemate Storefront

Homemate is a vanilla JavaScript storefront backed by Supabase Auth, Postgres, and Storage.

## Run

Install dependencies once:

```powershell
npm.cmd install
```

Create a Supabase project, then copy `.env.example` to `.env.local` and fill in the project URL and publishable key from **Supabase → Project Settings → API**:

```powershell
Copy-Item .env.example .env.local
```

Never put a `service_role` key in this app or in `.env.local`.

Apply `supabase/migrations/202611240001_initial_store_backend.sql`, `supabase/migrations/202611250001_admin_dashboard_stats.sql`, `supabase/migrations/202611250002_butchery_equipment_category.sql`, `supabase/migrations/202611250003_product_specifications_and_image_gallery.sql`, `supabase/migrations/202611250004_business_customer_accounts.sql`, and `supabase/migrations/202611250005_kitchenware_category.sql` in the Supabase SQL Editor, in that order. The migrations create the core tables and policies, enable live dashboard statistics and the Butchery Equipment and Kitchenware categories, add product specifications and multi-image galleries while preserving existing data, and add Individual/Business customer profile fields. Reapply the migrations in order to any existing Supabase project before using the updated catalog/admin form.

The admin overview reads product, customer, order, pending WhatsApp follow-up, and uncancelled order-value totals from `admin_dashboard_stats()`. Order value is not revenue because payment is confirmed in WhatsApp, not by the website. Apply the second migration to the connected Supabase project to enable these live stats.

In Supabase Authentication settings, set the Site URL to `http://localhost:3000` and add `http://localhost:3000/**` as a redirect URL. Then start the app:

```powershell
npm.cmd run dev
```

Open:

```text
http://localhost:3000
```

## File Structure

```text
.
├── index.html                 # App entry HTML
├── package.json               # Project scripts
├── public/                    # Storefront and product images
├── src/
│   ├── main.js                # Router and event wiring
│   ├── styles.css             # Global layout and responsive styling
│   ├── components/
│   │   ├── layout/            # Navbar, footer, layout shell
│   │   └── ui/                # Reusable interface pieces
│   ├── data/                  # Supabase catalog and order operations
│   ├── lib/                   # Supabase client
│   ├── pages/                 # Home, products, cart, placeholders
│   └── stores/                # Auth state; cart and wishlist remain browser-local
├── supabase/
│   └── migrations/            # Database schema and row-level security
├── Cart.jsx                   # Original recovered cart component
├── components/                # Original recovered JSX fragments
├── React App.html             # Original saved browser page
└── React App_files/           # Original saved page assets and bundle
```

The `src` folder is the maintained application. The original recovered files are left at the root for comparison while the restored app uses the clean `src` and `public` structure.

Customers sign up and sign in through Supabase Auth. Profiles and roles are stored in Supabase; new accounts always receive the `customer` role. To grant admin access, first have that person create and confirm their account, then run this in the Supabase SQL Editor, replacing the email:

```sql
update public.profiles
set role = 'admin'
where lower(email) = lower('admin@example.com');
```

Repeat for each administrator, then have them sign out and sign back in to refresh their role. Role changes are intentionally not available to the browser client; no shared admin key is used. Admins can add, edit, and remove computers, smartphones, butchery equipment, and kitchenware at `/admin`. The inventory edit button updates a product's name, specifications, price, and images. The Customers section lists individual and business accounts, contact details, account creation dates, and order counts, and supports searching the directory. Butchery products need their own uploaded or provided image. Product records are stored in Postgres, and uploaded product images are stored in the public `product-images` bucket. Public storefront reads are allowed, while product writes and image uploads require the admin role.

The admin product form accepts multiple JPG, PNG, and WebP images, or multiple image URLs/local paths (one per line). Images are resized and compressed in the browser before being uploaded to Supabase Storage; the first image is the product card's main photo. Product specifications are entered as a paragraph and shown on the product detail page.

Customer registration supports Individual and Business accounts. Individual accounts require first name, last name, email, and contact number. Business accounts require business name, business email, and business contact number; they do not require individual names. Existing profiles remain Individual by default. Customers can update these details from My Profile, and business name/contact details are included in WhatsApp order handoff and admin order records. Apply `202611250004_business_customer_accounts.sql` after the previous migrations to enable the profile fields.

Signed-in customers can select EcoCash, InnBucks, or bank card at checkout. The backend verifies current product prices and stock and saves an order with a unique reference before opening the prefilled WhatsApp message to `+263 775 072 639`. Customers must review and send the message; availability and payment instructions are confirmed in the conversation. The site does not process payments. Orders can be read by their owner and admins.

The About Us page at `/about-us` describes Homemate's mission, vision, product ranges, service benefits, and promise. Customers can sign in to their dashboard at `/dashboard`, where they can access their cart, wishlist, and profile. Profile details and passwords are managed through Supabase Auth and Postgres. Cart and wishlist contents remain in the current browser for now. Accounts and passwords previously stored in local storage are not migrated; users must register again in Supabase. Run `npm.cmd run build` to validate the production bundle. If port 3000 is already in use, stop the old development server before starting Vite.

# Supreme Detailing Premium Booking Website

This redesigned version includes two connected experiences:

- **Customer side:** packages, complete checkout-style booking form, selected-service bill, confirmation ID, and booking status tracking.
- **Service ordering page:** 12 services across exterior, interior, and protection categories; multi-service selection; quantities; itemized bill; and a live estimated total.
- **Admin side:** PIN login, booking dashboard, search/filter, customer details, confirmation, decline, completion, and notes visible to the customer.

The visual system now includes original cinematic automotive imagery, animated page reveals, parallax movement, magnetic buttons, card tilt, a moving service marquee, loading sequence, live scroll progress, responsive layouts, and a fully redesigned dark admin control room.

## Open the website

Open `index.html` in a web browser. The site does not need a build step.

## Admin access

Select **Admin** in the top navigation.

- Demo PIN: `1234`

Change `ADMIN_PIN` near the top of `script.js` before sharing a demo publicly.

## Important production note

This is a working front-end prototype. Booking records are stored in the browser on the current device. That makes it easy to demonstrate the complete customer/admin workflow, but bookings will not yet sync between a customer's phone and the admin's device.

Before launching publicly, connect the site to a hosted database and secure server-side admin login (for example, Supabase, Firebase, or a custom backend). Replace the demo PIN with proper authentication. The current interface and booking workflow are ready for that connection.

## Main files

- `index.html` — customer website and admin dashboard
- `services.html` — separate service menu and order builder
- `style.css` — full desktop/mobile design
- `script.js` — booking, tracking, and admin workflow
- `services.css` / `services.js` — service catalog, cart, quantities, and live bill
- `assets/` — original Supreme Detailing images and logo

The three `-v2.png` files in `assets/` are original AI-generated campaign images created specifically for this redesign.

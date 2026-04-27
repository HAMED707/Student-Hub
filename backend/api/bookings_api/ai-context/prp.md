# Product Requirements Prompt — Bookings
> The full picture of what the bookings app does, who uses it, and what can go wrong.

---

## Features

- Student can submit a booking request for a property
- Student can cancel their own booking (pending or approved)
- Student can see all their own booking requests and their status
- Landlord can see all incoming booking requests for their properties
- Landlord can approve or reject a pending booking
- Landlord can mark an approved booking as completed
- Property status automatically changes when a booking is approved or cancelled

---

## User Flow

### Student books a property
1. Student opens a property detail page
2. Student fills in move-in date, duration in months, and an optional message
3. Student submits the form → `POST /api/bookings/`
4. Booking is created with status `pending`
5. Student sees the booking appear in their bookings list with status `pending`

### Landlord responds to a booking request
1. Landlord opens their dashboard → booking requests tab
2. Landlord sees all incoming requests with tenant info and property
3. Landlord approves → `PATCH /api/bookings/<id>/status/` with `approved`
4. Property status automatically changes to `rented`
5. Landlord rejects → same endpoint with `rejected`
6. Property status reverts to `available`

### Student cancels a booking
1. Student opens their bookings list
2. Student cancels a pending or approved booking → `PATCH /api/bookings/<id>/status/` with `cancelled`
3. Property status reverts to `available`

### Landlord marks a booking as completed
1. Tenant has moved out
2. Landlord marks the booking → `PATCH /api/bookings/<id>/status/` with `completed`

---


## Edge Cases

- Student cannot book a property that is not `available`
- Student cannot book with duration outside property min/max stay
- Student cannot have two active bookings for the same property
- Landlord cannot act on bookings for properties they don't own
- Student cannot approve or reject — only cancel
- Landlord cannot cancel — only approve, reject, or complete

---

## Performance Requirements

> To be filled in before deployment.
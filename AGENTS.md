
# Development Rules

## Source of Truth

The `docs/` directory is the official source of truth for the product.

Before implementing any feature:

1. Read the relevant documentation.
2. Follow the documented architecture.
3. Do not invent undocumented behavior.
4. Do not silently change product decisions.
5. Do not modify security rules without explicit justification and documentation.

## Naming Convention

All identifiers must be concise, semantic, conventional, consistent, readable, and immediately understandable.

This rule applies to:

- files;
- folders;
- classes;
- components;
- functions;
- variables;
- constants;
- hooks;
- interfaces;
- types;
- IDs;
- CSS classes;
- routes;
- API endpoints;
- database tables;
- database columns;
- enums;
- events;
- state names;
- test names.

Never use:

- random identifiers;
- hashes;
- obfuscated names;
- generated-looking names;
- meaningless names;
- arbitrary numeric suffixes;
- excessive abbreviations;
- names such as `temp`, `thing`, `data2`, `final`, `new`, `old`, `v2` without a legitimate technical reason.

Bad examples:

- `class-10-width2-o0-lkjh-0909`
- `x7a92`
- `componentFinalV2`
- `dataNew`
- `thing2`
- `randomHelper`

Good examples:

- `AppointmentCard`
- `ProfessionalCard`
- `BookingForm`
- `AdminCalendar`
- `appointmentDate`
- `selectedProfessional`
- `availableSlots`
- `booking-form`
- `appointment-details`

Prefer names based on meaning and responsibility.

Do not name elements exclusively by visual properties when semantic naming is possible.

Prefer:

- `primary-button`
- `booking-card`
- `appointment-details`

instead of:

- `blue-button`
- `purple-card`
- `large-section`

Follow the standard naming conventions of the language and framework.

Clarity and maintainability have priority over extreme brevity.

## Architecture

Do not introduce unnecessary dependencies.

Do not duplicate existing abstractions.

Do not create speculative infrastructure.

Keep responsibilities separated.

Frontend restrictions are not security.

Security-sensitive rules must be enforced by trusted backend/database layers.

## Security

Never place secrets in source code.

Never expose backend secrets to the client.

Never rely exclusively on frontend authorization.

Never bypass documented authorization rules.

The following rule is mandatory:

All admins can view the global agenda.

Only the admin associated with the professional responsible for an appointment can modify, cancel, delete, or otherwise change that appointment.

Example:

Ana 1 can modify Ana 1 appointments.

Ana 1 cannot modify Ana 2 appointments.

Ana 2 can modify Ana 2 appointments.

Ana 2 cannot modify Ana 1 appointments.

This rule must be enforced by trusted backend/database authorization.

## Development Process

Work incrementally.

Implement only the requested phase.

Do not silently continue into future phases.

Before changing code:

- inspect existing implementation;
- inspect relevant documentation;
- identify dependencies;
- explain significant architectural implications.

After implementation:

- run relevant tests;
- run lint/format checks;
- run build checks when applicable;
- inspect changed files;
- verify naming;
- verify no secrets were introduced;
- verify unrelated files were not modified.

## Code Quality

Prefer:

- simple implementations;
- explicit naming;
- small focused functions;
- reusable components when justified;
- predictable structure;
- strong typing;
- clear error handling.

Avoid:

- unnecessary abstraction;
- duplicated logic;
- magic values;
- giant components;
- giant functions;
- unclear state;
- hidden side effects.

## Documentation

When implementation changes an architectural decision, document the change.

Do not modify documentation merely to justify incorrect implementation.

If documentation and implementation conflict, stop and report the conflict.

## Testing

Every implemented feature must have appropriate validation.

Critical security and business rules require negative tests.

At minimum, authorization must be tested against:

- authorized admin;
- unauthorized admin;
- client;
- unauthenticated user.

## Final Rule

When uncertain, prefer:

1. documented behavior;
2. official framework/platform documentation;
3. simple maintainable implementation;
4. explicit reporting of ambiguity.

Never invent behavior merely to make a task appear complete.


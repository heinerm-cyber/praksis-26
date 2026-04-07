---
applyTo: "apps/web/**/*.{ts,tsx,css}"
---

# React + TypeScript Style Guide

## Component Rules
- Use function components and typed props.
- Keep components focused; move business logic into feature services/hooks.
- Prefer server-safe patterns in Next.js app router.

## State and Data
- Keep API calls in a dedicated service layer.
- Validate user input before API submission.
- Show explicit UI state for loading, success, error, and fallback-mode warnings.

## Accessibility
- Every input needs an associated label.
- Buttons must have meaningful text.
- Preserve keyboard navigation and visible focus styles.

## Language
- User-facing web text must be written in Norwegian (Bokmal).
- Use proper Norwegian characters in UI copy where relevant: ae, oe, and aa must be written as æ, ø, and å.

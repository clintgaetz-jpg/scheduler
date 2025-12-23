# Splitting Feature - Implementation Notes

## Overview
The splitting feature allows splitting service lines from an appointment across different technicians, dates, or sending specific work to hold while keeping other work scheduled.

## Current State
- **Status**: Placeholder implementation (marked as "Phase 6")
- **Location**: `src/components/AppointmentDetail/modals/SplitModal.jsx`
- **UI**: Basic modal structure exists but functionality is disabled

## Data Structure
Service lines already support individual assignment via:
- `tech_id`: `null` = use appointment's tech, or specific tech ID
- `scheduled_date`: `null` = use appointment's date, or specific date

From `BookingModal.jsx` (lines 352-354):
```javascript
// === ASSIGNMENT (for splitting) ===
tech_id: null,       // null = use appointment's tech
scheduled_date: null, // null = use appointment's date
```

## UI Requirements (from SplitModal.jsx)
1. **Select lines to split**: Checkbox list of all service lines
2. **Show line details**: Title, hours, total, status
3. **Split options**:
   - Assign to different technician
   - Assign to different date
   - Send to hold
   - Keep with original appointment

## Split Logic (from useAvailability.js)
The `findSplitOption` function shows how split suggestions work:
- Groups services by category
- Finds best tech for each category
- Considers tech availability and capabilities
- Returns assignments array: `[{ tech, category, services, hours }]`

## Implementation Notes

### What Needs to Be Built
1. **Split Modal UI**:
   - Enable checkboxes for line selection
   - Add assignment controls (tech dropdown, date picker, hold option)
   - Show preview of split assignments
   - Validation (at least one line must stay with original)

2. **Split Handler** (`onSplit` callback):
   - Takes selected lines and their new assignments
   - Updates line `tech_id` and `scheduled_date` fields
   - If sending to hold: set `is_on_hold: true` on those lines
   - Save updated appointment

3. **Display Split Lines**:
   - Lines with different tech/date should show badges (already implemented in ServiceLine.jsx)
   - Badge shows: tech short name and date if different from appointment

### Current Support
- ✅ Individual line assignment (tech_id, scheduled_date) already works
- ✅ Badge display for different assignments (purple badge with tech/date)
- ✅ Date picker for lines with different tech
- ✅ Clear assignment button

### Missing
- ❌ Split modal UI (currently placeholder)
- ❌ Bulk assignment interface
- ❌ Split validation logic
- ❌ Hold queue integration for split lines

## Related Code Locations
- `src/components/AppointmentDetail/modals/SplitModal.jsx` - Main modal (placeholder)
- `src/components/AppointmentDetail/main/ServiceLine.jsx` - Individual line display with assignment
- `src/components/AppointmentDetail/main/ServiceLines.jsx` - Line list container
- `src/hooks/useAvailability.js` - Split suggestion logic (lines 319-374)
- `src/components/booking/BookingModal.jsx` - Line structure with assignment fields (lines 352-354)

## TODO Items
1. Implement split modal UI with:
   - Line selection checkboxes
   - Assignment controls (tech, date, hold)
   - Preview of split result
   - Validation

2. Implement split handler:
   - Update selected lines with new assignments
   - Handle hold queue placement
   - Save changes

3. Add split indicators:
   - Visual distinction for split appointments
   - Summary view of split assignments

4. Integration:
   - Connect to hold queue
   - Update calendar display for split lines
   - Handle split appointments in drag & drop


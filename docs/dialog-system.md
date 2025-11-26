# Dialog Size System - Developer Guide

## Overview

All dialog components in the DataRoom application now use a standardized sizing system implemented in the base `Dialog` component.

## Using Dialog Sizes

### Available Sizes

```typescript
type DialogSize = "xs" | "sm" | "md" | "lg" | "xl";
```

| Size | Max Width | Use Case | Example |
|------|-----------|----------|---------|
| `xs` | 400px | Confirmations, simple alerts | Delete confirmation |
| `sm` | 500px | Small forms (2-3 fields) | Create Folder |
| `md` | 600px | Medium forms (4-6 fields) | Create Data Room |
| `lg` | 700px | Large forms, wizards | Create Link (3-step wizard) |
| `xl` | 800px | Extra large content | Complex forms, data viewers |

### Basic Usage

```tsx
import { Dialog, DialogContent } from "@/components/ui/dialog";

function MyDialog() {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent size="md">
        {/* Your dialog content */}
      </DialogContent>
    </Dialog>
  );
}
```

### Default Size

If no `size` prop is provided, dialogs default to `"md"` (600px).

## Multi-Step Wizard Pattern

For complex forms with many fields, use the multi-step wizard pattern as implemented in `CreateLinkDialog`.

### Key Features

1. **Progress Indicator**: Visual progress bar showing current step
2. **Step Validation**: Validate each step before allowing navigation
3. **State Preservation**: Form data persists when navigating between steps
4. **Back Navigation**: Users can go back to review/edit previous steps

### Implementation Example

```tsx
const [currentStep, setCurrentStep] = useState(1);

// Validation functions for each step
const validateStep1 = () => { /* ... */ };
const validateStep2 = () => { /* ... */ };

// Navigation handlers
const handleNext = () => {
  if (currentStep === 1 && validateStep1()) {
    setCurrentStep(2);
  } else if (currentStep === 2 && validateStep2()) {
    setCurrentStep(3);
  }
};

const handleBack = () => {
  if (currentStep > 1) {
    setCurrentStep(currentStep - 1);
  }
};

return (
  <DialogContent size="lg">
    {/* Progress Indicator */}
    <div className="flex gap-2 mb-4">
      <div className={`flex-1 h-1.5 rounded-full ${currentStep >= 1 ? "bg-primary" : "bg-slate-200"}`} />
      <div className={`flex-1 h-1.5 rounded-full ${currentStep >= 2 ? "bg-primary" : "bg-slate-200"}`} />
      <div className={`flex-1 h-1.5 rounded-full ${currentStep >= 3 ? "bg-primary" : "bg-slate-200"}`} />
    </div>

    {/* Step Content */}
    {currentStep === 1 && <Step1Content />}
    {currentStep === 2 && <Step2Content />}
    {currentStep === 3 && <Step3Content />}

    {/* Navigation Buttons */}
    <DialogFooter>
      {currentStep > 1 && (
        <Button type="button" variant="outline" onClick={handleBack}>
          Back
        </Button>
      )}
      {currentStep < 3 ? (
        <Button type="button" onClick={handleNext}>
          Next
        </Button>
      ) : (
        <Button type="button" onClick={handleSubmit}>
          Submit
        </Button>
      )}
    </DialogFooter>
  </DialogContent>
);
```

## Important Notes

### Button Types

⚠️ **Critical**: When using navigation buttons in a wizard, always use `type="button"` to prevent form submission:

```tsx
// ✅ Correct
<Button type="button" onClick={handleNext}>Next</Button>

// ❌ Wrong - will trigger form submission
<Button type="submit" onClick={handleNext}>Next</Button>
```

### Automatic Features

All dialogs automatically have:
- ✅ Centered positioning (`top-[50%] left-[50%] translate`)
- ✅ Maximum height constraint (`max-h-[85vh]`)
- ✅ Vertical scrolling when needed (`overflow-y-auto`)
- ✅ Responsive mobile sizing (`max-w-[calc(100%-2rem)]`)
- ✅ Smooth animations (fade + zoom)

### Reset on Close

Always reset your dialog state when closing:

```tsx
const handleClose = () => {
  setFormData(initialState);
  setCurrentStep(1);
  setErrors({});
  onOpenChange(false);
};
```

## Migration Guide

### Before

```tsx
<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
```

### After

```tsx
<DialogContent size="md">
```

## Examples in Codebase

- **Small**: [`create-folder-dialog.tsx`](file:///Users/f.gallo/Documents/Copilot/dataroom/components/folders/create-folder-dialog.tsx) - `size="sm"`
- **Medium**: [`create-dataroom-dialog.tsx`](file:///Users/f.gallo/Documents/Copilot/dataroom/components/datarooms/create-dataroom-dialog.tsx) - `size="md"`
- **Large**: [`create-link-dialog.tsx`](file:///Users/f.gallo/Documents/Copilot/dataroom/components/links/create-link-dialog.tsx) - `size="lg"` with 3-step wizard

## Testing Checklist

When implementing a new dialog or wizard:

- [ ] Choose appropriate size based on content
- [ ] Test on mobile (375px), tablet (768px), desktop (1024px+)
- [ ] Verify dialog doesn't exceed viewport height
- [ ] Test navigation (for wizards)
- [ ] Verify form validation
- [ ] Test dialog close/reset behavior
- [ ] Check keyboard accessibility (Tab, Esc)

# Document Upload Feature - Implementation Guide

## Overview

A complete document upload system for markdown files with drag-and-drop, metadata forms, preview functionality, and a document management interface.

## Components Created

### 1. Document Upload Component ([components/document-upload.tsx](components/document-upload.tsx))

**Features:**
- ✅ Drag-and-drop file upload area
- ✅ Click to browse alternative
- ✅ File validation (`.md`, `.markdown` only, max 5MB)
- ✅ Visual feedback on drag-over (border color change)
- ✅ File icon and name display when selected
- ✅ Metadata form with:
  - County dropdown (11 Colorado counties)
  - Document title input
  - Year number input (default: 2025)
- ✅ Preview section showing:
  - First 500 characters of content
  - File size
  - Detected headers (H1, H2)
- ✅ Upload button with loading state
- ✅ Clear/reset functionality
- ✅ Error handling with alert messages

**Current Behavior:**
- Logs file content and metadata to console
- Shows alert on successful upload
- Ready to connect to actual API

### 2. Document List Component ([components/document-list.tsx](components/document-list.tsx))

**Features:**
- ✅ Grid/card layout (responsive: 1 column mobile, 2 tablet, 3 desktop)
- ✅ Each card displays:
  - County badge with custom colors
  - Document title (with line-clamp)
  - Year and upload date
  - File size
  - Number of chunks processed
  - Delete button
- ✅ County filter dropdown
- ✅ Document count display
- ✅ Delete confirmation dialog
- ✅ Empty state with helpful message and upload button
- ✅ Loading skeleton for better UX
- ✅ Smooth transitions and hover effects

**Mock Data:**
Currently uses 3 sample documents (Boulder, Denver, Arapahoe) for demonstration.

### 3. Upload Page ([app/upload/page.tsx](app/upload/page.tsx))

**Features:**
- ✅ Page title and subtitle
- ✅ Toggle between upload form and document list
- ✅ Upload/Cancel buttons
- ✅ Clean layout with proper spacing

### 4. Type Definitions ([lib/types.ts](lib/types.ts))

**Exports:**
- `COLORADO_COUNTIES`: Array of 11 counties
- `ColoradoCounty`: Type for county names
- `COUNTY_COLORS`: Color mapping for badges (each county has unique color)
- `DocumentMetadata`: Interface for metadata
- `UploadedDocument`: Interface for documents
- `FileUploadResult`: Interface for upload responses

### 5. shadcn/ui Components

Created the following UI components:
- `Button` - Multiple variants (default, destructive, outline, ghost, etc.)
- `Card` - With Header, Title, Description, Content, Footer
- `Input` - Text and number inputs
- `Label` - Form labels
- `Select` - Dropdown with search
- `Badge` - Status badges with variants
- `Dialog` - Modal dialogs
- `Alert` - Alert messages

## County Colors

Each county has a unique color scheme:

| County | Color |
|--------|-------|
| Adams | Orange |
| Arapahoe | Green |
| Boulder | Blue |
| Clear Creek | Cyan |
| Denver | Purple |
| Douglas | Pink |
| El Paso | Red |
| Jefferson | Yellow |
| Larimer | Indigo |
| Pueblo | Teal |
| Weld | Emerald |

## File Structure

```
tax-lien-rag/
├── app/
│   └── upload/
│       └── page.tsx                 # Upload page (client component)
├── components/
│   ├── document-upload.tsx          # Upload form with drag-and-drop
│   ├── document-list.tsx            # Document management grid
│   └── ui/                          # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── badge.tsx
│       ├── dialog.tsx
│       └── alert.tsx
├── lib/
│   └── types.ts                     # TypeScript types and constants
└── sample-documents/
    ├── boulder-redemption-2025.md   # Sample markdown file
    └── README.md                    # Usage instructions
```

## How to Use

### 1. Start Development Server

```bash
npm run dev
```

### 2. Navigate to Upload Page

Visit: `http://localhost:3000/upload`

### 3. Test Upload

1. Click "Upload Document" button
2. Drag and drop `sample-documents/boulder-redemption-2025.md`
   - OR click to browse
3. Fill in metadata:
   - County: Boulder
   - Title: Redemption Guidelines 2025
   - Year: 2025
4. Review preview (shows headers and content)
5. Click "Upload Document"
6. Check console for logged data

### 4. View Documents

Click "Cancel" or wait for upload to complete to see the document list with mock data.

## Next Steps (API Integration)

To connect to a real backend, update [components/document-upload.tsx](components/document-upload.tsx:146):

```typescript
const handleUpload = async () => {
  // Replace this section with actual API call
  const formData = new FormData();
  formData.append('file', selectedFile);
  formData.append('county', metadata.county);
  formData.append('title', metadata.title);
  formData.append('year', metadata.year.toString());

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  // Handle response
};
```

Update [components/document-list.tsx](components/document-list.tsx:39) to fetch from API:

```typescript
useEffect(() => {
  const fetchDocuments = async () => {
    setIsLoading(true);
    const response = await fetch('/api/documents');
    const data = await response.json();
    setDocuments(data);
    setIsLoading(false);
  };

  fetchDocuments();
}, []);
```

## Validation Rules

### File Upload
- ✅ Only `.md` and `.markdown` extensions
- ✅ Maximum file size: 5MB
- ✅ Clear error messages

### Metadata
- ✅ County: Required (dropdown selection)
- ✅ Title: Required (text input)
- ✅ Year: Optional (defaults to 2025, min: 2000, max: 2100)

### Upload Button
- Disabled when:
  - No file selected
  - County not selected
  - Title empty
  - Upload in progress

## UI/UX Features

### Drag and Drop
- Dashed border in normal state
- Primary color border on hover
- Primary background tint when dragging over
- Smooth color transitions

### Cards
- Hover shadow effect
- Colored county badges
- Truncated text with ellipsis
- Clean, modern design

### Forms
- Clear labels
- Placeholder text
- Proper spacing
- Accessible components

### Dialogs
- Delete confirmation
- Prevents accidental deletions
- Clear warning message

### Empty States
- Helpful messaging
- Call-to-action button
- Icon for visual interest

## Styling

All components use:
- **Tailwind CSS v3** for styling
- **shadcn/ui** design system
- **CSS variables** for theming
- **Responsive design** (mobile-first)
- **Dark mode support** (via CSS variables)

## Testing Checklist

- [x] Drag and drop works
- [x] Click to browse works
- [x] File validation works (size, extension)
- [x] Preview shows correct content
- [x] Headers are detected correctly
- [x] Metadata form validates
- [x] Upload button enables/disables properly
- [x] Clear button resets form
- [x] Document list displays cards
- [x] County filter works
- [x] Delete dialog shows
- [x] Empty state displays
- [x] Responsive layout works
- [x] Console logging works

## Known Limitations

1. Currently logs to console instead of uploading to server
2. Document list uses mock data
3. No actual database integration yet
4. No progress bar during upload
5. No toast notifications (uses alert)

## Future Enhancements

1. Add toast notification system
2. Upload progress bar
3. Batch upload support
4. Document preview modal
5. Search functionality
6. Sort options
7. Pagination for large document lists
8. Export document list
9. Edit document metadata
10. Duplicate detection

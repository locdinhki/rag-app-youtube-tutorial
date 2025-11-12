# Document Upload Feature

## Overview

A complete document upload system for markdown files with drag-and-drop, metadata forms, preview functionality, and document management.

## Features

### Document Upload Component

**File**: [components/document-upload.tsx](../components/document-upload.tsx)

**Capabilities**:
- Drag-and-drop file upload area
- Click to browse alternative
- File validation (`.md`, `.markdown` only, max 5MB)
- Visual feedback on drag-over (border color change)
- File preview with headers and content
- Metadata form with county, title, and year fields
- Upload button with loading state
- Clear/reset functionality
- Error handling with alert messages

**State Management**:
```typescript
{
  selectedFile: File | null,
  isDragging: boolean,
  metadata: {
    county: string,
    title: string,
    year: number
  },
  preview: {
    content: string,
    headers: string[],
    size: string
  },
  isUploading: boolean,
  error: string
}
```

### Document List Component

**File**: [components/document-list.tsx](../components/document-list.tsx)

**Capabilities**:
- Responsive grid layout (1/2/3 columns)
- Document cards with metadata
- County badge with unique colors
- County filter dropdown
- Document count display
- Delete confirmation dialog
- Empty state with helpful message
- Loading skeleton
- Smooth transitions and hover effects

**State Management**:
```typescript
{
  documents: UploadedDocument[],
  selectedCounty: string,
  deleteDialog: {
    open: boolean,
    documentId: number | null
  },
  isLoading: boolean
}
```

## Component Flow

### Upload Flow

```
1. User selects file (drag or click)
   ↓
2. handleFile() validates file
   ↓
3. FileReader reads content
   ↓
4. Preview generated (headers + content)
   ↓
5. User fills metadata form
   ↓
6. User clicks "Upload"
   ↓
7. handleUpload() processes
   ↓
8. POST /api/upload
   ↓
9. Backend processes and stores
   ↓
10. Success message shown
   ↓
11. Form cleared via handleClear()
```

### Delete Flow

```
1. User clicks trash icon
   ↓
2. handleDelete() opens dialog
   ↓
3. User confirms deletion
   ↓
4. confirmDelete() calls API
   ↓
5. DELETE /api/documents/:id
   ↓
6. Update local state
   ↓
7. Dialog closes
```

## Metadata Fields

### County Dropdown
11 Colorado counties supported:
- Adams, Arapahoe, Boulder, Clear Creek
- Denver, Douglas, El Paso, Jefferson
- Larimer, Pueblo, Weld

Each county has unique badge colors for visual distinction.

### Document Title
- Required field
- Text input
- Example: "Redemption Guidelines 2025"

### Year
- Optional (defaults to 2025)
- Number input
- Min: 2000, Max: 2100

## File Validation

**Extension Check**:
- Only `.md` and `.markdown` files accepted
- Clear error message for invalid types

**Size Limit**:
- Maximum 5MB per file
- Error shown if exceeded

**Preview Generation**:
- First 500 characters displayed
- H1 and H2 headers detected via regex
- File size formatted (KB/MB)

## UI States

### Drag-and-Drop Area

**Normal State**:
- Dashed gray border
- Upload icon and instructions

**Hover State**:
- Dashed primary color border
- Cursor changes to pointer

**Dragging Over**:
- Solid primary border
- Light background tint
- Visual feedback for drop zone

**File Selected**:
- File icon with filename
- File size displayed
- Remove button shown

### Upload Button

**Enabled**:
- Requires: file selected, county chosen, title filled
- Dark background, ready to click

**Disabled**:
- Gray, semi-transparent
- Not clickable

**Loading**:
- Spinner animation
- "Uploading..." text
- Button disabled during upload

## County Colors

Each county has unique color scheme for badges:

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

## Responsive Design

### Mobile (< 768px)
- Single column layout
- Stacked form fields
- Full-width cards

### Tablet (768px - 1024px)
- Two column grid
- Side-by-side form fields
- Medium-sized cards

### Desktop (1024px+)
- Three column grid
- Optimized spacing
- Larger hit areas

## Accessibility

- Semantic HTML elements
- ARIA labels on icons
- Keyboard navigation support
- Focus visible states
- Screen reader text (`sr-only`)
- Proper form labels
- Role attributes on dialogs
- Alt text for icons

## API Integration

### Upload Endpoint

**Endpoint**: `POST /api/upload`

**Request**:
```typescript
FormData {
  file: File,
  county: string,
  title: string,
  year: string
}
```

**Response**:
```typescript
{
  success: boolean,
  documentId: number,
  chunksProcessed: number,
  message: string
}
```

### Documents Endpoint

**List**: `GET /api/documents`
**Delete**: `DELETE /api/documents/:id`

## Future Enhancements

1. **Toast Notifications** - Replace browser alerts
2. **Progress Bar** - Show upload percentage
3. **Batch Upload** - Multiple files at once
4. **Document Preview Modal** - Full markdown rendering
5. **Search Functionality** - Filter by title/content
6. **Sort Options** - By date, name, county
7. **Pagination** - For large document lists
8. **Export** - Download document list
9. **Edit Metadata** - Update after upload
10. **Duplicate Detection** - Warn before uploading duplicates

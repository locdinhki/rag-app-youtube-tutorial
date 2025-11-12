# Component Structure & Hierarchy

## Page Flow

```
/upload (app/upload/page.tsx)
│
├─── [State: showUpload]
│    │
│    ├─── TRUE → Show Upload Form
│    │    └─── <DocumentUpload />
│    │
│    └─── FALSE → Show Document List
│         └─── <DocumentList />
```

## Component Tree

### Upload Page Component
```
UploadPage (Client Component)
│
├─── Header Section
│    ├─── Title: "Upload County Documents"
│    ├─── Subtitle
│    └─── Button: "Upload Document" (if !showUpload)
│
├─── Upload Section (if showUpload)
│    ├─── Header with "Cancel" button
│    └─── <DocumentUpload />
│
└─── List Section (if !showUpload)
     ├─── Section title
     └─── <DocumentList onUploadClick={...} />
```

### DocumentUpload Component
```
DocumentUpload (Client Component)
│
├─── State Management
│    ├─── selectedFile: File | null
│    ├─── isDragging: boolean
│    ├─── metadata: { county, title, year }
│    ├─── preview: { content, headers, size }
│    ├─── isUploading: boolean
│    └─── error: string
│
├─── 1. File Upload Card
│    └─── Drag & Drop Area
│         ├─── [No File Selected]
│         │    ├─── Upload Icon
│         │    ├─── Instructions text
│         │    └─── Hints (size, format)
│         │
│         └─── [File Selected]
│              ├─── FileText Icon
│              ├─── Filename
│              ├─── File size
│              └─── Remove button
│
├─── 2. Error Alert (if error)
│    └─── AlertCircle icon + message
│
├─── 3. Metadata Form Card (if selectedFile)
│    ├─── County Select Dropdown
│    │    └─── 11 Colorado counties
│    ├─── Title Input
│    └─── Year Input (number)
│
├─── 4. Preview Card (if preview)
│    ├─── Detected Headers list
│    └─── Content preview (500 chars)
│
└─── 5. Action Buttons (if selectedFile)
     ├─── Upload Button (primary)
     │    ├─── Disabled if: !county || !title
     │    └─── Shows: Loader icon if uploading
     └─── Clear Button (outline)
```

### DocumentList Component
```
DocumentList (Client Component)
│
├─── State Management
│    ├─── documents: UploadedDocument[]
│    ├─── selectedCounty: string
│    ├─── deleteDialog: { open, documentId }
│    └─── isLoading: boolean
│
├─── 1. Filter Bar
│    ├─── Label: "Filter by County"
│    ├─── Select Dropdown
│    │    ├─── "All Counties"
│    │    └─── Individual counties
│    └─── Document count display
│
├─── 2. Content Area
│    │
│    ├─── [Loading State]
│    │    └─── LoadingSkeleton (3 cards)
│    │
│    ├─── [Empty State]
│    │    └─── Card
│    │         ├─── FileText icon
│    │         ├─── "No documents" message
│    │         ├─── Helpful description
│    │         └─── "Upload First Document" button
│    │
│    └─── [Has Documents]
│         └─── Grid (responsive: 1/2/3 columns)
│              └─── Document Card (for each doc)
│                   ├─── Header
│                   │    ├─── County Badge (colored)
│                   │    └─── Delete Button (trash icon)
│                   └─── Content
│                        ├─── Title (bold, large)
│                        ├─── Year
│                        ├─── Upload date
│                        ├─── File size
│                        ├─── Chunks processed
│                        └─── Filename (small, truncated)
│
└─── 3. Delete Confirmation Dialog
     └─── Modal
          ├─── Title: "Delete Document"
          ├─── Warning message
          └─── Footer
               ├─── Cancel button
               └─── Delete button (destructive)
```

## Data Flow

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
8. Console.log() [temporary]
   ↓
9. Alert shown
   ↓
10. Form cleared via handleClear()
```

### Delete Flow
```
1. User clicks trash icon on card
   ↓
2. handleDelete() opens dialog
   ↓
3. User confirms deletion
   ↓
4. confirmDelete() removes from state
   ↓
5. Console.log() [temporary]
   ↓
6. Dialog closes
```

### Filter Flow
```
1. User selects county from dropdown
   ↓
2. setSelectedCounty() updates state
   ↓
3. filteredDocuments re-calculated
   ↓
4. Grid re-renders with filtered list
```

## Props Interface

### DocumentList Props
```typescript
interface DocumentListProps {
  onUploadClick?: () => void;  // Callback to show upload form
}
```

### No props for DocumentUpload
```typescript
// Self-contained component
// Manages own state
```

## Styling Approach

### Tailwind Classes Used

**Layout:**
- `space-y-{n}` - Vertical spacing
- `gap-{n}` - Grid/flex gaps
- `grid grid-cols-{n}` - Responsive grid
- `flex flex-col` - Flex layouts
- `max-w-{size}` - Max widths

**Interactivity:**
- `hover:` - Hover states
- `focus:` - Focus states
- `disabled:` - Disabled states
- `transition-{prop}` - Smooth transitions
- `cursor-{type}` - Cursor styles

**Typography:**
- `text-{size}` - Font sizes
- `font-{weight}` - Font weights
- `text-{color}` - Text colors
- `truncate` / `line-clamp-{n}` - Text overflow

**Colors (via CSS variables):**
- `bg-background` - Background
- `text-foreground` - Text
- `border-border` - Borders
- `bg-primary` - Primary color
- `text-muted-foreground` - Secondary text

### Custom County Colors
Each county badge uses custom Tailwind classes:
```typescript
"bg-blue-100 text-blue-800 border-blue-200"  // Boulder
"bg-purple-100 text-purple-800 border-purple-200"  // Denver
// etc.
```

## State Management Summary

| Component | State Variables | Purpose |
|-----------|----------------|---------|
| UploadPage | showUpload | Toggle between upload/list view |
| DocumentUpload | selectedFile | Currently selected file |
| | isDragging | Drag-over visual feedback |
| | metadata | Form data (county, title, year) |
| | preview | File preview data |
| | isUploading | Upload in progress |
| | error | Error messages |
| DocumentList | documents | Array of documents |
| | selectedCounty | Filter state |
| | deleteDialog | Delete confirmation state |
| | isLoading | Loading state |

## Event Handlers

### DocumentUpload
- `handleFile()` - Process selected file
- `handleDrop()` - Handle drag-and-drop
- `handleDragOver()` - Drag over event
- `handleDragLeave()` - Drag leave event
- `handleFileInput()` - File input change
- `handleClear()` - Reset form
- `handleUpload()` - Upload document

### DocumentList
- `handleDelete()` - Open delete dialog
- `confirmDelete()` - Confirm deletion
- `onUploadClick` - Navigate to upload form (prop)

## Responsive Breakpoints

```css
/* Mobile (default) */
grid-cols-1

/* Tablet (md: 768px+) */
md:grid-cols-2

/* Desktop (lg: 1024px+) */
lg:grid-cols-3
```

## Accessibility Features

- ✅ Semantic HTML elements
- ✅ ARIA labels on icons
- ✅ Keyboard navigation support
- ✅ Focus visible states
- ✅ Screen reader text (`sr-only`)
- ✅ Proper form labels
- ✅ Role attributes on dialogs
- ✅ Alt text for icons (via `span.sr-only`)

## Icon Usage (lucide-react)

| Icon | Usage |
|------|-------|
| Upload | Upload button, drop area |
| FileText | File selected, empty state |
| X | Remove file, close dialog |
| Loader2 | Loading spinner (animated) |
| AlertCircle | Error messages |
| Trash2 | Delete button |
| Check | Select dropdown indicator |
| ChevronDown/Up | Select dropdown arrows |

# Documentation

Welcome to the Tax Lien RAG Assistant documentation. This folder contains comprehensive guides for understanding, setting up, and working with the application.

## Quick Navigation

### Getting Started
- **[SETUP.md](SETUP.md)** - Complete installation and configuration guide
  - Prerequisites and dependencies
  - Database setup options (Neon, Supabase, local)
  - Environment variables
  - Troubleshooting common issues

### Understanding the System
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and structure
  - Tech stack overview
  - Project structure
  - Component hierarchy
  - Data flow diagrams
  - Database schema
  - State management

### Features
- **[RAG-PIPELINE.md](RAG-PIPELINE.md)** - RAG implementation details
  - Retrieval component
  - Answer generation
  - API endpoints
  - Configuration parameters
  - Testing and debugging

- **[UPLOAD-FEATURE.md](UPLOAD-FEATURE.md)** - Document upload system
  - Upload component features
  - Document list component
  - Metadata management
  - File validation
  - API integration

### Styling
- **[TAILWIND.md](TAILWIND.md)** - Styling and theming guide
  - Tailwind CSS v3 configuration
  - Color system and CSS variables
  - County badge colors
  - Responsive design
  - Best practices

## Documentation Index

| Document | Purpose | Audience |
|----------|---------|----------|
| [SETUP.md](SETUP.md) | Installation guide | New users, developers |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System overview | Developers, architects |
| [RAG-PIPELINE.md](RAG-PIPELINE.md) | RAG implementation | Developers, ML engineers |
| [UPLOAD-FEATURE.md](UPLOAD-FEATURE.md) | Upload feature | Frontend developers |
| [TAILWIND.md](TAILWIND.md) | Styling guide | Frontend developers, designers |

## Additional Resources

### In the Main Repository

- **[README.md](../README.md)** - Project overview and quick start
- **[.env.example](../.env.example)** - Environment variables template
- **[package.json](../package.json)** - Dependencies and scripts
- **[lib/db/schema.sql](../lib/db/schema.sql)** - Database schema

### Test Files

- **[test-rag-pipeline.ts](../test-rag-pipeline.ts)** - Test RAG components
- **[test-chat-api.ts](../test-chat-api.ts)** - Test chat API endpoint

### Sample Documents

- **[sample-documents/](../sample-documents/)** - Example markdown files for testing

## Archive

The [archive/](archive/) folder contains previous documentation files that have been consolidated into the current docs. These are kept for reference but are no longer actively maintained.

## Contributing to Documentation

When updating documentation:

1. **Keep it accurate** - Update docs when code changes
2. **Be clear** - Write for someone unfamiliar with the project
3. **Use examples** - Include code snippets and diagrams
4. **Link related docs** - Cross-reference other relevant files
5. **Test instructions** - Verify setup steps actually work

## Getting Help

If you can't find what you're looking for:

1. Check the relevant doc file from the index above
2. Review the main [README.md](../README.md)
3. Look at code comments in the relevant files
4. Check the [archive/](archive/) folder for historical context

## Documentation Standards

All documentation follows these standards:

- **Markdown format** - Easy to read and version control
- **Code examples** - Syntax-highlighted, runnable snippets
- **Clear headings** - Hierarchical structure for easy navigation
- **Up-to-date** - Synchronized with current codebase
- **Practical** - Focus on real-world usage

## Roadmap

Future documentation additions:

- [ ] API reference with all endpoints
- [ ] Deployment guides (Vercel, Railway, AWS)
- [ ] Performance optimization guide
- [ ] Security best practices
- [ ] Contributing guidelines
- [ ] Troubleshooting FAQ
- [ ] Video tutorials

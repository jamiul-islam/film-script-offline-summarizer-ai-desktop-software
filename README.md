# Offline AI Script Summarizer Desktop App

A secure desktop application for film directors to analyze and summarize scripts using **local LLM (RAG) technology**, ensuring complete confidentiality of sensitive intellectual property.

## Purpose

This macOS desktop application enables film directors to efficiently evaluate multiple scripts while maintaining complete data privacy through local processing.

### Key Problems Solved

• **Script Confidentiality** - Process sensitive scripts entirely offline without external network calls, protecting intellectual property from potential leaks

• **Multi-Format Analysis** - Automatically parse and analyze scripts in PDF, TXT, and DOCX formats with comprehensive summaries including plot, characters, themes, and production considerations  

• **Efficient Script Comparison** - Compare multiple scripts side-by-side with structured summaries to make informed decisions about which projects to pursue

## System Architecture

```mermaid
graph TB
    A[Main Process<br/>Electron] --> B[File System<br/>Access]
    A --> C[SQLite<br/>Database]
    A --> D[Local LLM<br/>Ollama]

    E[Renderer Process<br/>React + TypeScript] --> F[Script Upload<br/>Component]
    E --> G[Summary Display<br/>Component]
    E --> H[Comparison View<br/>Component]
    E --> I[Settings Panel<br/>Component]

    A <--> E[IPC Communication]

    B --> J[File Parsers]
    J --> K[PDF Parser]
    J --> L[DOCX Parser]
    J --> M[TXT Parser]

    D --> N[Summary Generation]
    C --> O[Script Storage &<br/>Metadata]

    style A fill:#2d3748,stroke:#4a5568,color:#fff
    style E fill:#2d3748,stroke:#4a5568,color:#fff
    style D fill:#1a365d,stroke:#2c5282,color:#fff
    style C fill:#1a365d,stroke:#2c5282,color:#fff
```

## Quick Start

1. **Setup Development Environment**
   ```bash
   cd script-summarizer-app
   npm install
   npm run dev
   ```

2. **Run Tests**
   ```bash
   npm test
   npm run test:integration
   ```

3. **Build Application**
   ```bash
   npm run build
   npm run package
   ```

Please ensure all tests pass and follow the existing code style before submitting pull requests.
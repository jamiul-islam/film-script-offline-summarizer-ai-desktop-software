/**
 * Wrapper for pdf-parse to prevent debug mode execution
 */

// Import pdf-parse in a way that prevents its debug code from running
let pdfParse: any;

try {
  // Set module.parent to prevent debug mode
  const originalParent = module.parent;
  (module as any).parent = {};

  pdfParse = require('pdf-parse');

  // Restore original parent
  (module as any).parent = originalParent;
} catch (error) {
  // Fallback import
  pdfParse = require('pdf-parse');
}

export default pdfParse;

/**
 * Simple type checking file to verify our types work correctly
 * This file should compile without errors if our types are correct
 */

import {
  Script,
  ScriptSummary,
  Character,
  ProductionNote,
  SummaryOptions,
  LLMModel,
  AppSettings,
  validateScript,
  validateCharacter,
  validateSummaryOptions,
} from './index';

// Test basic type assignments
const testScript: Script = {
  id: 'test-123',
  title: 'Test Script',
  filePath: '/test/path.pdf',
  contentHash: 'hash123',
  wordCount: 1000,
  fileSize: 2048,
  fileType: 'pdf',
  uploadedAt: new Date(),
  lastModified: new Date(),
  updatedAt: new Date(),
};

const testCharacter: Character = {
  name: 'Test Character',
  description: 'A test character',
  importance: 'main',
  relationships: ['Other Character'],
};

const testOptions: SummaryOptions = {
  length: 'standard',
  focusAreas: ['plot', 'characters'],
  includeProductionNotes: true,
  analyzeCharacterRelationships: true,
  identifyThemes: true,
  assessMarketability: false,
};

// Test validation functions
const scriptValidation = validateScript(testScript);
const characterValidation = validateCharacter(testCharacter);
const optionsValidation = validateSummaryOptions(testOptions);

// Test type guards work
if (scriptValidation.isValid) {
  console.log('Script is valid:', scriptValidation.data?.title);
}

if (characterValidation.isValid) {
  console.log('Character is valid:', characterValidation.data?.name);
}

if (optionsValidation.isValid) {
  console.log('Options are valid:', optionsValidation.data?.length);
}

// Export a simple function to verify the module works
export const verifyTypes = (): boolean => {
  return (
    scriptValidation.isValid &&
    characterValidation.isValid &&
    optionsValidation.isValid
  );
};

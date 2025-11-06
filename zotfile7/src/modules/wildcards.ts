/**
 * ZotFile+ Wildcard Engine
 * Advanced wildcard parsing and replacement system
 */

interface WildcardOperation {
  function: string;
  [key: string]: any;
}

interface WildcardDefinition {
  field?: string;
  operations?: WildcardOperation[];
  default?: string;
  [key: string]: any;
}

export class ZotFile7_WildcardEngine {
  private customWildcards: { [key: string]: WildcardDefinition } = {};
  private defaultWildcards: { [key: string]: WildcardDefinition } = {
    'a': { field: 'author' },
    'A': { field: 'author', operations: [{ function: 'exec', regex: '\\w{1}' }, { function: 'toUpperCase' }] },
    'F': { field: 'authorLastF' },
    'I': { field: 'authorInitials' },
    'd': { field: 'editor' },
    'D': { field: 'editor', operations: [{ function: 'exec', regex: '\\w{1}' }, { function: 'toUpperCase' }] },
    'L': { field: 'editorLastF' },
    'l': { field: 'editorInitials' },
    't': { field: 'titleFormated' },
    'h': { field: 'shortTitle' },
    'j': { field: 'publicationTitle' },
    's': { field: 'journalAbbreviation' },
    'p': { field: 'publisher' },
    'w': {
      default: 'publisher',
      audioRecording: 'label',
      bill: 'legislativeBody',
      case: 'court',
      computerProgram: 'company',
      film: 'distributor',
      journalArticle: 'publicationTitle',
      magazineArticle: 'publicationTitle',
      newspaperArticle: 'publicationTitle',
      patent: 'issuingAuthority',
      presentation: 'meetingName',
      radioBroadcast: 'network',
      report: 'institution',
      thesis: 'university',
      tvBroadcast: 'network'
    },
    'n': { field: 'patentNumber' },
    'i': { field: 'assignee' },
    'y': { field: 'year' },
    'v': { field: 'volume' },
    'e': { field: 'issue' },
    'T': { field: 'itemType' },
    'f': { field: 'pages' },
    'x': { field: 'extra' },
    'c': { field: 'collectionPaths' },
    'g': { field: 'authorLastG' },
    'q': { field: 'lastAuthor' },
    'Q': { field: 'lastAuthor_lastInitial' },
    'u': { field: 'lastAuthor_lastf' },
    'U': { field: 'lastAuthor_initials' },
    'b': { field: 'citekey' }
  };

  constructor() {
    // Initialize with default wildcards
    this.loadWildcards(this.defaultWildcards);
  }

  public loadCustomWildcards(customWildcards: { [key: string]: WildcardDefinition }) {
    this.customWildcards = { ...this.defaultWildcards, ...customWildcards };
  }

  public loadWildcards(wildcards: { [key: string]: WildcardDefinition }) {
    this.customWildcards = { ...this.customWildcards, ...wildcards };
  }

  public async parsePattern(pattern: string, item: Zotero.Item): Promise<string> {
    // Replace wildcards in the pattern
    let result = pattern;

    // Handle complex wildcard patterns like {%a_}{%y_}{%t}
    const complexWildcardRegex = /\{([^}]+)\}/g;

    // Collect all matches first to avoid infinite loop when modifying the string
    const matches = Array.from(result.matchAll(complexWildcardRegex));

    // Process matches in reverse order to maintain correct indices
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      const fullMatch = match[0];
      const content = match[1];
      const matchIndex = match.index!;

      // Process operations like truncation, case conversion, etc.
      const processedContent = await this.processWildcardContent(content, item);

      // Replace the wildcard with actual value using splice approach
      result = result.substring(0, matchIndex) + processedContent + result.substring(matchIndex + fullMatch.length);
    }

    return result;
  }

  private async processWildcardContent(content: string, item: Zotero.Item): Promise<string> {
    // Handle fallbacks like %a|%d (author or editor)
    if (content.includes('|')) {
      const parts = content.split('|');
      for (const part of parts) {
        const processed = await this.processSingleWildcard(part.trim(), item);
        if (processed && processed !== '') {
          return processed;
        }
      }
      return '';
    }

    // Handle operations like %t50 (truncate to 50 chars), %t.upper (uppercase)
    const wildcardRegex = /%([a-zA-Z])(\d+|[a-zA-Z.]+)/;
    const operationMatch = content.match(wildcardRegex);

    if (operationMatch) {
      const wildcard = operationMatch[1];
      const operation = operationMatch[2];
      if (!wildcard || !operation) return '';
      const baseValue = await this.processSingleWildcard(wildcard, item);
      return this.applyOperation(baseValue, operation);
    }

    // Extract wildcard and any trailing literal text (e.g., %a_ -> wildcard='a', suffix='_')
    const wildcardWithSuffixRegex = /%([a-zA-Z])(.*)$/;
    const match = content.match(wildcardWithSuffixRegex);

    if (match) {
      const wildcardKey = match[1];
      const suffix = match[2] || '';
      const baseValue = await this.processSingleWildcard(wildcardKey, item);
      return baseValue + suffix;
    }

    // Just a simple wildcard (shouldn't reach here normally)
    return await this.processSingleWildcard(content, item);
  }

  private async processSingleWildcard(wildcard: string, item: Zotero.Item): Promise<string> {
    // Remove any numeric/operation suffixes to get the wildcard key
    const cleanWildcard = wildcard.replace(/[\d.].*$/, '');
    
    const wildcardDef = this.customWildcards[cleanWildcard];
    if (!wildcardDef) {
      return '';
    }

    let fieldPath = wildcardDef.field || wildcardDef.default;
    if (!fieldPath) {
      // Handle context-aware wildcards
      if (typeof wildcardDef === 'object') {
        const itemType = item.itemType;
        fieldPath = wildcardDef[itemType] || wildcardDef.default;
      }
      
      if (!fieldPath) {
        return '';
      }
    }

    // Get the field value from the item
    let value = await this.getFieldValue(item, fieldPath);
    
    if (value) {
      // Apply operations if any
      if (wildcardDef.operations) {
        value = this.applyOperations(value, wildcardDef.operations);
      }
    }
    
    return value || '';
  }

  private async getFieldValue(item: Zotero.Item, fieldPath: string): Promise<string | null> {
    try {
      // Handle special field paths like 'author'
      if (fieldPath === 'author' || fieldPath === 'editor') {
        return await this.getCreatorNames(item, fieldPath);
      }
      
      // Get the field value using Zotero's API
      const value = item.getField(fieldPath);
      
      // Handle special cases for year, etc.
      if (fieldPath === 'year' && !value) {
        const date = item.getField('date');
        if (date) {
          const yearMatch = date.toString().match(/^\d{4}/);
          return yearMatch ? yearMatch[0] : null;
        }
      }
      
      return value ? value.toString() : null;
    } catch (e) {
      return null;
    }
  }

  private async getCreatorNames(item: Zotero.Item, creatorType: string): Promise<string> {
    // Use the preferences system via addon global
    const maxAuthors = (Zotero.Prefs.get(`${addon['data'].config.prefsPrefix}.maxAuthors`) as number) || 3;
    const truncateAuthors = (Zotero.Prefs.get(`${addon['data'].config.prefsPrefix}.truncateAuthors`) as boolean) ?? true;
    const maxAuthorsTruncate = (Zotero.Prefs.get(`${addon['data'].config.prefsPrefix}.maxAuthorsTruncate`) as number) || 2;
    const addEtAl = (Zotero.Prefs.get(`${addon['data'].config.prefsPrefix}.addEtAl`) as boolean) ?? true;
    const etAlString = (Zotero.Prefs.get(`${addon['data'].config.prefsPrefix}.etAlString`) as string) || ' et al';
    const authorsDelimiter = (Zotero.Prefs.get(`${addon['data'].config.prefsPrefix}.authorsDelimiter`) as string) || '_';

    const creators = item.getCreators();
    if (!creators || creators.length === 0) {
      return '';
    }

    // Filter creators by type (author, editor, etc.)
    // Using creatorTypeID which maps to creator types
    const creatorTypeID = Zotero.CreatorTypes.getID(creatorType);
    if (!creatorTypeID) {
      return '';
    }

    const filteredCreators = creators.filter((creator: any) => 
      creator.creatorTypeID === creatorTypeID
    );

    if (filteredCreators.length === 0) {
      return '';
    }

    // Get author names
    let authorNames = filteredCreators.map((creator: any) => 
      `${creator.lastName || ''}`.trim()
    ).filter(name => name !== '');

    if (authorNames.length === 0) {
      return '';
    }

    // Format based on preferences
    if (truncateAuthors && authorNames.length > maxAuthorsTruncate) {
      if (addEtAl) {
        authorNames = [authorNames[0], etAlString];
      } else {
        authorNames = authorNames.slice(0, maxAuthorsTruncate);
      }
    } else if (authorNames.length > maxAuthors) {
      authorNames = authorNames.slice(0, maxAuthors);
    }

    return authorNames.join(authorsDelimiter);
  }

  private applyOperations(value: string, operations: WildcardOperation[]): string {
    let result = value;

    for (const operation of operations) {
      switch (operation.function) {
        case 'exec':
          if (operation.regex) {
            const regex = new RegExp(operation.regex, 'g');
            const matches = result.match(regex);
            if (matches) {
              result = matches.join('');
            }
          }
          break;
        case 'toUpperCase':
          result = result.toUpperCase();
          break;
        case 'toLowerCase':
          result = result.toLowerCase();
          break;
        case 'trim':
          result = result.trim();
          break;
        default:
          // Handle other operations as needed
          break;
      }
    }

    return result;
  }

  private applyOperation(value: string, operation: string): string {
    // Handle truncation: %t50 means truncate to 50 chars
    const numberMatch = operation.match(/\d+/);
    if (numberMatch) {
      const length = parseInt(numberMatch[0], 10);
      return value.substring(0, length);
    }

    // Handle case operations: %t.upper, %t.lower
    if (operation === 'upper') {
      return value.toUpperCase();
    } else if (operation === 'lower') {
      return value.toLowerCase();
    } else if (operation === 'trim') {
      return value.trim();
    }

    return value;
  }
}
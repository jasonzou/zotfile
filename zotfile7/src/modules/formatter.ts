/**
 * ZotFile+ Formatter
 * Text formatting utilities for titles, authors, etc.
 */

// Helper function to remove diacritics (accented characters)
function removeDiacritics(str: string): string {
  // First convert to NFD (decomposed form) and remove combining diacritical marks
  const withDiacriticsRemoved = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Handle specific common diacritics that might not be covered by the above
  const diacriticsMap: { [key: string]: string } = {
    'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a', 'ã': 'a', 'å': 'a', 'æ': 'ae',
    'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
    'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o', 'õ': 'o', 'ø': 'o',
    'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
    'ý': 'y', 'ÿ': 'y', 'ñ': 'n',
    'Á': 'A', 'À': 'A', 'Â': 'A', 'Ä': 'A', 'Ã': 'A', 'Å': 'A', 'Æ': 'AE',
    'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
    'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I',
    'Ó': 'O', 'Ò': 'O', 'Ô': 'O', 'Ö': 'O', 'Õ': 'O', 'Ø': 'O',
    'Ú': 'U', 'Ù': 'U', 'Û': 'U', 'Ü': 'U',
    'Ý': 'Y', 'Ÿ': 'Y', 'Ñ': 'N'
  };

  let result = '';
  for (let i = 0; i < withDiacriticsRemoved.length; i++) {
    const char = withDiacriticsRemoved[i];
    result += diacriticsMap[char] || char;
  }

  return result;
}

export class ZotFile7_Formatter {
  
  public formatTitle(title: string): string {
    if (!title) return '';

    // Apply preferences using Zotero's preference system
    const maxTitleLength = (Zotero.Prefs.get(`${addon['data'].config.prefsPrefix}.maxTitleLength`) as number) || 80;
    const truncateTitle = (Zotero.Prefs.get(`${addon['data'].config.prefsPrefix}.truncateTitle`) as boolean) ?? true;
    const smartTruncate = (Zotero.Prefs.get(`${addon['data'].config.prefsPrefix}.smartTruncate`) as boolean) ?? true;
    const removeDiacriticsPref = (Zotero.Prefs.get(`${addon['data'].config.prefsPrefix}.removeDiacritics`) as boolean) || false;
    const removePeriods = (Zotero.Prefs.get(`${addon['data'].config.prefsPrefix}.removePeriods`) as boolean) || false;
    const replaceBlanks = (Zotero.Prefs.get(`${addon['data'].config.prefsPrefix}.replaceBlanks`) as boolean) || false;
    const toLowerCase = (Zotero.Prefs.get(`${addon['data'].config.prefsPrefix}.toLowerCase`) as boolean) || false;
    
    let formattedTitle = title;

    // Remove diacritics if requested
    if (removeDiacriticsPref) {
      formattedTitle = removeDiacritics(formattedTitle);
    }

    // Remove periods if requested
    if (removePeriods) {
      formattedTitle = formattedTitle.replace(/\./g, '');
    }

    // Replace blanks with underscores if requested
    if (replaceBlanks) {
      formattedTitle = formattedTitle.replace(/ /g, '_');
    }

    // Convert to lowercase if requested
    if (toLowerCase) {
      formattedTitle = formattedTitle.toLowerCase();
    }

    // Truncate title if necessary
    if (truncateTitle && formattedTitle.length > maxTitleLength) {
      if (smartTruncate) {
        // Try to truncate at punctuation or word boundary
        const beforeTrunc = formattedTitle.substring(0, maxTitleLength);
        const punctuationPos = beforeTrunc.search(/[.!?;:]/);
        
        if (punctuationPos !== -1 && punctuationPos > maxTitleLength * 0.3) {
          // Truncate at punctuation
          formattedTitle = beforeTrunc.substring(0, punctuationPos + 1);
        } else {
          // Truncate at word boundary
          const lastSpacePos = beforeTrunc.lastIndexOf(' ');
          if (lastSpacePos > 0) {
            formattedTitle = beforeTrunc.substring(0, lastSpacePos);
          } else {
            formattedTitle = beforeTrunc;
          }
        }
      } else {
        // Simple truncation
        formattedTitle = formattedTitle.substring(0, maxTitleLength);
      }
    }

    // Clean up the title to be file-safe
    formattedTitle = this.sanitizeFilename(formattedTitle);

    return formattedTitle.trim();
  }

  public formatAuthorNames(creators: Array<any>): string {
    if (!creators || creators.length === 0) return '';

    // Apply preferences using Zotero's preference system
    const maxAuthors = (Zotero.Prefs.get(`${addon['data'].config.prefsPrefix}.maxAuthors`) as number) || 3;
    const truncateAuthors = (Zotero.Prefs.get(`${addon['data'].config.prefsPrefix}.truncateAuthors`) as boolean) ?? true;
    const maxAuthorsTruncate = (Zotero.Prefs.get(`${addon['data'].config.prefsPrefix}.maxAuthorsTruncate`) as number) || 2;
    const addEtAl = (Zotero.Prefs.get(`${addon['data'].config.prefsPrefix}.addEtAl`) as boolean) ?? true;
    const etAlString = (Zotero.Prefs.get(`${addon['data'].config.prefsPrefix}.etAlString`) as string) || ' et al';
    const authorsDelimiter = (Zotero.Prefs.get(`${addon['data'].config.prefsPrefix}.authorsDelimiter`) as string) || '_';

    let authorNames = creators.map(creator => creator.lastName || creator.name || '').filter(name => name !== '');

    if (authorNames.length === 0) {
      return '';
    }

    // Truncate authors based on preferences
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

  private sanitizeFilename(filename: string): string {
    // Remove or replace invalid characters for filenames
    return (filename || '')
      .replace(/[<>:"/\\|?*]/g, '_')  // Replace invalid characters with underscore
      .replace(/\u0000/g, '_')        // Replace null characters
      .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
      .trim();
  }
}
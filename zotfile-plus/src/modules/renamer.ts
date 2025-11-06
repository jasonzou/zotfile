/**
 * ZotFile+ Renamer
 * Batch rename operations for Zotero attachments
 */

import { ZotFile7_WildcardEngine } from "./wildcards";
import { ZotFile7_Formatter } from "./formatter";

interface RenameResult {
  item: Zotero.Item;
  attachment: Zotero.Item;
  oldName: string;
  newName: string;
  hasChanges: boolean;
  error?: string;
}

interface RenameStats {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export class ZotFilePlus_Renamer {
  private history: Array<{ [key: string]: string }> = []; // Maps old paths to new paths for undo
  private maxHistorySize = 50;

  constructor(
    private wildcardEngine: ZotFilePlus_WildcardEngine,
    private formatter: ZotFilePlus_Formatter
  ) {}

  public async previewRename(items: _ZoteroTypes.Item[], pattern: string): Promise<RenameResult[]> {
    const results: RenameResult[] = [];

    for (const item of items) {
      // Get attachments for this item
      const attachmentIDs = item.getAttachments(false);
      const attachments = attachmentIDs.map((id: number | string) => Zotero.Items.get(id)).filter((att: _ZoteroTypes.Item) => att.isAttachment());

      for (const attachment of attachments) {
        // Skip if not a file attachment
        if (!attachment.isAttachment() || (attachment as any).attachmentLinkMode === Zotero.Attachments.LINK_MODE_LINKED_URL) {
          continue;
        }

        try {
          // Determine the new filename using the pattern
          const newName = await this.generateFilename(pattern, item);
          const oldName = attachment.getField('title') as string;

          // Create the result object
          const result: RenameResult = {
            item: item,
            attachment: attachment,
            oldName: oldName,
            newName: newName,
            hasChanges: newName !== oldName
          };

          results.push(result);
        } catch (e) {
          results.push({
            item: item,
            attachment: attachment,
            oldName: attachment.getField('title') as string,
            newName: '',
            hasChanges: false,
            error: e.message
          });
        }
      }
    }

    return results;
  }

  public async applyRename(previewResults: RenameResult[]): Promise<RenameStats> {
    const stats: RenameStats = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    // Store rename history for potential undo
    const renameHistory: { [key: string]: string } = {};

    for (const result of previewResults) {
      if (!result.hasChanges) {
        stats.skipped++;
        continue;
      }

      if (result.error) {
        stats.failed++;
        stats.errors.push(result.error);
        continue;
      }

      try {
        // Get the file path of the attachment
        const filePath = result.attachment.getFilePath();
        if (!filePath) {
          throw new Error(`Could not get file path for attachment: ${result.attachment.getField('title')}`);
        }

        // Determine the new file path
        const fileDir = OS.Path.dirname(filePath);
        const newFilePath = OS.Path.join(fileDir, result.newName);

        // Rename the file
        await OS.File.move(filePath, newFilePath);

        // Update the attachment's title in Zotero
        result.attachment.setField('title', result.newName);
        await result.attachment.saveTx();

        // Store for potential undo
        renameHistory[filePath] = newFilePath;

        stats.success++;
      } catch (e) {
        stats.failed++;
        const errorMsg = `Failed to rename ${result.oldName} to ${result.newName}: ${(e as Error).message}`;
        stats.errors.push(errorMsg);
        Zotero.logError(e as Error);
      }
    }

    // Add to history if any renames were successful
    if (Object.keys(renameHistory).length > 0) {
      this.history.push(renameHistory);
      if (this.history.length > this.maxHistorySize) {
        this.history.shift(); // Remove oldest history
      }
    }

    return stats;
  }

  public async undo(): Promise<RenameStats> {
    if (this.history.length === 0) {
      throw new Error("No rename operations to undo");
    }

    // Get the most recent rename history
    const lastRename = this.history.pop()!;
    
    const stats: RenameStats = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    for (const [newPath, oldPath] of Object.entries(lastRename)) {
      try {
        // Check if the renamed file still exists
        const exists = await OS.File.exists(newPath);
        if (!exists) {
          throw new Error(`File ${newPath} no longer exists, cannot undo`);
        }

        // Move the file back to its original name
        await OS.File.move(newPath, oldPath);

        // Update Zotero's record
        const attachment = Zotero.Items.getByLibraryAndKey(
          Zotero.Libraries.userLibraryID, 
          OS.Path.basename(newPath)
        ) as Zotero.Item;

        if (attachment && attachment.isAttachment()) {
          attachment.setField('title', OS.Path.basename(oldPath));
          await attachment.saveTx();
        }

        stats.success++;
      } catch (e) {
        stats.failed++;
        const errorMsg = `Failed to undo rename from ${newPath} to ${oldPath}: ${(e as Error).message}`;
        stats.errors.push(errorMsg);
        Zotero.logError(e as Error);
      }
    }

    return stats;
  }

  public canUndo(): boolean {
    return this.history.length > 0;
  }

  private async generateFilename(pattern: string, item: _ZoteroTypes.Item): Promise<string> {
    // Use the wildcard engine to parse the pattern
    let filename = await this.wildcardEngine.parsePattern(pattern, item);

    // Apply general formatting
    filename = this.formatter.formatTitle(filename);

    // Get the file extension from the current attachment
    const currentPath = (item as any).getFilePath();
    if (currentPath) {
      const ext = OS.Path.basename(currentPath).split('.').pop();
      if (ext) {
        filename = `${filename}.${ext}`;
      }
    }

    return filename;
  }

  public async batchRenameSelected(items: _ZoteroTypes.Item[], pattern?: string): Promise<RenameStats> {
    // Use default pattern if not provided
    const renamePattern = pattern || 
      Zotero.Prefs.get(`${addon['data'].config.prefsPrefix}` + '.renamePattern') as string || 
      '{%a_}{%y_}{%t}';
    
    const preview = await this.previewRename(items, renamePattern);
    return await this.applyRename(preview);
  }
}
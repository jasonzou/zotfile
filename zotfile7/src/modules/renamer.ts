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

interface RenameHistoryEntry {
  oldPath: string;
  newPath: string;
  attachmentID: number;
}

export class ZotFile7_Renamer {
  private history: Array<RenameHistoryEntry[]> = []; // Array of rename batches for undo
  private maxHistorySize = 50;

  constructor(
    private wildcardEngine: ZotFile7_WildcardEngine,
    private formatter: ZotFile7_Formatter
  ) {}

  public async previewRename(items: Zotero.Item[], pattern: string): Promise<RenameResult[]> {
    const results: RenameResult[] = [];

    for (const item of items) {
      // Get attachments for this item
      const attachmentIDs = item.getAttachments(false);
      const attachments = attachmentIDs.map((id: number | string) => Zotero.Items.get(id)).filter((att: Zotero.Item) => att.isAttachment());

      for (const attachment of attachments) {
        // Skip if not a file attachment
        if (!attachment.isAttachment() || (attachment as any).attachmentLinkMode === Zotero.Attachments.LINK_MODE_LINKED_URL) {
          continue;
        }

        try {
          // Get the actual filename from the file path
          const filePath = attachment.getFilePath();
          if (!filePath) {
            throw new Error('Could not get file path for attachment');
          }
          const oldName = PathUtils.filename(filePath);

          // Determine the new filename using the pattern
          const newName = await this.generateFilename(pattern, item, attachment);

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
          // Try to get the real filename, fallback to title if path is unavailable
          let oldName: string;
          const filePath = attachment.getFilePath();
          if (filePath) {
            oldName = PathUtils.filename(filePath);
          } else {
            oldName = attachment.getField('title') as string;
          }

          results.push({
            item: item,
            attachment: attachment,
            oldName: oldName,
            newName: '',
            hasChanges: false,
            error: e instanceof Error ? e.message : String(e)
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
    const renameHistory: RenameHistoryEntry[] = [];

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
        const filePathOrNull = result.attachment.getFilePath();
        if (!filePathOrNull) {
          throw new Error(`Could not get file path for attachment: ${result.attachment.getField('title')}`);
        }
        const filePath: string = filePathOrNull; // Type narrowing

        // Determine the new file path
        const fileDirOrNull = PathUtils.parent(filePath);
        if (!fileDirOrNull) {
          throw new Error(`Could not determine parent directory for: ${filePath}`);
        }
        const newFilePath = PathUtils.join(fileDirOrNull, result.newName);

        // Rename the file
        await IOUtils.move(filePath, newFilePath);

        // Update the attachment's title and path in Zotero
        result.attachment.setField('title', result.newName);

        // Update the file path to point to the new location
        // This ensures Zotero knows where the file is now located
        (result.attachment as any).relinkAttachmentFile(newFilePath);

        await result.attachment.saveTx();

        // Refresh the item tree to show the updated filename
        try {
          const win = Zotero.getMainWindow();
          if (win && win.ZoteroPane && win.ZoteroPane.itemsView) {
            await (win.ZoteroPane.itemsView as any).refreshAndMaintainSelection();
          }
        } catch (refreshError) {
          // Non-critical error, just log it
          ztoolkit.log('Could not refresh item view:', refreshError);
        }

        // Store for potential undo with attachment ID
        renameHistory.push({
          oldPath: filePath,
          newPath: newFilePath,
          attachmentID: result.attachment.id
        });

        stats.success++;
      } catch (e) {
        stats.failed++;
        const errorMsg = `Failed to rename ${result.oldName} to ${result.newName}: ${e instanceof Error ? e.message : String(e)}`;
        stats.errors.push(errorMsg);
        if (e instanceof Error) {
          Zotero.logError(e);
        }
      }
    }

    // Add to history if any renames were successful
    if (renameHistory.length > 0) {
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

    // Iterate through all renames in this batch
    for (const entry of lastRename) {
      try {
        // Check if the renamed file still exists
        const exists = await IOUtils.exists(entry.newPath);
        if (!exists) {
          throw new Error(`File ${entry.newPath} no longer exists, cannot undo`);
        }

        // Move the file back to its original name
        await IOUtils.move(entry.newPath, entry.oldPath);

        // Update Zotero's record using the stored attachment ID
        const attachment = Zotero.Items.get(entry.attachmentID);

        if (attachment && attachment.isAttachment()) {
          attachment.setField('title', PathUtils.filename(entry.oldPath));
          await attachment.saveTx();
        }

        stats.success++;
      } catch (e) {
        stats.failed++;
        const errorMsg = `Failed to undo rename from ${entry.newPath} to ${entry.oldPath}: ${e instanceof Error ? e.message : String(e)}`;
        stats.errors.push(errorMsg);
        if (e instanceof Error) {
          Zotero.logError(e);
        }
      }
    }

    return stats;
  }

  public canUndo(): boolean {
    return this.history.length > 0;
  }

  private async generateFilename(pattern: string, item: Zotero.Item, attachment: Zotero.Item): Promise<string> {
    // Use the wildcard engine to parse the pattern (uses parent item metadata)
    let filename = await this.wildcardEngine.parsePattern(pattern, item);

    // Apply general formatting
    filename = this.formatter.formatTitle(filename);

    // Get the file extension from the attachment
    const currentPath = attachment.getFilePath();
    if (currentPath) {
      const basename = PathUtils.filename(currentPath);
      const ext = basename.split('.').pop();
      if (ext && ext !== basename) { // Ensure we actually have an extension
        filename = `${filename}.${ext}`;
      }
    }

    return filename;
  }

  public async batchRenameSelected(items: Zotero.Item[], pattern?: string): Promise<RenameStats> {
    // Use default pattern if not provided
    const renamePattern = pattern || 
      Zotero.Prefs.get(`${addon['data'].config.prefsPrefix}` + '.renamePattern') as string || 
      '{%a_}{%y_}{%t}';
    
    const preview = await this.previewRename(items, renamePattern);
    return await this.applyRename(preview);
  }
}
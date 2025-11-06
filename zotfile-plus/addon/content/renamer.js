/**
 * ZotFile+ Renamer
 * Handles batch renaming operations
 */

class ZotFilePlus_Renamer {
  constructor(wildcardEngine, formatter) {
    this.wildcardEngine = wildcardEngine;
    this.formatter = formatter;
    this.undoStack = [];
  }

  /**
   * Preview rename operation for multiple items
   * @param {Array<Zotero.Item>} items - Array of Zotero items
   * @param {string} pattern - Wildcard pattern like "{%a_}{%y_}{%t}"
   * @returns {Array<Object>} - Array of {item, attachment, oldName, newName, hasChanges}
   */
  async previewRename(items, pattern) {
    const results = [];

    for (const item of items) {
      // Skip if not a regular item
      if (!item.isRegularItem()) continue;

      // Get attachments for this item
      const attachmentIDs = item.getAttachments();
      const attachments = Zotero.Items.get(attachmentIDs);

      for (const att of attachments) {
        // Only process file attachments (not linked URLs)
        if (!att.isFileAttachment()) continue;
        if (att.attachmentLinkMode === Zotero.Attachments.LINK_MODE_LINKED_URL) continue;

        const oldFilename = att.attachmentFilename;
        if (!oldFilename) continue;

        // Get file extension
        const ext = oldFilename.substring(oldFilename.lastIndexOf('.'));

        // Generate new filename using wildcard pattern
        let newBasename = this.wildcardEngine.replaceWildcard(item, pattern);

        // Sanitize the filename
        newBasename = this.formatter.sanitizeFilename(newBasename);

        // If pattern resulted in empty string, skip
        if (!newBasename || newBasename.trim() === '') {
          continue;
        }

        const newFilename = newBasename + ext;

        results.push({
          item: item,
          attachment: att,
          oldName: oldFilename,
          newName: newFilename,
          hasChanges: oldFilename !== newFilename
        });
      }
    }

    return results;
  }

  /**
   * Apply rename operation
   * @param {Array<Object>} renameResults - Results from previewRename()
   * @param {Object} options - Options like {skipUnchanged: true}
   * @returns {Object} - {success: number, failed: number, errors: Array}
   */
  async applyRename(renameResults, options = {}) {
    const { skipUnchanged = true } = options;

    const stats = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    const undoInfo = {
      timestamp: Date.now(),
      renames: []
    };

    for (const result of renameResults) {
      try {
        // Skip if no changes
        if (skipUnchanged && !result.hasChanges) {
          stats.skipped++;
          continue;
        }

        // Rename the attachment file
        const success = await result.attachment.renameAttachmentFile(result.newName, false, true);

        if (success) {
          // Update attachment title
          result.attachment.setField('title', result.newName);
          await result.attachment.saveTx();

          stats.success++;

          // Save undo info
          undoInfo.renames.push({
            attachment: result.attachment,
            oldName: result.oldName,
            newName: result.newName
          });

          Zotero.debug(`[ZotFile+] Renamed: ${result.oldName} → ${result.newName}`);
        } else {
          stats.failed++;
          stats.errors.push(`Failed to rename: ${result.oldName}`);
        }
      } catch (e) {
        stats.failed++;
        stats.errors.push(`Error renaming ${result.oldName}: ${e.message}`);
        Zotero.logError(e);
      }
    }

    // Save undo info if any successful renames
    if (undoInfo.renames.length > 0) {
      this.undoStack.push(undoInfo);
      // Keep only last 10 operations
      if (this.undoStack.length > 10) {
        this.undoStack.shift();
      }
    }

    return stats;
  }

  /**
   * Undo last rename operation
   */
  async undo() {
    if (this.undoStack.length === 0) {
      throw new Error('No operations to undo');
    }

    const lastOperation = this.undoStack.pop();
    const stats = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const renameInfo of lastOperation.renames) {
      try {
        // Rename back to original
        const success = await renameInfo.attachment.renameAttachmentFile(renameInfo.oldName, false, true);

        if (success) {
          renameInfo.attachment.setField('title', renameInfo.oldName);
          await renameInfo.attachment.saveTx();
          stats.success++;
        } else {
          stats.failed++;
          stats.errors.push(`Failed to restore: ${renameInfo.newName}`);
        }
      } catch (e) {
        stats.failed++;
        stats.errors.push(`Error restoring ${renameInfo.newName}: ${e.message}`);
        Zotero.logError(e);
      }
    }

    return stats;
  }

  /**
   * Check if undo is available
   */
  canUndo() {
    return this.undoStack.length > 0;
  }

  /**
   * Rename a single attachment
   * @param {Zotero.Item} item - Parent item
   * @param {Zotero.Item} attachment - Attachment to rename
   * @param {string} pattern - Wildcard pattern
   * @returns {Object} - {success: boolean, oldName: string, newName: string, error: string}
   */
  async renameSingle(item, attachment, pattern) {
    try {
      const oldFilename = attachment.attachmentFilename;
      const ext = oldFilename.substring(oldFilename.lastIndexOf('.'));

      // Generate new filename
      let newBasename = this.wildcardEngine.replaceWildcard(item, pattern);
      newBasename = this.formatter.sanitizeFilename(newBasename);

      if (!newBasename || newBasename.trim() === '') {
        return {
          success: false,
          oldName: oldFilename,
          newName: null,
          error: 'Generated filename is empty'
        };
      }

      const newFilename = newBasename + ext;

      if (oldFilename === newFilename) {
        return {
          success: true,
          oldName: oldFilename,
          newName: newFilename,
          noChange: true
        };
      }

      // Rename
      const success = await attachment.renameAttachmentFile(newFilename, false, true);

      if (success) {
        attachment.setField('title', newFilename);
        await attachment.saveTx();

        return {
          success: true,
          oldName: oldFilename,
          newName: newFilename
        };
      } else {
        return {
          success: false,
          oldName: oldFilename,
          newName: newFilename,
          error: 'Rename operation failed'
        };
      }
    } catch (e) {
      Zotero.logError(e);
      return {
        success: false,
        error: e.message
      };
    }
  }
}

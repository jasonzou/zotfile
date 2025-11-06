/**
 * ZotFile+ UI Integration
 * Adds menu items and dialogs to Zotero interface
 */

class ZotFilePlus_UI {
  constructor(renamer) {
    this.renamer = renamer;
    this.menuItems = [];
  }

  /**
   * Initialize UI elements
   */
  async init() {
    Zotero.debug('[ZotFile+ UI] Initializing UI');

    // Add menu items to Zotero
    this.addContextMenuItems();

    // Listen for menu popup events
    this.registerMenuListeners();

    Zotero.debug('[ZotFile+ UI] UI initialization complete');
  }

  /**
   * Add context menu items
   */
  addContextMenuItems() {
    // Get the item context menu
    const menuPopup = document.getElementById('zotero-itemmenu');
    if (!menuPopup) {
      Zotero.debug('[ZotFile+ UI] Could not find item menu');
      return;
    }

    // Create ZotFile+ submenu
    const submenu = document.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', 'menu');
    submenu.setAttribute('id', 'zotfileplus-menu');
    submenu.setAttribute('label', 'ZotFile+');

    const submenuPopup = document.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', 'menupopup');
    submenuPopup.setAttribute('id', 'zotfileplus-menupopup');

    // Add menu items
    const renameItem = this.createMenuItem(
      'zotfileplus-rename',
      'Rename with Pattern...',
      () => this.showRenameDialog()
    );

    const batchRenameItem = this.createMenuItem(
      'zotfileplus-batch-rename',
      'Batch Rename Selected',
      () => this.batchRenameSelected()
    );

    const undoItem = this.createMenuItem(
      'zotfileplus-undo',
      'Undo Last Rename',
      () => this.undoLastRename()
    );

    submenuPopup.appendChild(renameItem);
    submenuPopup.appendChild(batchRenameItem);
    submenuPopup.appendChild(undoItem);

    submenu.appendChild(submenuPopup);
    menuPopup.appendChild(submenu);

    this.menuItems.push(submenu);
  }

  /**
   * Create a menu item
   */
  createMenuItem(id, label, oncommand) {
    const menuitem = document.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', 'menuitem');
    menuitem.setAttribute('id', id);
    menuitem.setAttribute('label', label);
    menuitem.addEventListener('command', oncommand);
    return menuitem;
  }

  /**
   * Register menu event listeners
   */
  registerMenuListeners() {
    const menuPopup = document.getElementById('zotfileplus-menupopup');
    if (!menuPopup) return;

    menuPopup.addEventListener('popupshowing', () => {
      this.updateMenuState();
    });
  }

  /**
   * Update menu item states (enable/disable)
   */
  updateMenuState() {
    const selectedItems = ZoteroPane.getSelectedItems();
    const hasSelection = selectedItems && selectedItems.length > 0;
    const canUndo = this.renamer.canUndo();

    // Enable/disable menu items based on state
    const renameItem = document.getElementById('zotfileplus-rename');
    const batchItem = document.getElementById('zotfileplus-batch-rename');
    const undoItem = document.getElementById('zotfileplus-undo');

    if (renameItem) renameItem.disabled = !hasSelection;
    if (batchItem) batchItem.disabled = !hasSelection;
    if (undoItem) undoItem.disabled = !canUndo;
  }

  /**
   * Show rename dialog
   */
  async showRenameDialog() {
    const selectedItems = ZoteroPane.getSelectedItems();
    if (!selectedItems || selectedItems.length === 0) {
      this.showAlert('No items selected', 'Please select one or more items.');
      return;
    }

    // Get default pattern from prefs
    const defaultPattern = Zotero.Prefs.get('extensions.zotfileplus.renamePattern', true) || '{%a_}{%y_}{%t}';

    // Prompt for pattern
    const promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
      .getService(Components.interfaces.nsIPromptService);

    const input = { value: defaultPattern };
    const result = promptService.prompt(
      null,
      'ZotFile+ Rename',
      'Enter rename pattern (e.g., {%a_}{%y_}{%t}):\n\nWildcards:\n%a=author, %y=year, %t=title, %j=journal\nSee preferences for full list.',
      input,
      null,
      {}
    );

    if (!result || !input.value) return;

    const pattern = input.value;

    // Preview renames
    const progressWin = new Zotero.ProgressWindow();
    progressWin.changeHeadline('ZotFile+ Rename');
    progressWin.show();

    try {
      const preview = await this.renamer.previewRename(selectedItems, pattern);

      if (preview.length === 0) {
        progressWin.close();
        this.showAlert('No attachments found', 'Selected items have no file attachments.');
        return;
      }

      // Show preview and confirm
      const changesOnly = preview.filter(r => r.hasChanges);
      if (changesOnly.length === 0) {
        progressWin.close();
        this.showAlert('No changes', 'Pattern would not change any filenames.');
        return;
      }

      // Build preview message
      const previewLines = changesOnly.slice(0, 5).map(r => `  ${r.oldName} → ${r.newName}`);
      if (changesOnly.length > 5) {
        previewLines.push(`  ... and ${changesOnly.length - 5} more`);
      }

      const confirmMessage = `Rename ${changesOnly.length} file(s)?\n\nPreview:\n${previewLines.join('\n')}`;

      const confirmed = promptService.confirm(null, 'Confirm Rename', confirmMessage);

      if (!confirmed) {
        progressWin.close();
        return;
      }

      // Apply renames
      progressWin.addLines(['Renaming files...']);

      const stats = await this.renamer.applyRename(preview);

      progressWin.close();

      // Show result
      let message = `Successfully renamed ${stats.success} file(s).`;
      if (stats.failed > 0) {
        message += `\n\nFailed: ${stats.failed}`;
        if (stats.errors.length > 0) {
          message += `\n${stats.errors.slice(0, 3).join('\n')}`;
        }
      }

      this.showAlert('Rename Complete', message);

    } catch (e) {
      progressWin.close();
      this.showAlert('Error', `Failed to rename files: ${e.message}`);
      Zotero.logError(e);
    }
  }

  /**
   * Batch rename selected items with default pattern
   */
  async batchRenameSelected() {
    const selectedItems = ZoteroPane.getSelectedItems();
    if (!selectedItems || selectedItems.length === 0) return;

    const pattern = Zotero.Prefs.get('extensions.zotfileplus.renamePattern', true) || '{%a_}{%y_}{%t}';

    const progressWin = new Zotero.ProgressWindow();
    progressWin.changeHeadline('ZotFile+ Batch Rename');
    progressWin.show();

    try {
      const preview = await this.renamer.previewRename(selectedItems, pattern);
      const stats = await this.renamer.applyRename(preview);

      progressWin.close();

      let message = `Renamed ${stats.success} file(s).`;
      if (stats.skipped > 0) message += `\nSkipped ${stats.skipped} (no changes).`;
      if (stats.failed > 0) message += `\nFailed: ${stats.failed}`;

      this.showAlert('Batch Rename Complete', message);

    } catch (e) {
      progressWin.close();
      this.showAlert('Error', `Batch rename failed: ${e.message}`);
      Zotero.logError(e);
    }
  }

  /**
   * Undo last rename operation
   */
  async undoLastRename() {
    if (!this.renamer.canUndo()) {
      this.showAlert('Nothing to undo', 'No recent rename operations.');
      return;
    }

    const promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
      .getService(Components.interfaces.nsIPromptService);

    const confirmed = promptService.confirm(
      null,
      'Undo Rename',
      'Undo the last rename operation?'
    );

    if (!confirmed) return;

    try {
      const stats = await this.renamer.undo();

      let message = `Restored ${stats.success} file(s) to original names.`;
      if (stats.failed > 0) {
        message += `\n\nFailed to restore: ${stats.failed}`;
      }

      this.showAlert('Undo Complete', message);

    } catch (e) {
      this.showAlert('Error', `Undo failed: ${e.message}`);
      Zotero.logError(e);
    }
  }

  /**
   * Open preferences window
   */
  openPreferences() {
    window.openDialog(
      'chrome://zotfileplus/content/options.html',
      'zotfileplus-prefs',
      'chrome,titlebar,toolbar,centerscreen,modal'
    );
  }

  /**
   * Show alert dialog
   */
  showAlert(title, message) {
    const promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
      .getService(Components.interfaces.nsIPromptService);
    promptService.alert(null, title, message);
  }

  /**
   * Cleanup UI elements
   */
  cleanup() {
    Zotero.debug('[ZotFile+ UI] Cleaning up UI');

    // Remove menu items
    for (const menuItem of this.menuItems) {
      if (menuItem.parentNode) {
        menuItem.parentNode.removeChild(menuItem);
      }
    }

    this.menuItems = [];
  }
}

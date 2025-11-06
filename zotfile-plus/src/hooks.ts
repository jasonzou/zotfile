import { createZToolkit } from "./utils/ztoolkit";
import { ZotFilePlus_WildcardEngine } from "./modules/wildcards";
import { ZotFilePlus_Formatter } from "./modules/formatter";
import { ZotFilePlus_Renamer } from "./modules/renamer";
import { ZotFilePlus_Prefs } from "./utils/prefs";

// Initialize module instances
let wildcardEngine: ZotFilePlus_WildcardEngine;
let formatter: ZotFilePlus_Formatter;
let renamer: ZotFilePlus_Renamer;

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  // Initialize core modules
  wildcardEngine = new ZotFilePlus_WildcardEngine();
  formatter = new ZotFilePlus_Formatter();
  renamer = new ZotFilePlus_Renamer(wildcardEngine, formatter);
  
  // Load custom wildcards from preferences
  const customWildcardsJSON = ZotFilePlus_Prefs.getPref<string>('customWildcards', '{}');
  if (customWildcardsJSON && customWildcardsJSON !== '{}') {
    try {
      const customWildcards = JSON.parse(customWildcardsJSON);
      wildcardEngine.loadCustomWildcards(customWildcards);
    } catch (e: unknown) {
      Zotero.logError("Error loading custom wildcards: " + (e as Error).message);
    }
  }

  // Initialize the plugin
  await (addon as any)['hooks'].onMainWindowLoad((window as unknown) as _ZoteroTypes.MainWindow);
  
  // Mark initialized as true to confirm plugin loading status
  (addon as any)['data'].initialized = true;
}

async function onMainWindowLoad(win: _ZoteroTypes.MainWindow): Promise<void> {
  // Create ztoolkit for every window
  (addon as any)['data'].ztoolkit = createZToolkit();
  
  // Add context menu items for ZotFile+
  await addContextMenuItems();
}

async function addContextMenuItems() {
  // Add to item context menu
  addon['data'].ztoolkit.Menu.register("item", {
    tag: "menu",
    id: "zotero-itemmenu-zotfileplus",
    label: "ZotFile+",
    children: [
      {
        tag: "menuitem",
        id: "zotero-itemmenu-zotfileplus-rename",
        label: "Rename with Pattern...",
        commandListener: (event) => {
          (addon as any)['hooks'].onRenameWithPattern();
        }
      },
      {
        tag: "menuitem",
        id: "zotero-itemmenu-zotfileplus-batch",
        label: "Batch Rename Selected",
        commandListener: (event) => {
          (addon as any)['hooks'].onBatchRename();
        }
      },
      {
        tag: "menuitem",
        id: "zotero-itemmenu-zotfileplus-undo",
        label: "Undo Last Rename",
        commandListener: (event) => {
          (addon as any)['hooks'].onUndoLastRename();
        }
      }
    ]
  });
}

async function onRenameWithPattern() {
  try {
    Zotero.debug('[ZotFile+] onRenameWithPattern called');

    // Get selected items
    const selectedItems = ZoteroPane.getSelectedItems();
    if (!selectedItems || selectedItems.length === 0) {
      Zotero.alert(null, "ZotFile+", "No items selected. Please select one or more items.");
      return;
    }

    Zotero.debug(`[ZotFile+] Selected ${selectedItems.length} items`);

    // Get default pattern from prefs
    const defaultPattern = ZotFilePlus_Prefs.getPref<string>('renamePattern', '{%a_}{%y_}{%t}') || '{%a_}{%y_}{%t}';
    Zotero.debug(`[ZotFile+] Default pattern: ${defaultPattern}`);

    // Create a simple prompt dialog for the pattern
    const promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
      .getService(Components.interfaces.nsIPromptService) as nsIPromptService;

    const input = { value: defaultPattern };
    const result = promptService.prompt(
      null,
      'ZotFile+ Rename',
      'Enter rename pattern (e.g., {%a_}{%y_}{%t}):\n\nWildcards:\n%a=author, %y=year, %t=title, %j=journal\nSee preferences for full list.',
      input,
      null,
      {}
    );

    if (!result || !input.value) {
      Zotero.debug('[ZotFile+] User cancelled pattern input');
      return;
    }

    const pattern = input.value.trim();
    if (!pattern) {
      Zotero.alert(null, "ZotFile+", "Please enter a rename pattern");
      return;
    }

    Zotero.debug(`[ZotFile+] Using pattern: ${pattern}`);

    // Preview renames
    const progressWin = new Zotero.ProgressWindow();
    progressWin.changeHeadline('ZotFile+ Rename');
    progressWin.show();

    try {
      Zotero.debug('[ZotFile+] Generating preview...');
      const preview = await renamer.previewRename(selectedItems, pattern);
      Zotero.debug(`[ZotFile+] Preview generated: ${preview.length} results`);

      if (preview.length === 0) {
        progressWin.close();
        Zotero.debug('[ZotFile+] No attachments found');
        Zotero.alert(null, "ZotFile+", 'Selected items have no file attachments.');
        return;
      }

      const changesOnly = preview.filter(r => r.hasChanges);
      Zotero.debug(`[ZotFile+] Changes found: ${changesOnly.length}`);

      if (changesOnly.length === 0) {
        progressWin.close();
        Zotero.alert(null, "ZotFile+", 'Pattern would not change any filenames.');
        return;
      }

      // Build preview message
      const previewLines = changesOnly.slice(0, 5).map(r => `  ${r.oldName} → ${r.newName}`);
      if (changesOnly.length > 5) {
        previewLines.push(`  ... and ${changesOnly.length - 5} more`);
      }

      const confirmMessage = `Rename ${changesOnly.length} file(s)?\n\nPreview:\n${previewLines.join('\n')}`;
      Zotero.debug('[ZotFile+] Showing confirmation dialog...');

      const confirmed = promptService.confirm(null, 'Confirm Rename', confirmMessage);

      if (!confirmed) {
        Zotero.debug('[ZotFile+] User cancelled confirmation');
        progressWin.close();
        return;
      }

      // Apply renames
      progressWin.addLines(['Renaming files...']);
      Zotero.debug('[ZotFile+] Applying renames...');

      const stats = await renamer.applyRename(preview);
      Zotero.debug(`[ZotFile+] Rename complete. Stats: ${JSON.stringify(stats)}`);

      progressWin.close();

      // Show result
      let message = `Successfully renamed ${stats.success} file(s).`;
      if (stats.failed > 0) {
        message += `\n\nFailed: ${stats.failed}`;
        if (stats.errors && stats.errors.length > 0) {
          message += `\n${stats.errors.slice(0, 3).join('\n')}`;
        }
      }

      Zotero.alert(null, "ZotFile+", message);

    } catch (e: unknown) {
      progressWin.close();
      Zotero.logError(`[ZotFile+] ERROR in rename: ${(e as Error).message}`);
      Zotero.logError(e as Error);
      Zotero.alert(null, "ZotFile+", `Failed to rename files: ${(e as Error).message}\n\nCheck Error Console for details.`);
    }
  } catch (error) {
    Zotero.logError(`[ZotFile+] ERROR in onRenameWithPattern: ${(error as Error).message}`);
    Zotero.logError(error as Error);
    Zotero.alert(
      null,
      "ZotFile+ Error",
      `An error occurred:\n\n${(error as Error).message}\n\nCheck Error Console for details.`
    );
  }
}

async function onBatchRename() {
  const selectedItems = ZoteroPane.getSelectedItems();
  if (!selectedItems || selectedItems.length === 0) return;

  const pattern = ZotFilePlus_Prefs.getPref<string>('renamePattern', '{%a_}{%y_}{%t}') || '{%a_}{%y_}{%t}';

  const progressWin = new Zotero.ProgressWindow();
  progressWin.changeHeadline('ZotFile+ Batch Rename');
  progressWin.show();

  try {
    const stats = await renamer.batchRenameSelected(selectedItems, pattern);

    progressWin.close();

    let message = `Renamed ${stats.success} file(s).`;
    if (stats.skipped > 0) message += `\nSkipped ${stats.skipped} (no changes).`;
    if (stats.failed > 0) message += `\nFailed: ${stats.failed}`;

    Zotero.alert(null, "ZotFile+", message);

  } catch (e: unknown) {
    progressWin.close();
    Zotero.alert(null, "ZotFile+", `Batch rename failed: ${(e as Error).message}`);
    Zotero.logError(e as Error);
  }
}

async function onUndoLastRename() {
  if (!renamer.canUndo()) {
    Zotero.alert(null, "ZotFile+", 'No recent rename operations.');
    return;
  }

  const promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
    .getService(Components.interfaces.nsIPromptService) as nsIPromptService;

  const confirmed = promptService.confirm(
    null,
    'Undo Rename',
    'Undo the last rename operation?'
  );

  if (!confirmed) return;

  try {
    const stats = await renamer.undo();

    let message = `Restored ${stats.success} file(s) to original names.`;
    if (stats.failed > 0) {
      message += `\n\nFailed to restore: ${stats.failed}`;
    }

    Zotero.alert(null, "ZotFile+", message);

  } catch (e: unknown) {
    Zotero.alert(null, "ZotFile+", `Undo failed: ${(e as Error).message}`);
    Zotero.logError(e as Error);
  }
}

async function onMainWindowUnload(win: Window): Promise<void> {
  ztoolkit.unregisterAll();
  addon.data.dialog?.window?.close();
}

function onShutdown(): void {
  ztoolkit.unregisterAll();
  addon.data.dialog?.window?.close();
  // Remove addon object
  (addon as any).data.alive = false;
  // @ts-expect-error - Plugin instance is not typed
  delete Zotero[(addon as any).data.config.addonInstance];
}

/**
 * This function is just an example of dispatcher for Notify events.
 * Any operations should be placed in a function to keep this funcion clear.
 */
async function onNotify(
  event: string,
  type: string,
  ids: Array<string | number>,
  extraData: { [key: string]: any },
) {
  // You can add your code to the corresponding notify type
  ztoolkit.log("notify", event, type, ids, extraData);
  // Add notification handling code here
}

/**
 * This function is just an example of dispatcher for Preference UI events.
 * Any operations should be placed in a function to keep this funcion clear.
 * @param type event type
 * @param data event data
 */
async function onPrefsEvent(type: string, data: { [key: string]: any }) {
  switch (type) {
    case "load":
      // Register preference scripts if needed
      break;
    default:
      return;
  }
}

function onShortcuts(type: string) {
  // Handle keyboard shortcuts if any
}

function onDialogEvents(type: string) {
  // Handle dialog events if any
}

// Add your hooks here. For element click, etc.
// Keep in mind hooks only do dispatch. Don't add code that does real jobs in hooks.
// Otherwise the code would be hard to read and maintain.

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onNotify,
  onPrefsEvent,
  onShortcuts,
  onDialogEvents,
  onRenameWithPattern,
  onBatchRename,
  onUndoLastRename
};
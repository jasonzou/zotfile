import { getLocaleID, getString } from "../utils/locale";

function example(
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor,
) {
  const original = descriptor.value;
  descriptor.value = function (...args: any) {
    try {
      ztoolkit.log(`Calling example ${target.name}.${String(propertyKey)}`);
      return original.apply(this, args);
    } catch (e) {
      ztoolkit.log(`Error in example ${target.name}.${String(propertyKey)}`, e);
      throw e;
    }
  };
  return descriptor;
}

export class BasicExampleFactory {
  @example
  static registerNotifier() {
    const callback = {
      notify: async (
        event: string,
        type: string,
        ids: number[] | string[],
        extraData: { [key: string]: any },
      ) => {
        if (!addon?.data.alive) {
          this.unregisterNotifier(notifierID);
          return;
        }
        addon.hooks.onNotify(event, type, ids, extraData);
      },
    };

    // Register the callback in Zotero as an item observer
    const notifierID = Zotero.Notifier.registerObserver(callback, [
      "tab",
      "item",
      "file",
    ]);

    Zotero.Plugins.addObserver({
      shutdown: ({ id }) => {
        if (id === addon.data.config.addonID)
          this.unregisterNotifier(notifierID);
      },
    });
  }

  @example
  static exampleNotifierCallback() {
    new ztoolkit.ProgressWindow(addon.data.config.addonName)
      .createLine({
        text: "Open Tab Detected!",
        type: "success",
        progress: 100,
      })
      .show();
  }

  @example
  private static unregisterNotifier(notifierID: string) {
    Zotero.Notifier.unregisterObserver(notifierID);
  }

  @example
  static registerPrefs() {
    Zotero.PreferencePanes.register({
      pluginID: addon.data.config.addonID,
      src: rootURI + "content/preferences.xhtml",
      label: getString("prefs-title"),
      image: `chrome://${addon.data.config.addonRef}/content/icons/favicon.png`,
    });
  }
}

export class KeyExampleFactory {
  @example
  static registerShortcuts() {
    // Register an event key for Alt+L
    ztoolkit.Keyboard.register((ev, keyOptions) => {
      ztoolkit.log(ev, keyOptions.keyboard);
      if (keyOptions.keyboard?.equals("shift,l")) {
        addon.hooks.onShortcuts("larger");
      }
      // if (ev.shiftKey && ev.key === "S") {
      //   addon.hooks.onShortcuts("smaller");
      // }
    });

    // new ztoolkit.ProgressWindow(addon.data.config.addonName)
    //   .createLine({
    //     text: "Example Shortcuts: Alt+L/S/C",
    //     type: "success",
    //   })
    //   .show();
  }

  @example
  static exampleShortcutLargerCallback() {
    new ztoolkit.ProgressWindow(addon.data.config.addonName)
      .createLine({
        text: "Larger!",
        type: "default",
      })
      .show();
  }

  // @example
  // static exampleShortcutSmallerCallback() {
  //   new ztoolkit.ProgressWindow(addon.data.config.addonName)
  //     .createLine({
  //       text: "Smaller!",
  //       type: "default",
  //     })
  //     .show();
  // }
}

export class UIExampleFactory {
  // @example
  // static registerStyleSheet(win: _ZoteroTypes.MainWindow) {
  //   const doc = win.document;
  //   const styles = ztoolkit.UI.createElement(doc, "link", {
  //     properties: {
  //       type: "text/css",
  //       rel: "stylesheet",
  //       href: `chrome://${addon.data.config.addonRef}/content/zoteroPane.css`,
  //     },
  //   });
  //   doc.documentElement?.appendChild(styles);
  //   doc.getElementById("zotero-item-pane-content")?.classList.add("makeItRed");
  // }

  // @example
  // static registerRightClickMenuItem() {
  //   const menuIcon = `chrome://${addon.data.config.addonRef}/content/icons/favicon@0.5x.png`;
  //   // item menuitem with icon
  //   ztoolkit.Menu.register("item", {
  //     tag: "menuitem",
  //     id: "zotero-itemmenu-addontemplate-test",
  //     label: getString("menuitem-label"),
  //     commandListener: (ev) => addon.hooks.onDialogEvents("dialogExample"),
  //     icon: menuIcon,
  //   });
  // }

  @example
  static registerRightClickMenuPopup(win: Window) {
    const menuIcon = `chrome://${addon.data.config.addonRef}/content/icons/favicon@0.5x.png`;
    ztoolkit.Menu.register(
      "item",
      {
        tag: "menu",
        id: "zotero-itemmenu-zotfile7",
        label: getString("menuzotfile7-label"),
        icon: menuIcon,
        children: [
          {
            tag: "menuitem",
            label: getString("menuitem-submenulabel"),
            oncommand: "alert('Hello World! Sub Menuitem.')",
          },
          {
            tag: "menuitem",
            label: getString("menuitem-submenu2label"),
            commandListener: (ev) => this.handleRenameAttachments(),
          },
        ],
      },
    );
  }

  @example
  static async handleRenameAttachments() {
    try {
      // Get selected items from Zotero
      const ZoteroPane = Zotero.getActiveZoteroPane();
      if (!ZoteroPane) {
        ztoolkit.log("No active Zotero pane");
        return;
      }

      const selectedItems = ZoteroPane.getSelectedItems();
      if (!selectedItems || selectedItems.length === 0) {
        new ztoolkit.ProgressWindow(addon.data.config.addonName)
          .createLine({
            text: "No items selected",
            type: "error",
            progress: 100,
          })
          .show();
        return;
      }

      ztoolkit.log(`Renaming attachments for ${selectedItems.length} items`);

      // Get rename pattern from preferences or use default
      const pattern = Zotero.Prefs.get(`${addon.data.config.prefsPrefix}.renamePattern`) as string || '{%a_}{%y_}{%t}';

      // Show progress window
      const progressWindow = new ztoolkit.ProgressWindow(addon.data.config.addonName);
      progressWindow.createLine({
        text: `Preparing to rename attachments using pattern: ${pattern}`,
        type: "default",
        progress: 0,
      }).show();

      ztoolkit.log(`Using rename pattern: ${pattern}`);

      // Import the renamer dynamically
      const { ZotFile7_Renamer } = await import("./renamer");
      const { ZotFile7_WildcardEngine } = await import("./wildcards");
      const { ZotFile7_Formatter } = await import("./formatter");

      // Create instances
      const wildcardEngine = new ZotFile7_WildcardEngine();
      const formatter = new ZotFile7_Formatter();
      const renamer = new ZotFile7_Renamer(wildcardEngine, formatter);

      // Preview the rename operation
      const previewResults = await renamer.previewRename(selectedItems, pattern);

      const itemsToRename = previewResults.filter(r => r.hasChanges && !r.error);
      const itemsWithErrors = previewResults.filter(r => r.error);

      ztoolkit.log(`Preview: ${itemsToRename.length} items to rename, ${itemsWithErrors.length} errors`);

      if (itemsToRename.length === 0) {
        progressWindow.changeLine({
          text: "No attachments to rename",
          type: "default",
          progress: 100,
        });
        progressWindow.startCloseTimer(3000);
        return;
      }

      // Display preview of renames
      progressWindow.changeLine({
        text: `Preview: ${itemsToRename.length} attachment(s) will be renamed`,
        progress: 25,
      });

      // Show detailed preview for each item
      for (const result of itemsToRename) {
        const filePath = result.attachment.getFilePath();
        const directory = filePath ? PathUtils.parent(filePath) : "Unknown location";

        ztoolkit.log(`\nRename Preview:`);
        ztoolkit.log(`  Path: ${directory}`);
        ztoolkit.log(`  Old: ${result.oldName}`);
        ztoolkit.log(`  New: ${result.newName}`);
      }

      // Show errors if any
      if (itemsWithErrors.length > 0) {
        ztoolkit.log(`\nErrors (${itemsWithErrors.length}):`);
        itemsWithErrors.forEach(r => {
          ztoolkit.log(`  ${r.oldName}: ${r.error}`);
        });
      }

      // Ask user to confirm via a simple dialog
      const dialogData: { [key: string | number]: any } = {
        confirmRename: false,
        previewText: "",
      };

      // Build preview text for dialog
      let previewText = `Rename Pattern: ${pattern}\n`;
      previewText += `(Author_Year_Title format)\n\n`;
      previewText += `Rename ${itemsToRename.length} attachment(s):\n\n`;
      itemsToRename.slice(0, 5).forEach(result => {
        const filePath = result.attachment.getFilePath();
        const directory = filePath ? PathUtils.parent(filePath) || "" : "";
        previewText += `Path: ${directory}\n`;
        previewText += `  Old: ${result.oldName}\n`;
        previewText += `  New: ${result.newName}\n\n`;
      });

      if (itemsToRename.length > 5) {
        previewText += `... and ${itemsToRename.length - 5} more\n\n`;
      }

      if (itemsWithErrors.length > 0) {
        previewText += `\n${itemsWithErrors.length} item(s) have errors and will be skipped.\n`;
      }

      previewText += `\nProceed with rename?`;

      // Show confirmation dialog
      const win = Zotero.getMainWindow();
      const confirmed = Services.prompt.confirm(
        win as any,
        "ZotFile7 - Rename Attachments",
        previewText
      );

      if (!confirmed) {
        progressWindow.changeLine({
          text: "Rename cancelled by user",
          type: "default",
          progress: 100,
        });
        progressWindow.startCloseTimer(2000);
        return;
      }

      // Apply the rename
      progressWindow.changeLine({
        text: `Renaming ${itemsToRename.length} attachments...`,
        progress: 50,
      });

      const stats = await renamer.applyRename(previewResults);

      // Show results
      if (stats.success > 0) {
        progressWindow.changeLine({
          text: `Successfully renamed ${stats.success} attachment(s)`,
          type: "success",
          progress: 100,
        });
      } else {
        progressWindow.changeLine({
          text: `Failed to rename attachments`,
          type: "error",
          progress: 100,
        });
      }

      if (stats.errors.length > 0) {
        ztoolkit.log("Errors during rename:", stats.errors);
      }

      progressWindow.startCloseTimer(3000);
    } catch (e) {
      ztoolkit.log("Error in handleRenameAttachments:", e);
      new ztoolkit.ProgressWindow(addon.data.config.addonName)
        .createLine({
          text: `Error: ${e instanceof Error ? e.message : String(e)}`,
          type: "error",
          progress: 100,
        })
        .show(-1);
    }
  }

  // @example
  // static registerWindowMenuWithSeparator() {
  //   ztoolkit.Menu.register("menuFile", {
  //     tag: "menuseparator",
  //   });
  //   // menu->File menuitem
  //   ztoolkit.Menu.register("menuFile", {
  //     tag: "menuitem",
  //     label: getString("menuitem-filemenulabel"),
  //     oncommand: "alert('Hello World! File Menuitem.')",
  //   });
  // }

  @example
  static async registerExtraColumn() {
    const field = "test1";
    await Zotero.ItemTreeManager.registerColumns({
      pluginID: addon.data.config.addonID,
      dataKey: field,
      label: "text column",
      dataProvider: (item: Zotero.Item, dataKey: string) => {
        return field + String(item.id);
      },
      iconPath: "chrome://zotero/skin/cross.png",
    });
  }

  @example
  static async registerExtraColumnWithCustomCell() {
    const field = "test2";
    await Zotero.ItemTreeManager.registerColumns({
      pluginID: addon.data.config.addonID,
      dataKey: field,
      label: "custom column",
      dataProvider: (item: Zotero.Item, dataKey: string) => {
        return field + String(item.id);
      },
      renderCell(index, data, column, isFirstColumn, doc) {
        ztoolkit.log("Custom column cell is rendered!");
        const span = doc.createElement("span");
        span.className = `cell ${column.className}`;
        span.style.background = "#0dd068";
        span.innerText = "⭐" + data;
        return span;
      },
    });
  }

  @example
  static registerItemPaneCustomInfoRow() {
    Zotero.ItemPaneManager.registerInfoRow({
      rowID: "example",
      pluginID: addon.data.config.addonID,
      editable: true,
      label: {
        l10nID: getLocaleID("item-info-row-example-label"),
      },
      position: "afterCreators",
      onGetData: ({ item }) => {
        return item.getField("title");
      },
      onSetData: ({ item, value }) => {
        item.setField("title", value);
      },
    });
  }

  @example
  static registerItemPaneSection() {
    Zotero.ItemPaneManager.registerSection({
      paneID: "example",
      pluginID: addon.data.config.addonID,
      header: {
        l10nID: getLocaleID("item-section-example1-head-text"),
        icon: "chrome://zotero/skin/16/universal/book.svg",
      },
      sidenav: {
        l10nID: getLocaleID("item-section-example1-sidenav-tooltip"),
        icon: "chrome://zotero/skin/20/universal/save.svg",
      },
      onRender: ({ body, item, editable, tabType }) => {
        body.textContent = JSON.stringify({
          id: item?.id,
          editable,
          tabType,
        });
      },
    });
  }

  @example
  static async registerReaderItemPaneSection() {
    Zotero.ItemPaneManager.registerSection({
      paneID: "reader-example",
      pluginID: addon.data.config.addonID,
      header: {
        l10nID: getLocaleID("item-section-example2-head-text"),
        // Optional
        l10nArgs: `{"status": "Initialized"}`,
        // Can also have a optional dark icon
        icon: "chrome://zotero/skin/16/universal/book.svg",
      },
      sidenav: {
        l10nID: getLocaleID("item-section-example2-sidenav-tooltip"),
        icon: "chrome://zotero/skin/20/universal/save.svg",
      },
      // Optional
      bodyXHTML:
        '<html:h1 id="test">THIS IS TEST</html:h1><browser disableglobalhistory="true" remote="true" maychangeremoteness="true" type="content" flex="1" id="browser" style="width: 180%; height: 280px"/>',
      // Optional, Called when the section is first created, must be synchronous
      onInit: ({ item }) => {
        ztoolkit.log("Section init!", item?.id);
      },
      // Optional, Called when the section is destroyed, must be synchronous
      onDestroy: (props) => {
        ztoolkit.log("Section destroy!");
      },
      // Optional, Called when the section data changes (setting item/mode/tabType/inTrash), must be synchronous. return false to cancel the change
      onItemChange: ({ item, setEnabled, tabType }) => {
        ztoolkit.log(`Section item data changed to ${item?.id}`);
        setEnabled(tabType === "reader");
        return true;
      },
      // Called when the section is asked to render, must be synchronous.
      onRender: ({
        body,
        item,
        setL10nArgs,
        setSectionSummary,
        setSectionButtonStatus,
      }) => {
        ztoolkit.log("Section rendered!", item?.id);
        const title = body.querySelector("#test") as HTMLElement;
        title.style.color = "red";
        title.textContent = "LOADING";
        setL10nArgs(`{ "status": "Loading" }`);
        setSectionSummary("loading!");
        setSectionButtonStatus("test", { hidden: true });
      },
      // Optional, can be asynchronous.
      onAsyncRender: async ({
        body,
        item,
        setL10nArgs,
        setSectionSummary,
        setSectionButtonStatus,
      }) => {
        ztoolkit.log("Section secondary render start!", item?.id);
        await Zotero.Promise.delay(1000);
        ztoolkit.log("Section secondary render finish!", item?.id);
        const title = body.querySelector("#test") as HTMLElement;
        title.style.color = "green";
        title.textContent = item.getField("title");
        setL10nArgs(`{ "status": "Loaded" }`);
        setSectionSummary("rendered!");
        setSectionButtonStatus("test", { hidden: false });
      },
      // Optional, Called when the section is toggled. Can happen anytime even if the section is not visible or not rendered
      onToggle: ({ item }) => {
        ztoolkit.log("Section toggled!", item?.id);
      },
      // Optional, Buttons to be shown in the section header
      sectionButtons: [
        {
          type: "test",
          icon: "chrome://zotero/skin/16/universal/empty-trash.svg",
          l10nID: getLocaleID("item-section-example2-button-tooltip"),
          onClick: ({ item, paneID }) => {
            ztoolkit.log("Section clicked!", item?.id);
            Zotero.ItemPaneManager.unregisterSection(paneID);
          },
        },
      ],
    });
  }
}

export class PromptExampleFactory {
//   @example
//   static registerNormalCommandExample() {
//     ztoolkit.Prompt.register([
//       {
//         name: "Normal Command Test",
//         label: "Plugin Template",
//         callback(prompt) {
//           ztoolkit.getGlobal("alert")("Command triggered!");
//         },
//       },
//     ]);
//   }

  // @example
  // static registerAnonymousCommandExample(window: Window) {
  //   ztoolkit.Prompt.register([
  //     {
  //       id: "search",
  //       callback: async (prompt) => {
  //         // https://github.com/zotero/zotero/blob/7262465109c21919b56a7ab214f7c7a8e1e63909/chrome/content/zotero/integration/quickFormat.js#L589
  //         function getItemDescription(item: Zotero.Item) {
  //           const nodes = [];
  //           let str = "";
  //           let author,
  //             authorDate = "";
  //           if (item.firstCreator) {
  //             author = authorDate = item.firstCreator;
  //           }
  //           let date = item.getField("date", true, true) as string;
  //           if (date && (date = date.substr(0, 4)) !== "0000") {
  //             authorDate += " (" + parseInt(date) + ")";
  //           }
  //           authorDate = authorDate.trim();
  //           if (authorDate) nodes.push(authorDate);

  //           const publicationTitle = item.getField(
  //             "publicationTitle",
  //             false,
  //             true,
  //           );
  //           if (publicationTitle) {
  //             nodes.push(`<i>${publicationTitle}</i>`);
  //           }
  //           let volumeIssue = item.getField("volume");
  //           const issue = item.getField("issue");
  //           if (issue) volumeIssue += "(" + issue + ")";
  //           if (volumeIssue) nodes.push(volumeIssue);

  //           const publisherPlace = [];
  //           let field;
  //           if ((field = item.getField("publisher")))
  //             publisherPlace.push(field);
  //           if ((field = item.getField("place"))) publisherPlace.push(field);
  //           if (publisherPlace.length) nodes.push(publisherPlace.join(": "));

  //           const pages = item.getField("pages");
  //           if (pages) nodes.push(pages);

  //           if (!nodes.length) {
  //             const url = item.getField("url");
  //             if (url) nodes.push(url);
  //           }

  //           // compile everything together
  //           for (let i = 0, n = nodes.length; i < n; i++) {
  //             const node = nodes[i];

  //             if (i != 0) str += ", ";

  //             if (typeof node === "object") {
  //               const label =
  //                 Zotero.getMainWindow().document.createElement("label");
  //               label.setAttribute("value", str);
  //               label.setAttribute("crop", "end");
  //               str = "";
  //             } else {
  //               str += node;
  //             }
  //           }
  //           if (str.length) str += ".";
  //           return str;
  //         }
  //         function filter(ids: number[]) {
  //           ids = ids.filter(async (id) => {
  //             const item = (await Zotero.Items.getAsync(id)) as Zotero.Item;
  //             return item.isRegularItem() && !(item as any).isFeedItem;
  //           });
  //           return ids;
  //         }
  //         const text = prompt.inputNode.value;
  //         prompt.showTip("Searching...");
  //         const s = new Zotero.Search();
  //         s.addCondition("quicksearch-titleCreatorYear", "contains", text);
  //         s.addCondition("itemType", "isNot", "attachment");
  //         let ids = await s.search();
  //         // prompt.exit will remove current container element.
  //         // @ts-expect-error ignore
  //         prompt.exit();
  //         const container = prompt.createCommandsContainer();
  //         container.classList.add("suggestions");
  //         ids = filter(ids);
  //         console.log(ids.length);
  //         if (ids.length == 0) {
  //           const s = new Zotero.Search();
  //           const operators = [
  //             "is",
  //             "isNot",
  //             "true",
  //             "false",
  //             "isInTheLast",
  //             "isBefore",
  //             "isAfter",
  //             "contains",
  //             "doesNotContain",
  //             "beginsWith",
  //           ];
  //           let hasValidCondition = false;
  //           let joinMode = "all";
  //           if (/\s*\|\|\s*/.test(text)) {
  //             joinMode = "any";
  //           }
  //           text.split(/\s*(&&|\|\|)\s*/g).forEach((conditinString: string) => {
  //             const conditions = conditinString.split(/\s+/g);
  //             if (
  //               conditions.length == 3 &&
  //               operators.indexOf(conditions[1]) != -1
  //             ) {
  //               hasValidCondition = true;
  //               s.addCondition(
  //                 "joinMode",
  //                 joinMode as _ZoteroTypes.Search.Operator,
  //                 "",
  //               );
  //               s.addCondition(
  //                 conditions[0] as string,
  //                 conditions[1] as _ZoteroTypes.Search.Operator,
  //                 conditions[2] as string,
  //               );
  //             }
  //           });
  //           if (hasValidCondition) {
  //             ids = await s.search();
  //           }
  //         }
  //         ids = filter(ids);
  //         console.log(ids.length);
  //         if (ids.length > 0) {
  //           ids.forEach((id: number) => {
  //             const item = Zotero.Items.get(id);
  //             const title = item.getField("title");
  //             const ele = ztoolkit.UI.createElement(window.document!, "div", {
  //               namespace: "html",
  //               classList: ["command"],
  //               listeners: [
  //                 {
  //                   type: "mousemove",
  //                   listener: function () {
  //                     // @ts-expect-error ignore
  //                     prompt.selectItem(this);
  //                   },
  //                 },
  //                 {
  //                   type: "click",
  //                   listener: () => {
  //                     prompt.promptNode.style.display = "none";
  //                     ztoolkit.getGlobal("Zotero_Tabs").select("zotero-pane");
  //                     ztoolkit.getGlobal("ZoteroPane").selectItem(item.id);
  //                   },
  //                 },
  //               ],
  //               styles: {
  //                 display: "flex",
  //                 flexDirection: "column",
  //                 justifyContent: "start",
  //               },
  //               children: [
  //                 {
  //                   tag: "span",
  //                   styles: {
  //                     fontWeight: "bold",
  //                     overflow: "hidden",
  //                     textOverflow: "ellipsis",
  //                     whiteSpace: "nowrap",
  //                   },
  //                   properties: {
  //                     innerText: title,
  //                   },
  //                 },
  //                 {
  //                   tag: "span",
  //                   styles: {
  //                     overflow: "hidden",
  //                     textOverflow: "ellipsis",
  //                     whiteSpace: "nowrap",
  //                   },
  //                   properties: {
  //                     innerHTML: getItemDescription(item),
  //                   },
  //                 },
  //               ],
  //             });
  //             container.appendChild(ele);
  //           });
  //         } else {
  //           // @ts-expect-error ignore
  //           prompt.exit();
  //           prompt.showTip("Not Found.");
  //         }
  //       },
  //     },
  //   ]);
  // }

  // @example
  // static registerConditionalCommandExample() {
  //   ztoolkit.Prompt.register([
  //     {
  //       name: "Conditional Command Test",
  //       label: "Plugin Template",
  //       // The when function is executed when Prompt UI is woken up by `Shift + P`, and this command does not display when false is returned.
  //       when: () => {
  //         const items = ztoolkit.getGlobal("ZoteroPane").getSelectedItems();
  //         return items.length > 0;
  //       },
  //       callback(prompt) {
  //         prompt.inputNode.placeholder = "Hello World!";
  //         const items = ztoolkit.getGlobal("ZoteroPane").getSelectedItems();
  //         ztoolkit.getGlobal("alert")(
  //           `You select ${items.length} items!\n\n${items
  //             .map(
  //               (item, index) =>
  //                 String(index + 1) + ". " + item.getDisplayTitle(),
  //             )
  //             .join("\n")}`,
  //         );
  //       },
  //     },
  //   ]);
  // }
}

export class HelperExampleFactory {
  // @example
  // static clipboardExample() {
  //   new ztoolkit.Clipboard()
  //     .addText(
  //       "![Plugin Template](https://github.com/windingwind/zotero-plugin-template)",
  //       "text/unicode",
  //     )
  //     .addText(
  //       '<a href="https://github.com/windingwind/zotero-plugin-template">Plugin Template</a>',
  //       "text/html",
  //     )
  //     .copy();
  //   ztoolkit.getGlobal("alert")("Copied!");
  // }

  // @example
  // static async filePickerExample() {
  //   const path = await new ztoolkit.FilePicker(
  //     "Import File",
  //     "open",
  //     [
  //       ["PNG File(*.png)", "*.png"],
  //       ["Any", "*.*"],
  //     ],
  //     "image.png",
  //   ).open();
  //   ztoolkit.getGlobal("alert")(`Selected ${path}`);
  // }

  // @example
  // static progressWindowExample() {
  //   new ztoolkit.ProgressWindow(addon.data.config.addonName)
  //     .createLine({
  //       text: "ProgressWindow Example!",
  //       type: "success",
  //       progress: 100,
  //     })
  //     .show();
  // }

  // @example
  // static vtableExample() {
  //   ztoolkit.getGlobal("alert")("See src/modules/preferenceScript.ts");
  // }
}

/**
 * Zotero.ZotFile.Wildcards
 * Functions to replace wildcards and construct filename
 */
Zotero.ZotFile7.Wildcards = new class {
    private _this = this;
    public emptyCollectionPlaceholder = "EMPTY_COLLECTION_NAME";

    /**
     * Abbreviation field using Zotero's getAbbreviation function
     */
    private abbreviateField(value: string): string {
        let abbrv: string;
        if (value != "") {
            const abbrv_obj: any = new Object();
            Zotero.Cite.getAbbreviation("N/A", abbrv_obj, "default", "container-title", value);
            abbrv = abbrv_obj["default"]["container-title"][value];
        } else {
            abbrv = "";
        }
        return abbrv;
    }

    /**
     * Performs a binary search that returns the index of the array before which the
     * search should be inserted into the array to maintain a sorted order.
     */
    private binaryArrayIndex(obj: number[], find: number): number {
        let low = 0, high = obj.length - 1, i = 0;
        while (low <= high) {
            i = Math.floor((low + high) / 2);
            if (obj[i] < find) {
                low = i + 1;
                continue;
            }
            if (obj[i] > find) {
                high = i - 1;
                continue;
            }
            return i;
        }
        if (obj[i] < find) return i + 1;
        else return i;
    }

    /**
     * Collects all positions of a particular substring in an Array.
     */
    private findStrPos(rule: string, str: string): number[] {
        const positions: number[] = new Array();
        let last = rule.indexOf(str);
        while (last > -1) {
            positions.push(last);
            last = rule.indexOf(str, last + 1);
        }
        return positions;
    }

    private truncateTitle(title: any): string {
        title = '' + title;

        // truncate title after : . and ?
        if (Zotero.ZotFile7.getPref("truncate_title")) {
            const truncate = title.search(/:|\.|\?|\!/);
            if (truncate != -1) title = title.substr(0, truncate);
        }

        // truncate if too long
        if (title.length > Zotero.ZotFile7.getPref("max_titlelength")) {
            const max_titlelength = Zotero.ZotFile7.getPref("max_titlelength");
            const before_trunc_char = title.substr(max_titlelength, 1);

            // truncate title at max length
            title = title.substr(0, max_titlelength);

            // remove the last word until a space is found
            if (Zotero.ZotFile7.getPref("truncate_smart") && title.search(" ") != -1 && before_trunc_char.search(/[a-zA-Z0-9]/) != -1) {
                while (title.substring(title.length - 1, title.length) != ' ') title = title.substring(0, title.length - 1);
                title = title.substring(0, title.length - 1);
            }
        } else {
            // remove some non letter characters if they appear at the end of the title that was not truncated
            const endchar = title.substring(title.length - 1, title.length);
            if (endchar == ':' || endchar == '?' || endchar == '.' || endchar == '/' || endchar == '\\' || endchar == '>' || endchar == '<' || endchar == '*' || endchar == '|') {
                title = title.substring(0, title.length - 1);
            }
        }

        // replace forbidden characters with meaningful alternatives (they can only appear in the middle of the text at this point)
        title = title.replace(/[\/\\]/g, '-');
        title = title.replace(/[\*|"<>]/g, '');
        title = title.replace(/[\?:]/g, ' -');
        return title;
    }

    /**
     * Iterates through a string or until a mismatch between opening and closing
     * character is found. Returns the start and end position of the first outer
     * match or -1 if no match was found.
     */
    private findOuterPairs(rule: string, open: string = "{", close: string = "}"): Array<{start: number, end: number}> {
        const matching: number[] = new Array();
        const outer: Array<{start: number, end: number}> = new Array();
        let res: {start: number, end: number} = {start: -1, end: -1};
        for (let i = 0; i < rule.length; ++i) {
            if (rule[i] === open) {
                matching.push(i);
                if (res.start < 0) res.start = i;
            } else if (rule[i] === close) {
                if (matching.length === 0) {
                    Zotero.ZotFile7.messages_error.push(Zotero.ZotFile7.ZFgetString('renaming.errorFormat.closing', [close, i]));
                }
                matching.pop();
                if (matching.length === 0) {
                    res.end = i;
                    outer.push(res);
                    res = {start: -1, end: -1};
                }
            }
        }
        if (matching.length > 0) {
            Zotero.ZotFile7.messages_error.push(Zotero.ZotFile7.ZFgetString('renaming.errorFormat.opening', [open, matching[0]]));
        }
        return outer;
    }

    private formatAuthors(item: Zotero.Item): string[] {
        // get creator and create authors string
        const itemType = Zotero.ItemTypes.getName(item.itemTypeID);
        const creatorTypeIDs = [Zotero.CreatorTypes.getPrimaryIDForType(item.itemTypeID)];
        let add_etal = Zotero.ZotFile.getPref("add_etal");
        let author = "", author_lastf = "", author_initials = "", author_lastg = "";
        const creators = item.getCreators();
        let numauthors = creators.length;
        for (let i = 0; i < creators.length; ++i) {
            if (creatorTypeIDs.indexOf(creators[i].creatorTypeID) === -1) numauthors = numauthors - 1;
        }
        const max_authors = (Zotero.ZotFile.getPref("truncate_authors")) ? Zotero.ZotFile.getPref("max_authors") : 500;
        if (numauthors <= max_authors) add_etal = false;
        else numauthors = Zotero.ZotFile.getPref("number_truncate_authors");
        const delimiter = Zotero.ZotFile.getPref("authors_delimiter");
        let j = 0;
        for (let i = 0; i < creators.length; ++i) {
            if (j < numauthors && creatorTypeIDs.indexOf(creators[i].creatorTypeID) != -1) {
                if (author !== "") author += delimiter + creators[i].lastName;
                if (author === "") author = creators[i].lastName;
                const lastf = creators[i].lastName + creators[i].firstName.substr(0, 1).toUpperCase();
                if (author_lastf !== "") author_lastf += delimiter + lastf;
                if (author_lastf === "") author_lastf = lastf;
                const initials = creators[i].firstName.substr(0, 1).toUpperCase() + creators[i].lastName.substr(0, 1).toUpperCase();
                if (author_initials !== "") author_initials += delimiter + initials;
                if (author_initials === "") author_initials = initials;
                const lastg = creators[i].lastName + ", " + creators[i].firstName;
                if (author_lastg !== "") author_lastg += delimiter + lastg;
                if (author_lastg === "") author_lastg = lastg;
                j = j + 1;
            }
        }
        if (add_etal) {
            author = author + Zotero.ZotFile.getPref("etal");
            author_lastf = author_lastf + Zotero.ZotFile.getPref("etal");
            author_initials = author_initials + Zotero.ZotFile.getPref("etal");
            author_lastg = author_lastg + Zotero.ZotFile.getPref("etal");
        }
        // create last (senior) author string
        let lastAuthor = "", lastAuthor_lastf = "", lastAuthor_initials = "", lastAuthor_lastInitial = "";
        if (creators.length > 0) {
            lastAuthor = creators[creators.length - 1].lastName;
            lastAuthor_lastf = creators[creators.length - 1].lastName + creators[creators.length - 1].firstName.substr(0, 1).toUpperCase();
            lastAuthor_initials = creators[creators.length - 1].firstName.substr(0, 1).toUpperCase() + creators[creators.length - 1].lastName.substr(0, 1).toUpperCase();
            lastAuthor_lastInitial = creators[creators.length - 1].lastName.substr(0, 1).toUpperCase();
        }
        // get creator and create editors string
        const editorType = [Zotero.CreatorTypes.getID('editor')];
        let editor = "", editor_lastf = "", editor_initials = "";
        let numeditors = creators.length;
        for (let i = 0; i < creators.length; ++i) {
            if (editorType.indexOf(creators[i].creatorTypeID) === -1) numeditors = numeditors - 1;
        }
        if (numeditors <= max_authors) add_etal = false;
        else numeditors = Zotero.ZotFile.getPref("number_truncate_authors");
        j = 0;
        for (let i = 0; i < creators.length; ++i) {
            if (j < numeditors && editorType.indexOf(creators[i].creatorTypeID) != -1) {
                if (editor !== "") editor += delimiter + creators[i].lastName;
                if (editor === "") editor = creators[i].lastName;
                const lastf = creators[i].lastName + creators[i].firstName.substr(0, 1).toUpperCase();
                if (editor_lastf !== "") editor_lastf += delimiter + lastf;
                if (editor_lastf === "") editor_lastf = lastf;
                const initials = creators[i].firstName.substr(0, 1).toUpperCase() + creators[i].lastName.substr(0, 1).toUpperCase();
                if (editor_initials !== "") editor_initials += delimiter + initials;
                if (editor_initials === "") editor_initials = initials;
                j = j + 1;
            }
        }
        return [author, author_lastf, author_initials, editor, editor_lastf, editor_initials, author_lastg, lastAuthor, lastAuthor_lastInitial, lastAuthor_lastf, lastAuthor_initials];
    }

    private wildcardTable(item: Zotero.Item): { [key: string]: any } {
        // item type
        const item_type = item.itemTypeID;
        const item_type_name = Zotero.ItemTypes.getName(item_type);
        // get formatted author strings
        const authors = this.formatAuthors(item);
        // define additional fields
        const addFields: { [key: string]: any } = {
            'itemTypeEN': Zotero.ItemTypes.getName(item_type),
            'itemType': Zotero.ItemTypes.getLocalizedString(item_type),
            'titleFormated': this.truncateTitle(item.getField("title", false, true)),
            'author': authors[0],
            'authorLastF': authors[1],
            'authorInitials': authors[2],
            'editor': authors[3],
            'editorLastF': authors[4],
            'editorInitials': authors[5],
            'authorLastG': authors[6],
            "lastAuthor": authors[7],
            "lastAuthor_lastInitial": authors[8],
            "lastAuthor_lastf": authors[9],
            "lastAuthor_initials": authors[10],
            "collectionPaths": Zotero.ZotFile.Utils.getCollectionPathsOfItem(item),
            "citekey": Zotero.BetterBibTeX ? item.getField('citationKey') : undefined
        };

        // define transform functions
        const itemtypeWildcard = function (item: Zotero.Item, map: any): string {
            let value = '',
                property = (item_type_name in map) ? map[item_type_name] : map['default'];
            if (typeof (property) == 'string')
                value = (property in addFields) ? addFields[property] : item.getField(property, false, true);
            if (typeof (property) == 'object')
                value = regexWildcard(item, property);
            return value;
        };

        const regexWildcard = function (item: Zotero.Item, w: any): string {
            let field = w.field,
                operations = w.operations,
                output = '';
            // get field
            if (typeof (field) == 'string')
                output = (field in addFields) ? addFields[field] : item.getField(field, false, true);
            if (typeof (field) == 'object')
                output = itemtypeWildcard(item, field);
            // operations
            if (operations !== undefined) {
                for (let i = 0; i < operations.length; ++i) {
                    const obj = operations[i],
                        regex = obj.regex,
                        replacement = ('replacement' in obj) ? obj.replacement : "",
                        flags = ('flags' in obj) ? obj.flags : "g",
                        group = ('group' in obj) ? obj.group : 0,
                        re = new RegExp(regex, flags);
                    // replace string
                    /*https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace*/
                    if (obj.function == "replace")
                        output = output.replace(re, replacement);
                    // search for matches
                    /*https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec*/
                    if (obj.function == "exec") {
                        const match = re.exec(output);
                        output = (match === null) ? output : match[group];
                    }
                    if (obj.function == "abbreviate") {
                        output = this.abbreviateField(output);
                    }
                    // simple functions
                    if (obj.function == "toLowerCase")
                        output = output.toLowerCase();
                    if (obj.function == "toUpperCase")
                        output = output.toUpperCase();
                    if (obj.function == "trim")
                        output = output.trim();
                    if (obj.function == "truncateTitle")
                        output = this.truncateTitle(output);
                }
            }
            // return
            return output;
        }.bind(this);

        // get wildcards object from preferences
        const wildcards = JSON.parse(Zotero.ZotFile.getPref("wildcards.default"));
        const wildcards_user = JSON.parse(Zotero.ZotFile.getPref("wildcards.user"));
        for (const key in wildcards_user) { wildcards[key] = wildcards_user[key]; }
        // define wildcard table for item by iterating through wildcards
        const table: { [key: string]: any } = {};
        for (const key in wildcards) {
            const property = wildcards[key];
            let value = '';
            // if string, get field from zotero or using additional fields
            if (typeof (property) == 'string')
                value = (property in addFields) ? addFields[property] : item.getField(property, false, true);
            if (typeof (property) == 'object') {
                // javascript object with item type specific field names (e.g. '%w')
                /* Note: 'default' key defines default, only include item types that are different */
                if ('default' in property) value = itemtypeWildcard(item, property);
                // javascript object with three elements for field, regular expression, and group (e.g. '%y')
                if ('field' in property) value = regexWildcard(item, property);
            }
            // add element to wildcards table
            table['%' + key] = value;
        }

        // return
        return table;
    }

    private fillRule(rule: string, table: { [key: string]: any }, offset: number): { str: string, complete: boolean } {
        const wildcards = this.findStrPos(rule, "%");
        const bars = this.findStrPos(rule, "|");
        let exclusive = "";
        const str: string[] = new Array();
        let complete = true;
        // for first loop excl_complete must be true
        let excl_complete = true;
        let pos = 0;
        let last = -1;
        let lookup: any;

        for (let i = 0; i < bars.length; ++i) {
            // position of current | in wildcards
            pos = this.binaryArrayIndex(wildcards, bars[i]);
            // no wildcard between previous and current |
            if (pos - 1 < last || pos === 0) {
                Zotero.ZotFile.messages_error.push(Zotero.ZotFile.ZFgetString('renaming.errorFormat.left', [offset + bars[i]]));
            }
            // no wildcard between current and next | or no more wildcards left
            if (wildcards[pos] > bars[i + 1] || pos === wildcards.length) {
                Zotero.ZotFile.messages_error.push(Zotero.ZotFile.ZFgetString('renaming.errorFormat.right', [offset + bars[i]]));
            }
            if (pos - last > 1) {
                // all look-ups in an exclusive group failed
                if (!excl_complete) complete = false;
                // reset
                excl_complete = false;
                if (exclusive !== "") {
                    // add content of previous exclusive group
                    str.push(exclusive);
                    // reset
                    exclusive = "";
                }
                for (let j = last + 1; j < pos - 1; ++j) {
                    // add rule content before wildcard
                    // wildcards[-1] is undefined, undefined + 2 is NaN
                    // substring(NaN, x) is from the beginning of the string ;-]
                    str.push(rule.substring(wildcards[j - 1] + 2, wildcards[j]));
                    // add content of wildcard
                    lookup = table[rule.substr(wildcards[j], 2)];
                    if (lookup === "" || typeof (lookup) === "undefined") complete = false;
                    else str.push(lookup);
                }
                // add rule content between last and current wildcard
                str.push(rule.substring(wildcards[j - 1] + 2, wildcards[j]));
            }
            lookup = table[rule.substr(wildcards[pos - 1], 2)];
            if (lookup === "" || typeof (lookup) === "undefined") excl_complete = excl_complete || false;
            else {
                exclusive = exclusive || lookup;
                excl_complete = excl_complete || true;
            }
            lookup = table[rule.substr(wildcards[pos], 2)];
            if (lookup === "" || typeof (lookup) === "undefined") excl_complete = excl_complete || false;
            else {
                exclusive = exclusive || lookup;
                excl_complete = excl_complete || true;
            }
            last = pos;
        }
        if (!excl_complete) complete = false;
        if (exclusive !== "") {
            str.push(exclusive);
        }
        for (let j = last + 1; j < wildcards.length; ++j) {
            // add rule content before wildcard
            str.push(rule.substring(wildcards[j - 1] + 2, wildcards[j]));
            // add content of wildcard
            const wildcard = rule.substr(wildcards[j], 2);
            lookup = table[wildcard];
            // if it is a collectionPath field. we need to select one element from the array.
            if (lookup && Array.isArray(lookup)) {
                const getCollectionPathFromTable = (): string => {
                    const selectFromList = function (items: string[], message: string, title: string): number {
                        const prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                            .getService(Components.interfaces.nsIPromptService);
                        const selected: any = {};
                        const result = prompts.select(null, title, message, items.length, items, selected);
                        if (!result) return -1;

                        return selected.value;
                    };

                    const collectionPaths = lookup;
                    if (collectionPaths.length === 0) return this.emptyCollectionPlaceholder;
                    if (collectionPaths.length === 1) return collectionPaths[0];

                    const title = table['%t'];
                    const idx = selectFromList(collectionPaths, title, title);
                    if (idx >= 0) return collectionPaths[idx];

                    throw {
                        name: 'UserAbortion',
                        message: 'this batch rename operation is canceled by user.'
                    };
                }.bind(this);
                lookup = getCollectionPathFromTable();
            }
            if (lookup === "" || typeof (lookup) === "undefined") complete = false;
            else str.push(lookup);
        }
        // add rule content after last wildcard
        str.push(rule.substring(wildcards[wildcards.length - 1] + 2));
        return { "str": str.join(""), "complete": complete };
    }

    /**
     * Replace wildcards both for filename and subfolder definition
     * List of field names: https://api.zotero.org/itemFields?pprint=1
     */
    public replaceWildcard(item: Zotero.Item, rule: string, table?: { [key: string]: any }, offset?: number): string {
        if (rule === "" || typeof (rule) === "undefined") return "";
        table = (typeof (table) === "undefined") ? this.wildcardTable(item) : table;
        offset = (typeof (offset) === "undefined") ? 0 : offset;
        const conditional = this.findOuterPairs(rule),
            name: string[] = new Array(),
            last = -1;
        let res: { str: string, complete: boolean },
            complete = true;

        for (let i = 0; i < conditional.length; ++i) {
            res = this.fillRule(rule.substring(last + 1, conditional[i].start), table, last + 1);
            complete = complete && res.complete;
            name.push(res.str);
            name.push(this.replaceWildcard(item, rule.substring(conditional[i].start + 1, conditional[i].end), table, conditional[i].start + 1));
            last = conditional[i].end;
        }
        res = this.fillRule(rule.substring(last + 1, rule.length), table, last + 1);
        complete = complete && res.complete;
        // we're in recursive call and a wildcard was not complete
        if (offset > 0 && !complete) return "";
        name.push(res.str);
        return name.join("");
    }
}();
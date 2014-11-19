var debug = require('debug');

Array.prototype.unique = function () {
    var a = [];
    for (var i = 0, l = this.length; i < l; i++) {
        if (a.indexOf(this[i]) === -1) {
            a.push(this[i]);
        }
    }
    return a;
};

function FullTextSearchLight(name) {

    this.config = {
        name: name,
        index_amount: 12,
        ignore_case: true,
        debug: false
    };

    this.indexes = [];
    this.data = [];
    this.data_ptr = 0;
    this.free_slots = [];
    this.single_data_counter = 0;
};

FullTextSearchLight.prototype.name = function (text) {
    if (text) {
        this.config.name = text;
        return;
    }

    return this.config.name;
};

FullTextSearchLight.prototype.index_amount = function (amount) {
    if (amount) {
        this.config.index_amount = amount;
        return;
    }
    return this.config.index_amount;
};

FullTextSearchLight.prototype.ignore_case = function (bool) {
    if (bool === true || bool === false) {
        this.config.ignore_case = bool;
        return;
    }
    return this.config.ignore_case;
};

FullTextSearchLight.prototype.debug_full_text = function () {
    // dummy skeleton
};

FullTextSearchLight.prototype.debug_full_text_add = function () {
    // dummy skeleton
};

FullTextSearchLight.prototype.debug_full_text_remove = function () {
    // dummy skeleton
};

FullTextSearchLight.prototype.debug_full_text_search = function () {
    // dummy skeleton
};

FullTextSearchLight.prototype.init = function (options) {
    if (options) {
        if (options.index_amount) {
            this.config.index_amount = options.index_amount;
        }
        if (options.ignore_case) {
            this.config.ignore_case = options.ignore_case;
        }
    }

    // Create indexes
    for (var i = 0; i < this.config.index_amount; i++) {
        this.indexes.push({});
    }

    // Level1: Stores ids by only one char: { a: [1,2,3] , b: ... c: ...}
    // Level2: Stores ids by two chars: { an: [1,2,3] , al: ... ,pe: ..., te: ...}
    // Level2: Stores ids by three chars: { tre: [1,2,3] , pee: ... ,mes: ..., fuk: ...}
    // special chars, all kinds of chars included
};


FullTextSearchLight.prototype.debug = function (bool) {
    if (bool === true) {
        this.config.debug = true;

        debug.enable('*');
        this.debug_full_text = debug('main');
        this.debug_full_text_remove = debug('remove');
        this.debug_full_text_add = debug('add');
        this.debug_full_text_search = debug('search');
        return;
    }

    if (bool === false) {
        this.config.debug = false;
        this.debug_full_text = function () {
        };
        this.debug_full_text_remove = function () {
        };
        this.debug_full_text_add = function () {
        };
        this.debug_full_text_search = function () {
        };
        debug.disable();
    }
};

FullTextSearchLight.prototype.traverse = function (object, func, filter) {
    for (var key in object) {

        if (filter && filter(key, object) === false) {
            this.debug_full_text('Ignore field \'' + key + '\'');
            continue;
        }

        // Only care about primitives
        if (object[key] !== null && (object[key].constructor === Number || object[key].constructor === String || object[key].constructor === Boolean)) {
            func.apply(this, [key, object[key]]);
        }

        if (object[key] !== null && typeof(object[key]) == "object") {
            //going on step down in the object tree!!
            this.traverse(object[key], func, filter);
        }
    }
};

FullTextSearchLight.prototype.traverseCheck = function (obj, search, result) {

    this.traverse(obj, function (key, value) {
        // Already matched
        if (result.match === true) {
            return;
        }

        var v = value;

        if (value.constructor === String) {
            v = value;
        }

        if (value.constructor === Number || value.constructor === Boolean) {
            v = value.toString();
        }

        if (this.config.ignore_case === true) {
            v = v.toLowerCase();
        }

        // Search term matched
        if (v.indexOf(search) > -1) {
            result.match = true;
            return;
        }
    });
};

FullTextSearchLight.prototype.add = function (obj, filter) {

    // Define data index
    var index = this.nextFreeIndex();
    this.debug_full_text_add('Next free index for ' + JSON.stringify(obj) + ': ' + index);

    // Store data
    this.data[index] = obj;

    // Add to index
    this.addToIndex(obj, index, filter);

    return index;
};


FullTextSearchLight.prototype.addToIndex = function (obj, index, filter) {

    var self = this;

    if (obj.constructor === String || obj.constructor === Number || obj.constructor === Boolean) {

        ++this.single_data_counter;

        // Create all parts for all indexes
        for (var i = 0; i < this.indexes.length; i++) {

            if (obj.constructor === String) {
                if (this.config.debug) {
                    this.debug_full_text_add('Type of data: String');
                }
                var text = this.config.ignore_case === true ? obj.toLowerCase() : obj;
            }

            if (obj.constructor === Number || obj.constructor === Boolean) {
                if (this.config.debug) {
                    this.debug_full_text_add('Type of data: Number | Boolean');
                }
                var text = obj.toString();
            }

            // Split into parts, care about case sensitivity
            var parts = this.cut(text, i + 1);

            if (this.config.debug) {
                this.debug_full_text_add('Parts for ' + JSON.stringify(obj) + ': ' + JSON.stringify(parts));
            }

            // Stop if it is not splittable anymore
            if (parts.length == 0) {
                break;
            }

            for (var j = 0; j < parts.length; j++) {

                if (!this.indexes[i][parts[j]]) {
                    this.indexes[i][parts[j]] = [];
                }

                // Level 1...n index, no duplicates
                if (this.indexes[i][parts[j]].indexOf(index) === -1) {
                    this.indexes[i][parts[j]].push(index);
                }
            }
        }

        return;
    }

    // Add object
    if (obj.constructor === Object || obj.constructor === Array || obj.constructor === Function) {

        this.traverse(obj, function (key, value) {
            self.addToIndex(value, index, filter);
        }, filter);
    }
};


FullTextSearchLight.prototype.search = function (text) {

    if (text === undefined || text === null || text === '') {
        return [];
    }

    if (text.constructor === Number || text.constructor === Boolean) {
        text = text.toString();
    }

    if (this.config.ignore_case === true) {
        text = text.toLowerCase();
    }

    if (this.config.debug) {
        this.debug_full_text_search('Search for \'' + text + '\'');
    }

    // 1) Search directly for the result
    if (text.length <= this.config.index_amount) {
        var index_nr = text.length - 1;
        if (this.config.debug) {
            this.debug_full_text_search('Text length is ' + text.length + ' so search in index ' + index_nr);
            this.debug_full_text_search('Index ' + index_nr + ' is ' + JSON.stringify(this.indexes[index_nr]));
        }
        var ids = this.indexes[index_nr][text];

        if (this.config.debug) {
            this.debug_full_text_search('Found ids for keyword \'' + text + '\': ' + JSON.stringify(ids));
        }

        if (!ids || ids.length == 0) {
            if (this.config.debug) {
                this.debug_full_text_search('Index found but no ids found');
            }
            return [];
        }

        var result = [];
        for (var i = 0; i < ids.length; i++) {
            result.push(this.data[ids[i]]);
        }
        return result;
    }

    // ---------- This code will be only be entered if the search index is to small for this search term -----------


    // 2) Seach indirectly
    if (this.config.debug) {
        this.debug_full_text_search('No matching index found, take the index with the longest words');
    }
    var last_index = this.indexes[this.indexes.length - 1];
    var text_length = this.indexes.length;
    var parts = this.cut(text, text_length);
    if (this.config.debug) {
        this.debug_full_text_search('Search for: ' + JSON.stringify(parts));
    }

    var ids = [];
    var parts_found_counter = 0;
    for (var i = 0; i < parts.length; i++) {

        // Nothing found for that part
        if (!last_index[parts[i]]) {
            continue;
        }

        ++parts_found_counter;

        for (var j = 0; j < last_index[parts[i]].length; j++) {
            ids.push(last_index[parts[i]][j]);
        }
    }

    if (this.config.debug) {
        this.debug_full_text_search('Found ids: ' + JSON.stringify(ids));
    }

    // Nothing found || The index is to small for the complete search word so the word is splitted in the biggest
    // indexed size. If not every part has a match the result is not valid.
    // 1) Example:  the word 'simpler' is added to the fulltext search, the index amount is 3.
    //      Now we search for the word 'sximp'
    //          a) First the word is splitted to: 'sxi', 'xim', 'imp'
    //          b) 'sxi': 0 matches, , 'xim': 0 matches, 'imp': 1 match
    if (ids.length == 0 || parts_found_counter < parts.length) {
        if(this.config.debug){
            this.debug_full_text_search('Nothing found for \'' + text + '\'');
        }
        return [];
    }


    // Count elements
    var counter = {};
    for (var i = 0; i < ids.length; i++) {
        if (!counter[ids[i]]) {
            counter[ids[i]] = 0;
        }
        counter[ids[i]]++;
    }

    if(this.config.debug){
        this.debug_full_text_search('Count occurence ' + JSON.stringify(counter));
    }

    var true_match_ids = [];

    // if counter == parts.length then its a hit
    for (var key in counter) {
        if (counter[key] === parts.length) {
            true_match_ids.push(key);
        }
    }

    if(this.config.debug){
        this.debug_full_text_search('True matching ids: ' + JSON.stringify(true_match_ids));
    }

    var result = [];

    for (var i = 0; i < true_match_ids.length; i++) {

        if(this.config.debug){
            this.debug_full_text_search('Data for id \'' + true_match_ids[i] + '\': ' + JSON.stringify(this.data[true_match_ids[i]]));
        }

        // String
        if (this.data[true_match_ids[i]].constructor === String) {
            if(this.config.debug){
                this.debug_full_text_search('Data[' + true_match_ids[i] + '] is string');
                this.debug_full_text_search('\'' + this.data[true_match_ids[i]] + '\' contains \'' + text + '\'?');
            }

            // Check if text is fully contained in the word
            if (this.data[true_match_ids[i]].toLowerCase().indexOf(text) > -1) {
                if(this.config.debug){
                    this.debug_full_text_search('Yes');
                }
                result.push(this.data[true_match_ids[i]]);
            }
            continue;
        }

        if (this.data[true_match_ids[i]].constructor === Number || this.data[true_match_ids[i]].constructor === Boolean) {
            if(this.config.debug){
                this.debug_full_text_search('Data[' + true_match_ids[i] + '] is boolean | number');
            }

            // Check if text is fully contained in the number or boolean
            if (this.data[true_match_ids[i]].toString().indexOf(text)) {
                result.push(this.data[true_match_ids[i]]);
            }
            continue;
        }

        if(this.config.debug){
            this.debug_full_text_search('Data[' + true_match_ids[i] + '] is object');
        }

        // If its a complex object like an array...
        var resp = {
            match: false
        };

        this.traverseCheck(this.data[true_match_ids[i]], text, resp);
        if (resp.match === true) {
            result.push(this.data[true_match_ids[i]]);
        }
    }
    return result;
};

FullTextSearchLight.prototype.removeData = function (data_index) {

    // Remove data
    this.data[data_index] = undefined;   // Just overwrite with undefined

    // Free for overwriting
    this.free_slots.push(data_index);

    if(this.config.debug){
        this.debug_full_text_remove('Add index data[' + data_index + '] to free slots: ' + JSON.stringify(this.free_slots));
    }
};

FullTextSearchLight.prototype.remove = function (data_index) {

    if(this.config.debug){
        this.debug_full_text_remove('Remove data-index: ' + data_index);
    }

    var obj = this.data[data_index];

    if(this.config.debug){
        this.debug_full_text_remove('Data for data-index \'' + data_index + '\' found: ' + JSON.stringify(obj));
    }

    // Primitive
    if (obj.constructor === Number || obj.constructor === Boolean) {
        obj = obj.toString();
    }

    if (obj.constructor === String) {

        if (this.config.ignore_case === true) {
            obj = obj.toLowerCase();
        }

        // Create all parts for all indexes and remove all data_indexes
        // If the data_index is found
        for (var i = 0; i < this.indexes.length; i++) {
            var parts = this.cut(obj, i + 1);
            for (var j = 0; j < parts.length; j++) {
                this.removePrimitve(parts[j], data_index);
            }
        }

        this.removeData(data_index);
        return;
    }

    // Complex Object
    this.traverse(obj, function (key, value) {

        if (value.constructor === Boolean || value.constructor === Number) {
            value = value.toString();
        }

        // Create all parts for all indexes and remove all data_indexes
        // If the data_index is found
        for (var i = 0; i < this.indexes.length; i++) {
            var parts = this.cut(value, i + 1);
            for (var j = 0; j < parts.length; j++) {
                this.removePrimitve(parts[j], data_index);
            }
        }
    });
    this.removeData(data_index);
};


FullTextSearchLight.prototype.removePrimitve = function (text, data_index) {

    if(this.config.debug){
        this.debug_full_text_remove('Remove primitive \'' + text + '\'.');
    }

    // 1) Search directly for the result
    if (text.length <= this.config.index_amount) {
        var index_nr = text.length - 1;

        if(this.config.debug){
            this.debug_full_text_remove('Text length is ' + text.length + ' so search in index ' + index_nr);
            this.debug_full_text_remove('Index ' + index_nr + ' is ' + JSON.stringify(this.indexes[index_nr]));
        }
        var ids = this.indexes[index_nr][text];

        // Remove data_id out of index
        if(this.config.debug){
            this.debug_full_text_remove('Remove id \'' + data_index + '\' from ' + text + ':\'' + JSON.stringify(ids) + '\'');
        }
        this.removeFromArray(ids, data_index);

        // Is empty can be deleted, no further need
        if (ids.length == 0) {
            delete this.indexes[index_nr][text];
        }

        if(this.config.debug){
            this.debug_full_text_remove('Removed id, resulting ids are:' + JSON.stringify(ids));
        }

        return;
    }

    // 2) Search indirectly
    var last_index = this.indexes[this.indexes.length - 1];
    var text_length = this.indexes.length;
    var parts = this.cut(text, text_length);

    if(this.config.debug){
        this.debug_full_text_remove('Search for \'' + JSON.stringify(parts) + '\'');
    }

    var ids_arrays = [];
    var parts_found_counter = 0;
    for (var i = 0; i < parts.length; i++) {

        // Nothing found for that part
        if (!last_index[parts[i]]) {
            continue;
        }

        if(this.config.debug){
            this.debug_full_text_remove('Remove \'' + data_index + '\' in ' + last_index[parts[i]]);
        }
        this.removeFromArray(last_index[parts[i]], data_index);
        // Is empty can be deleted, no further need
        if (last_index[parts[i]].length == 0) {
            delete last_index[parts[i]];
        }
    }
};

FullTextSearchLight.prototype.removeFromArray = function (arr, val) {
    for (var i = arr.length - 1; i > -1; i--) {
        if (arr[i] == val) {
            arr.splice(i, 1);
        }
    }
};


FullTextSearchLight.prototype.drop = function () {
    this.indexes = [];
    this.data = [];
    this.data_ptr = 0;
    this.free_slots = [];
    this.init();
};


FullTextSearchLight.prototype.nextFreeIndex = function () {
    return this.data_ptr++;
};


FullTextSearchLight.prototype.cut = function (text, level) {
    if (level < 1) {
        throw new Error("Can't divide a word in smaller parts then 1 chacator");
        return;
    }

    if (text.constructor !== String) {
        throw new Error("Can't handle non-strings");
        return;
    }

    var parts = [];
    for (var i = 0; i < text.length; i++) {
        if (i + level > text.length) {
            break;
        }
        parts.push(text.substring(i, i + level));
    }

    return parts.unique();
};

module.exports = FullTextSearchLight;

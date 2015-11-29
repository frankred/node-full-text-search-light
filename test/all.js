var assert = require("assert");
var fs = require('fs');
var text_search_light = require('../index.js');

describe('full-text-search-light test', function () {


    describe('save and load', function () {

        it('saveSync and loadSync the current full text search', function () {
            var path = 'fullextsearch.json';
            var text_search = new text_search_light();
            text_search.add('Peter');
            text_search.add('Paul');
            text_search.add('Maria');
            text_search.saveSync(path);

            // File exists now
            assert(fs.existsSync(path) === true);

            // Same data structure
            var text_search2 = text_search_light.loadSync(path);

            assert.deepEqual(text_search, text_search2);

            // Check functions
            assert.deepEqual(text_search.search('P'), ['Peter', 'Paul']);
            assert.deepEqual(text_search.search('P'), text_search2.search('P'));

            fs.unlinkSync(path);
        });


        it('save and load the current full text search', function (done) {
            this.timeout(2000);
            var path = 'fullextsearch.json';
            var text_search = new text_search_light();
            text_search.add('Peter');
            text_search.add('Paul');
            text_search.add('Maria');

            text_search.save(path, function (error) {

                if (error) {
                    throw error;
                }

                // File exists now
                assert(fs.existsSync(path) === true);

                text_search_light.load(path, function (error, text_search2) {
                    if (error) {
                        throw error;
                    }

                    assert.deepEqual(text_search, text_search2);

                    // Check functions
                    assert.deepEqual(text_search.search('P'), ['Peter', 'Paul']);
                    assert.deepEqual(text_search.search('P'), text_search2.search('P'));

                    fs.unlinkSync(path);
                    done();
                });
            });
        });
    });


    describe('init: create empty indexes', function () {

        var amount = 12;

        var text_search = new text_search_light({
            debug: false,
            ignore_case: true,
            index_amount: amount
        });

        it('should create 12 empty objects', function () {
            assert.equal(amount, text_search.indexes.length);
            for (var i = 0; i < text_search.indexes.length; i++) {
                assert.equal(true, typeof text_search.indexes[i] === 'object');
            }
        });
    });

    describe('cut: cut words into 1...n big pieces', function () {

        var text_search = new text_search_light();

        it('should create pieces with the length 1 from the word \'joachim\' -> j,o,a,c,h,i,m (ignore duplicates)', function () {
            var result = text_search.cut("joachim", 1);
            var expectation_value = ["j", "o", "a", "c", "h", "i", "m"];
            assert.deepEqual(result, expectation_value);
        });

        it('should create pieces with the length 1 from the word \'hello world\' -> h,e,l,o, ,w,r,d (ignore duplicates)', function () {
            var result = text_search.cut("hello world", 1);
            var expectation_value = ["h", "e", "l", "o", " ", "w", "r", "d"];
            assert.deepEqual(result, expectation_value);
        });

        it('should create pieces with the length 3 from the word \'imslimshady\' -> ims,msl,sli,lim,msh,sha,had,ady  (ignore duplicates)', function () {
            var result = text_search.cut("imslimshady", 3);
            var expectation_value = ["ims", "msl", "sli", "lim", "msh", "sha", "had", "ady"];
            assert.deepEqual(result, expectation_value);
        });

        it('should create an empty array', function () {
            var result = text_search.cut("hello", 12);
            assert.deepEqual(result, []);
        });
    });


    describe('drop: drop all data, except of the configuration', function () {
        it('should drop all stored data', function () {
            var text_search = new text_search_light({
                index_amount: 12
            });
            text_search.add("joachim");

            text_search.drop();

            assert.deepEqual([
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {}
            ], text_search.indexes);
            assert.deepEqual([], text_search.data);
            assert.equal(0, text_search.data_ptr);
        });
    });


    describe('add: add string to index', function () {
        var text_search = new text_search_light({
            index_amount: 12
        });

        var text = 'hans peter';
        text_search.add(text);

        it('should create the 1-char index for \'hans peter\'', function () {
            var expectation_value_index_1 = {
                'h': [0], 'a': [0], 'n': [0], 's': [0], ' ': [0], 'p': [0], 'e': [0], 't': [0], 'r': [0]
            };
            assert.deepEqual(expectation_value_index_1, text_search.indexes[0]);
        });

        it('should create the 2-char index for \'hans peter\'', function () {
            var expectation_value_index_2 = {
                'ha': [0], 'an': [0], 'ns': [0], 's ': [0], ' p': [0], 'pe': [0], 'et': [0], 'te': [0], 'er': [0]
            };
            assert.deepEqual(expectation_value_index_2, text_search.indexes[1]);
        });

        it('should create the 3-char index for \'hans peter\'', function () {
            var expectation_value_index_3 = {
                'han': [0], 'ans': [0], 'ns ': [0], 's p': [0], ' pe': [0], 'pet': [0], 'ete': [0], 'ter': [0]
            };
            assert.deepEqual(expectation_value_index_3, text_search.indexes[2]);
        });

        it('should create the 4-char index for \'hans peter\'', function () {
            var expectation_value_index_4 = {
                'hans': [0], 'ans ': [0], 'ns p': [0], 's pe': [0], ' pet': [0], 'pete': [0], 'eter': [0]
            };
            assert.deepEqual(expectation_value_index_4, text_search.indexes[3]);
        });

        it('should create the 5-char index for \'hans peter\'', function () {
            var expectation_value_index_5 = {
                'hans ': [0], 'ans p': [0], 'ns pe': [0], 's pet': [0], ' pete': [0], 'peter': [0]
            };
            assert.deepEqual(expectation_value_index_5, text_search.indexes[4]);
        });

        it('should create the 6-char index for \'hans peter\'', function () {
            var expectation_value_index_6 = {
                'hans p': [0], 'ans pe': [0], 'ns pet': [0], 's pete': [0], ' peter': [0]
            };
            assert.deepEqual(expectation_value_index_6, text_search.indexes[5]);
        });

        it('should create the 7-char index for \'hans peter\'', function () {
            var expectation_value_index_7 = {
                'hans pe': [0], 'ans pet': [0], 'ns pete': [0], 's peter': [0]
            };
            assert.deepEqual(expectation_value_index_7, text_search.indexes[6]);
        });

        it('should create the 8-char index for \'hans peter\'', function () {
            var expectation_value_index_8 = {
                'hans pet': [0], 'ans pete': [0], 'ns peter': [0]
            };
            assert.deepEqual(expectation_value_index_8, text_search.indexes[7]);
        });

        it('should create the 9-char index for \'hans peter\'', function () {
            var expectation_value_index_9 = {
                'hans pete': [0], 'ans peter': [0]
            };
            assert.deepEqual(expectation_value_index_9, text_search.indexes[8]);
        });

        it('should create the 10-char index for \'hans peter\'', function () {
            var expectation_value_index_10 = {
                'hans peter': [0]
            };
            assert.deepEqual(expectation_value_index_10, text_search.indexes[9]);
        });

        it('should create the 11-char index for \'hans peter\' which should be empty', function () {
            var expectation_value_index_11 = {};
            assert.deepEqual(expectation_value_index_11, text_search.indexes[10]);
        });
    });

    describe('add: add obj to index', function () {
        var text_search = new text_search_light({
            index_amount: 3
        });

        var obj = {
            text: "simpler",
            array: ["hans", 88, {yolo: "ono"}],
            object: {
                blaa: "blubb",
                x: {
                    k: 'm',
                    h: 12304,
                    i: false
                }
            }
        };

        text_search.add(obj);

        it('should create the 1-char index for \'' + JSON.stringify(obj) + '\'', function () {
            var expectation_value_index_1 = {
                's': [0], 'i': [0], 'm': [0], 'p': [0], 'l': [0], 'e': [0], 'r': [0],
                'h': [0], 'a': [0], 'n': [0], 's': [0],
                '8': [0],
                'o': [0],
                'b': [0], 'u': [0],
                '1': [0], '2': [0], '3': [0], '0': [0], '4': [0],
                'f': [0]
            };
            assert.deepEqual(expectation_value_index_1, text_search.indexes[0]);
        });


        it('should create the 2-char index for \'' + JSON.stringify(obj) + '\'', function () {
            var expectation_value_index_2 = {
                'si': [0], 'im': [0], 'mp': [0], 'pl': [0], 'le': [0], 'er': [0],
                'ha': [0], 'an': [0], 'ns': [0],
                '88': [0],
                'on': [0], 'no': [0],
                'bl': [0], 'lu': [0], 'ub': [0], 'bb': [0],
                '12': [0], '23': [0], '30': [0], '04': [0],
                'fa': [0], 'al': [0], 'ls': [0], 'se': [0]
            };
            assert.deepEqual(expectation_value_index_2, text_search.indexes[1]);
        });
    });


    describe('add: add obj to index with filter', function () {

        var text_search = new text_search_light({
            index_amount: 3
        });

        var obj = {
            text: "simpler",
            bool: false,
            array: ["hans", 88, {yolo: "ono"}],
            object: {
                blaa: "blubb",
                x: {
                    k: 'm',
                    h: 12304,
                    i: false
                }
            },
            z: 42
        };

        var filter = function (key, val) {
            if (key == 'array' || key == 'x') {
                return false;
            }
        };

        text_search.add(obj, filter);

        it('should create the 1-char index for \'' + JSON.stringify(obj) + '\' with the filter ' + JSON.stringify(filter), function () {
            var expectation_value_index_1 = {
                's': [0], 'i': [0], 'm': [0], 'p': [0], 'l': [0], 'e': [0], 'r': [0],
                'f': [0], 'a': [0],
                'b': [0], 'u': [0],
                '4': [0], '2': [0]

            };
            assert.deepEqual(expectation_value_index_1, text_search.indexes[0]);
        });

        it('should find nothing beacause that attributes are filtered where the search term occurs', function () {
            assert.deepEqual([], text_search.search('hans'));
            assert.deepEqual([], text_search.search(88));
            assert.deepEqual([], text_search.search('ono'));
        });

        it('should find nothing', function () {
            assert.deepEqual([], text_search.search('sximp'));
            assert.deepEqual([], text_search.search('bubb'));
            assert.deepEqual([], text_search.search('ibb'));
            assert.deepEqual([], text_search.search('ibb'));
            assert.deepEqual([], text_search.search(88));
            assert.deepEqual([], text_search.search('88'));
            assert.deepEqual([], text_search.search(8));
            assert.deepEqual([], text_search.search(123));
        });

        it('should find obj', function () {
            assert.deepEqual([obj], text_search.search('b'));
            assert.deepEqual([obj], text_search.search(42));
            assert.deepEqual([obj], text_search.search('42'));
            assert.deepEqual([obj], text_search.search('4'));
            assert.deepEqual([obj], text_search.search('2'));
            assert.deepEqual([obj], text_search.search('bb'));
            assert.deepEqual([obj], text_search.search('imp'));
            assert.deepEqual([obj], text_search.search(false));
            assert.deepEqual([obj], text_search.search('false'));
            assert.deepEqual([obj], text_search.search('blubb'));
        });
    });


    describe('search: search for items', function () {
        it('trivial search: text.length <= index amount', function () {
            var text_search = new text_search_light({
                ignore_case: true,
                index_amount: 5
            });

            text_search.add("Joachim Herrfrau");
            text_search.add("Frank Grün");
            text_search.add("Andreas Knerenz");
            text_search.add("Clemens Mitt");
            text_search.add("David Knorat");

            var result = text_search.search("fr");

            assert.deepEqual(["Joachim Herrfrau", "Frank Grün"], result);
        });


        it('trivial search: text.length > index amount', function () {
            var text_search = new text_search_light({
                ignore_case: true,
                index_amount: 5
            });

            text_search.add("Joachim Herrfrau");
            text_search.add("Frank Grün");
            text_search.add("Andreas Knerenz");
            text_search.add("Clemens Mitt");
            text_search.add("David Knorat");

            var result = text_search.search("Andreas");

            assert.deepEqual(["Andreas Knerenz"], result);
        });
    });

    describe('search: empty search', function () {
        var text_search = new text_search_light({
            ignore_case: true,
            index_amount: 5
        });

        text_search.add("Joachim Herrfrau");
        text_search.add("Frank Grün");
        text_search.add("Andreas Knerenz");
        text_search.add("Clemens Mitt");
        text_search.add("David Knorat");

        assert.deepEqual([], text_search.search(''));

    });


    describe('remove: remove string from index', function () {
        var text_search = new text_search_light({
            index_amount: 12
        });

        var text = 'hans peter';
        var id = text_search.add(text);
        text_search.remove(id);

        it('should remove every id=0 for \'hans peter\' in 1-char index', function () {
            var expectation_value_index_1 = {};
            assert.deepEqual(expectation_value_index_1, text_search.indexes[0]);
        });

        it('should remove every id=0 for \'hans peter\' in 2-char index', function () {
            var expectation_value_index_2 = {};
            assert.deepEqual(expectation_value_index_2, text_search.indexes[1]);
        });

        it('should remove every id=0 for \'hans peter\' in 3-char index', function () {
            var expectation_value_index_3 = {};
            assert.deepEqual(expectation_value_index_3, text_search.indexes[2]);
        });

        it('should remove every id=0 for \'hans peter\' in 4-char index', function () {
            var expectation_value_index_4 = {};
            assert.deepEqual(expectation_value_index_4, text_search.indexes[3]);
        });

        it('should remove every id=0 for \'hans peter\' in 5-char index', function () {
            var expectation_value_index_5 = {};
            assert.deepEqual(expectation_value_index_5, text_search.indexes[4]);
        });

        it('should remove every id=0 for \'hans peter\' in 6-char index', function () {
            var expectation_value_index_6 = {};
            assert.deepEqual(expectation_value_index_6, text_search.indexes[5]);
        });

        it('should remove every id=0 for \'hans peter\' in 7-char index', function () {
            var expectation_value_index_7 = {};
            assert.deepEqual(expectation_value_index_7, text_search.indexes[6]);
        });

        it('should remove every id=0 for \'hans peter\' in 8-char index', function () {
            var expectation_value_index_8 = {};
            assert.deepEqual(expectation_value_index_8, text_search.indexes[7]);
        });

        it('should remove every id=0 for \'hans peter\' in 9-char index', function () {
            var expectation_value_index_9 = {};
            assert.deepEqual(expectation_value_index_9, text_search.indexes[8]);
        });

        it('should remove every id=0 for \'hans peter\' in 10-char index', function () {
            var expectation_value_index_10 = {};
            assert.deepEqual(expectation_value_index_10, text_search.indexes[9]);
        });

        it('should remove every id=0 for \'hans peter\' in 11-char index', function () {
            var expectation_value_index_11 = {};
            assert.deepEqual(expectation_value_index_11, text_search.indexes[10]);
        });
    });
});
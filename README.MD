Full Text Search Light is a pure JS full text search engine with an **ultrafast** search and the following commands:

  - Add
  - Search
  - Remove
  - Save to file
  - Load from file

You can add every kind of data, also complex objects.

## Install
### From NPM
```sh
npm install full-text-search-light
```

### From GitHub
```sh
npm install git+https://github.com/frankred/node-full-text-search-light.git
```

## Documentation

### Init
```js
var fulltextsearchlight = require('full-text-search-light');
var search = new fulltextsearchlight();
```

You can also change some configuration values according to the full text search.

```js
var fulltextsearchlight = require('full-text-search-light');
var search = new fulltextsearchlight({
  ignore_case: false,   // default = true, Ignore case during all search queries
  index_amount: 8;   // default = 12, The more indexes you have, the faster can be your search but the slower the 'add' method  gets
});
```

### Add
```js
// Add values
search.add('Peter');
search.add('Paul');
search.add('Maria');
```

You can also add objects or arrays to the search. Every child value will be added to the search, no matter if it's an array or object.

```js
// Add objects
var obj = {
    name: 'Alexandra',
    age: 27,
    student: true,
    hobbies: ['Tennis', 'Football', 'Party'];
    car: {
        make: 'Volvo',
        year: 2012,
        topspeed: 280
    }
};

search.add(obj);
```

### Add with filter
If you want to ignore fields you can pass a filter function. If you want to ignore a field or value just return ```false```. If you return ```true``` or everything else the field is added to the index.

```js
// Add filter, this function will be called on every single field
// If you don't want to add a field to the search just return false
var filter = function (key, val) {
    // Return false if you want to ignore field
    if (key == 'student' || key == 'topspeed') {
        return false;   // Ignore field
    }

    return true;    // Accept field
};

search.add(obj, filter);
```

### Search
```js
var results = search.search('p');
// results = ['Peter', 'Paul']
```

### Remove
You can remove objects or values out of the search by saving the ```id``` which is returned from the ```add``` method.

```js
// Add returns an id
var f = search.add("Frank");

// With that id you can remove the value from the search
search.remove(f);

// Returns an array with all result objects
var result = search.search('pau');
// result: ['Paul']
```

### Save and Load
```js
var fulltextsearchlight = require('full-text-search-light');
var search = new fulltextsearchlight();

// Add
search.add('Hello World');

// Save current db
search.save('search.json', function(error){

    // Load db
    fulltextsearchlight.load('search.json', function(error, search_loaded){
        var results = search_loaded.search('World');
    });
});
```

### Save and Load (Sync)
```js
var fulltextsearchlight = require('full-text-search-light');
var search = new fulltextsearchlight();

// Add
search.add('Hello World');

// Save current db
search.saveSync('search.json');

// Load db
var search_loaded = fulltextsearchlight.loadSync('search.json');
var results = search_loaded.search('World');
```

## Functions

This are all functions that can be used.

### add
- ```search.add('Just a string value')``` - Add a string to the search, returns a unique id
- ```search.add(obj)``` - Add a object to the search, returns a unique id

If you add numbers or booleans to the search they will be converted to strings.
- ```search.add(false)``` - Add booelan to the search (ok this does not really make sense, but it works.), returns a unique id
- ```search.add(42)``` - Add number to the search, returns a unique id

### search
- ```search.search('value')``` - Search for the string 'value'. Returns the results of the data as an array

### remove
- ```search.remove(1337)``` - Remove the data with the id 1337 from the search. This id was returned by adding a value or obj.

### drop
- ```search.drop()``` - Drops the search database and resets all data. The configuration is kept.

### saveSync
- ```search.saveSync('path/to/file.json')``` - Save current search db to a json file.

### loadSync
- ```fulltextsearchlight.loadSync('path/to/file.json')``` - Load a search from a file;

## Run tests

You need mocha installed globally:

```sh
npm install -g mocha
```

Now you can run tests if you navigate to project root:

```sh
mocha test
```

##License
MIT
**Free Software, Hell Yeah!**

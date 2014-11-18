# Full Text Search Light

Full Text Search Light is a pure JavaScript full text search engine with the following commands:

  - Add
  - Search
  - Remove

You can add every kind of data, also complex objects.

## Documentation
```js
var db = require('../index.js');

var search = new db('testdb');

// Make search case insensitive, has to be done before init(). Can't be changed after init().
search.ignore_case(true);

// Init the index, has to be done before adding values or objects.
search.init();

// Add values
search.add('Peter');
search.add('Paul');
search.add('Maria');
```

You can also add objects or arrays to the search. Every child value will be added to the search, no mather if its an array or object.

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

If you want to ignore fields you can over give a filter function. If you want to ignore a field or value just return ```false```. If you return ```true``` or everything else the field is added to the index.

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

You can remove objects or values out of the search by saving the ```id``` which is returned from the ```add``` method.

```js

// Add returns an id
var f = search.add("Frank");

// With that id you can remove the value from the search
search.remove(f);


search.search('Paul');
```

## To do
  - Add ```store``` and ```load``` function to serialize the full text search index.

## Version
0.0.1

## Run tests

You need mocha installed globally:

```sh
npm install -g mocha
```

Now you can run tests if you navigate to project root:

```sh
mocha tests
```

##License
MIT
**Free Software, Hell Yeah!**

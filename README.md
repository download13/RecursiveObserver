#RecursiveObserver

**Install** `bower install RecursiveObserver`

## API

### .observe(object, callback)

Starts observing `object`, and any descendant objects or arrays. `object` may be an Object or an Array. `callback` must be a function that will be called with an array of changes.

### .unobserve(object, callback)

Stops observing an object with a callback.

## Usage

```javascript
var a = [];
function cb(changes) {
    console.log(changes[0]);
    /*
    Prints:
    {type: "splice", addedCount: 1, index: 0, object: [{t: 1}], path: "", removed: []}
    {type: "update", name: "t", oldValue: undefined, newValue: 1, path: "0.t"} 
    */
    // Changes will be issued for any alterations anywhere in the object tree
}

RecursiveObserver.observe(a, cb);

a.push({t: 1});
```

## Notes

Does not work in Node yet. The Object.observe implementation in V8 (or at least the version in Node) seems to be out of date with the latest Harmony spec. Works in Chrome, but Firefox does not yet support Object.observe.

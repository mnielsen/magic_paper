// misc.js: Helper functions for Magic Paper.

Array.prototype.removeObj = function(obj) {
    // Remove obj if it's in the Array, otherwise leave the Array
    // untouched
    var j = this.indexOf(obj);
    if (j > -1) {this.splice(j, 1);};
};

function avg(arr) {
    // Return the average of an Array of Numbers
    return sum(arr)/arr.length;
}
function clone(obj) {
    return Object.assign({}, obj);
}
function distance(pt0, pt1) {
    // Return the Euclidean distance between two points, represented
    // as objects with x and y keys
    return Math.sqrt((pt0.x-pt1.x)*(pt0.x-pt1.x)+(pt0.y-pt1.y)*(pt0.y-pt1.y));
}
function index_of_min(arr) {
    // Return the index of the minimum item in the Array of Numbers
    // arr
    return arr.indexOf(Math.min(...arr));
}
function inside(x, y, bounding_box) {
    // Return true if the point (x, y) is inside bounding_box
    return ((x >= bounding_box.left) && (x <= bounding_box.right) &&
	    (y >= bounding_box.top) && (y <= bounding_box.bottom));
}
function makeSuper(fn, sup) {
    fn.prototype = Object.create(sup.prototype);
    fn.prototype.constructor = fn;
}
function parseArgs(args, deflt) {
    // For each key: value in the object deflt, check if key is in
    // args.  If not, insert the key and corresponding value.  Then
    // return args.
    args = selfOrDefault(args, {});
    for (var key in deflt) {
	args[key] = selfOrDefault(args[key], deflt[key]);
    }
    return args;
}
function pass(e) {
    // Do nothing. In Magic Paper it's often used as an event handler,
    // so there is an e parameter, for consistency with other event
    // handlers, but of course pass() can be called without an event
    // being passed.
}
function selfOrDefault(x, deflt) {
    // Return x if x is not undefined, otherwise return the default
    return (typeof x !== "undefined") ? x : deflt;
}
function sigmoid(z) {
    return 1.0/(1.0+Math.exp(-z));
}
function sum(arr) {
    // Return the sum of the Array of Numbers arr
    return arr.reduce( (acc, cur) => acc+cur, 0);
}
function toggle(f1, f2) {
    // Toggles action_onmousemove between the values f1 and f2
    if (action_onmousemove.name === f1.name) {action_onmousemove = f2;}
    else if (action_onmousemove.name === f2.name) {action_onmousemove = f1;}
}



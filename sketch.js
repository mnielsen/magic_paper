// sketch.js: Contains the prototype and some helper functions for
// Sketch objects, i.e., the freehand objects drawn on the screen.

function Sketch() {
    this.bounding_box = undefined;
    // Note that this.paths will be an Array of Arrays, each inner
    // Array representing a single path. The entries are pointes,
    // which we represent as objects with x and y properties, and
    // corresponding values.
    this.paths = []; 
};

Sketch.prototype.display = function() {
    display(this.paths);
};

Sketch.prototype.update_bounding_box = function(x, y) {
    if (!this.bounding_box) {// first point, create bounding_box
	this.bounding_box = {"top": y, "right": x, "bottom": y, "left": x};
    } else {
	this.bounding_box.top = Math.min(this.bounding_box.top, y);
	this.bounding_box.right = Math.max(this.bounding_box.right, x);
	this.bounding_box.bottom = Math.max(this.bounding_box.bottom, y);
	this.bounding_box.left = Math.min(this.bounding_box.left, x);
    }
};

Sketch.prototype.corresponding_glyph = function() {
    // Return the glyph whose points are closest to the (rescaled)
    // points in this.
    
    // Note rescaled_sketch is not actually a Sketch, just an Array of
    // points on the (rescaled) Sketch
    var rescaled_sketch = this.rescale();
    var distances = recognizable_glyphs.map(
	function(g) {
	    return distance_sets(rescaled_sketch, new g().points);});
    return new recognizable_glyphs[index_of_min(distances)]();
};

Sketch.prototype.rescale = function() {
    var points = [].concat.apply([], this.paths);
    var width_bb = this.bounding_box.right-this.bounding_box.left;
    var height_bb = this.bounding_box.bottom-this.bounding_box.top;
    return points.map(
	function(pt) {
	    return {
		"x": (width_bb/height_bb)*(2*(pt.x-this.bounding_box.left)/width_bb-1),
		"y": 2*(pt.y-this.bounding_box.top)/height_bb-1};
	}.bind(this));
};

function distance_sets(points0, points1) {
    return avg(
	points0.map(
	    function(point) {return distance_point_set(point, points1);}
	)
    )+avg(
	points1.map(
	    function(point) {return distance_point_set(point, points0);}
	)
    );
}
function distance_point_set(point, points) {
    return Math.min(... points.map(
	function(gpt) {return distance(point, gpt);}));
}

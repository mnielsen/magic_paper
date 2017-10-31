// magic.js: The main file for Magic Paper.  In particular, it
// contains the event handlers.

// Global constants
const DEFAULTFONT = "28px Baskerville";
const DEFAULTTEXT = "white";

// Global state variables
var canvas = document.getElementById("magic");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var ctx = canvas.getContext("2d");
ctx.font = DEFAULTFONT;
var xPosition = 0; // horizontal scroll position
// key commands available when mousing over any glyph
var glyph_span = document.getElementById("glyph");
// key commands special to the current glyph
var special_span = document.getElementById("special");
// Array of all glyphs currently on the Magic Paper
var glyphs = []; 
var current_sketch = undefined;
var over_glyph = undefined;
var active_glyph = undefined;
var action_onmousemove = pass, action_onmouseup = pass;
// mouse stores all state related to mouse position. It should not
// ordinarily be modified except by calling mouse.update_position(e,
// xPosition). This is called at the beginning of every mouse event,
// e, and should not be called elsewhere.  Many values are initialized
// to 0 (not undefined), so they have values if a keyboard event
// occurs before any mouse event. TODO: It would be better to keep
// these undefined and catch exceptions that might arise, but for a
// prototype this is okay.
var mouse = {
    "x": 0, "y": 0, "lastX": 0, "lastY": 0,
    "deltaX": 0, "deltaY": 0, "canvasX": 0, "canvasY": 0,
    "update_position": function(e, xPosition) {
	this.lastX = this.x; // value when previous update_position called
	this.lastY = this.y; // ditto
	this.x = e.clientX; 
	this.y = e.clientY;
	this.deltaX = this.x-this.lastX; // change from last time update_position called
	this.deltaY = this.y-this.lastY; // ditto
	// value of mouse position with respect to canvas co-ordinates
	this.canvasX = this.x-xPosition; 
	this.canvasY = this.y;
    }
};


// magic.js contains default handlers for 5 types of input events:
// onresize, onmousedown, onmousemove, onmouseup, and onkeypress.
// Note that the defaults may be changed. For instance, if the program
// is pausing for text input, then the handlers will be changed to
// ignore mouse events, before being changed back when control

window.onresize = function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redraw();
};

//
// DEFAULT MOUSE HANDLERS
//
window.onmousedown = fnOnmousedown;
function fnOnmousedown(e) {
    mouse.update_position(e, xPosition);
    detect_glyph();
    if (over_glyph) {over_glyph.onmousedown(e);}
    else {sketch_onmousedown(e);}
    redraw();
    function sketch_onmousedown(e) {
	// TODO: sketch_onmousedown should set an action_onmouseup,
	// reset the keyboard handlers to pass, and make sure that the
	// status menu is blank. Generically, these kind of
	// *_onmousedown functions should set action_onmousemove and
	// action_onmouseup, and the keyboard handlers, and make sure
	// the status menu is appropriately updated.
	action_onmousemove = sketch_onmousemove; 
	if (!current_sketch) {current_sketch = new Sketch();}
	current_sketch.update_bounding_box(mouse.canvasX, mouse.canvasY);
	current_sketch.paths.push([{"x": mouse.canvasX, "y": mouse.canvasY}]);
	function sketch_onmousemove(e) {
	    // add an extra point to the current_sketch
	    var path = current_sketch.paths[current_sketch.paths.length-1];
	    current_sketch.update_bounding_box(mouse.canvasX, mouse.canvasY);
	    path.push({"x": mouse.canvasX, "y": mouse.canvasY});
	}
    }
};
window.onmousemove = fnOnmousemove;
function fnOnmousemove(e) {
    mouse.update_position(e, xPosition);
    detect_glyph();
    action_onmousemove(e);
    redraw();
};
window.onmouseup = fnOnmouseup;
function fnOnmouseup(e) {
    mouse.update_position(e, xPosition);
    detect_glyph();
    action_onmouseup(e);
    action_onmousemove = pass;
    action_onmouseup = pass;
    redraw();
};

function detect_glyph() {
    // Detemine if the mouse is over a glyph, update over_glyph if so,
    // set the HTML for glyph_span and special_span (used for the
    // second and third lines of the status menu), and set the mouse
    // pointer to "pointer" if over a glyph, and "crosshair" if not.
    //
    // Note that we look for a hit in reverse the order in which
    // glyphs are added.  That is, more recently added glyphs are
    // prioritized.
    over_glyph = undefined; 
    glyph_span.innerHTML = "";
    special_span.innerHTML = "";
    for (var j = glyphs.length-1; j >= 0; j--) {
	if (inside(mouse.canvasX, mouse.canvasY, glyphs[j].bounding_box)) {
	    over_glyph = glyphs[j];
	    glyph_span.innerHTML =
		"Duplicate &nbsp;&nbsp; dElete &nbsp;&nbsp; Move "+
		"&nbsp;&nbsp; resiZe";
	    special_span.innerHTML = over_glyph.special_status;
	    break;
	}
    }
    if (over_glyph) {canvas.style.cursor = "pointer";}
    else {canvas.style.cursor = "crosshair";}
}

function redraw() {
    // Redraws the canvas.
    //
    // The clearing operation is a kludge, clearing 150 canvas widths,
    // to avoid dealing with headaches caused by horizontal
    // scrolling. A more principled approach would be desirable.
    ctx.clearRect(-50*canvas.width, 0, 100*canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, xPosition, 0);
    glyphs.forEach(function(glyph) {glyph.display();});
    if (current_sketch) {current_sketch.display();};
}

window.onkeypress = fnOnkeypress;
function fnOnkeypress(e) {
    detect_glyph();
    global_keys(e);
    global_over_glyph_keys(e);
    special_over_glyph_keys(e);
    redraw();
}

function global_keys(e) {
    // Keycodes, and corresponding functions
    var gk = {65: add, 67: clear, 82: recognize, 83: scroll, 84: trash};
    var key = (e.charCode < 91)? e.charCode : e.charCode-32;
    if (key in gk) {gk[key]();};
    function add() {
	var glyph = new SketchGlyph();
	glyph.init(current_sketch);
	glyphs.push(glyph);
	detect_glyph(); // update menu and mouse pointer
	current_sketch = undefined;
    }
    function clear() {
	current_sketch = undefined;
	glyphs = [];
	xPosition = 0;
    }
    function recognize() {
	if (current_sketch) {
	    var new_glyph = current_sketch.corresponding_glyph();
	    new_glyph.process(current_sketch);
	    var temp_glyph = clone(current_sketch);
	    current_sketch = undefined;
	    new_glyph.interpolate(
		temp_glyph,
		function () {
		    glyphs.push(new_glyph);
		    detect_glyph();
		}
	    );
	}
    }
    function scroll() {
	toggle(pass, scroll_onmousemove);
	function scroll_onmousemove(e) {
	    xPosition += mouse.deltaX;
	}
    }
    function trash() {
	if (current_sketch) {current_sketch = undefined;}
	else if (glyphs.length > 0) {
	    delete_glyph(glyphs[glyphs.length-1]);
	};
    }
}

function global_over_glyph_keys(e) {
    // Keycodes, and corresponding functions
    var gogk = {68: duplicate_glyph, 69: delete_glyph, 77: move_prep,
		90: resize_glyph};
    var key = (e.charCode < 91)? e.charCode : e.charCode-32;
    if ((over_glyph) && (key in gogk)) {gogk[key](over_glyph);};
    function duplicate_glyph(over_glyph) {
	var glyph = over_glyph.clone();
	// If the glyph is a Neuron, then add the new glyph as an
	// input to each of the original glyph's output Neurons
	if (glyph instanceof Neuron) {
	    over_glyph.outputs().forEach(function(output_neuron) {
		var k = output_neuron.inputs.map(
		    function(x) {return x.neuron;}).indexOf(over_glyph);
		var w = output_neuron.inputs[k].w;
		output_neuron.inputs.push({"w": w, "neuron": glyph});
	    });
	}
	var displacement = Math.min(15, Math.floor(0.2*Math.max(
	    (glyph.bounding_box.right-glyph.bounding_box.left),
	    (glyph.bounding_box.bottom-glyph.bounding_box.top)
	)));
	glyph.bounding_box.left += displacement;
	glyph.bounding_box.right += displacement;
	glyph.bounding_box.top += displacement;
	glyph.bounding_box.bottom += displacement;
	glyphs.push(glyph);
    }
    function move_prep(over_glyph) {
	toggle(pass, move_glyph);
	if (action_onmousemove.name === "move_glyph") {active_glyph = over_glyph;}
	if (action_onmousemove.name === "pass") {active_glyph = undefined;}
    };
    function move_glyph(e) {
	active_glyph.bounding_box.left += mouse.deltaX;
	active_glyph.bounding_box.right += mouse.deltaX;
	active_glyph.bounding_box.top += mouse.deltaY;
	active_glyph.bounding_box.bottom += mouse.deltaY;
    }
}

function delete_glyph(glyph) {
    glyphs.removeObj(glyph);
    if (glyph instanceof Neuron) {delete_neuron_connections();};
    if (glyph instanceof LowerGraph) {delete_lower_graph_connections();};
    function delete_neuron_connections() {
	glyph.outputs().forEach(function(output_neuron) {
	    var k = output_neuron.inputs.map(function(i) {return i.neuron;}).
		indexOf(glyph);
	    output_neuron.inputs.splice(k, 1);
	});
	// TODO: This should delete associated Parameter instances as
	// well.  At the moment they're left dangling.  The following
	// code fails because the representation used for in_neuron
	// etc changes according to whether it's a weight or a bias.
	// This needs to be fixed.
	//
	// glyphs.forEach(function(g) {
	//     if ((g instanceof Parameter) && (
	// 	(g.in_neuron === glyph) || (g.out_neuron === glyph))) {
	// 	console.log(g);
	// 	glyphs.removeObj(g);
	//     }
	// });
	if (glyph.LowerGraph) {
	    glyph.LowerGraph.input = undefined;
	    glyph.LowerGraph = undefined;
	}
    }
    function delete_lower_graph_connections() {
	if (glyph.input) {glyph.input.LowerGraph = undefined;}
    }
}

function resize_glyph() {
    var bb = over_glyph.bounding_box;
    var deltaX = Math.max(10, mouse.canvasX-bb.left);
    window.onmousedown = pass;
    window.onmousemove = resize_onmousemove;
    window.onmouseup = pass;
    window.onkeypress = resize_onkeypress;
    function resize_onmousemove(e) {
	mouse.update_position(e, xPosition);
	var new_deltaX = mouse.canvasX-bb.left;
	var rescale = (new_deltaX >= 10) ? (new_deltaX / deltaX) : 1;
	over_glyph.bounding_box = {
	    "left": bb.left, "top": bb.top,
	    "right": bb.left+Math.round(rescale*(bb.right-bb.left)),
	    "bottom": bb.top+Math.round(rescale*(bb.bottom-bb.top))
	};
	redraw();
    };
    function resize_onkeypress(e) {
	if (e.charCode === 90 || e.charCode === 122) {
	    window.onmousedown = fnOnmousedown;
	    window.onmousemove = fnOnmousemove;
	    window.onmouseup = fnOnmouseup;
	    window.onkeypress = fnOnkeypress;
	}
	redraw();
    }
};

function special_over_glyph_keys(e) {
    if (over_glyph instanceof MidGraph &&
	(e.charCode === 76 || e.charCode === 108)) {
	    window.onmousedown = pass;
	    window.onmousemove = pass;
	    window.onmouseup = pass;
	    window.onkeypress = over_glyph.onkeypress.bind(over_glyph);
    };
    if (over_glyph instanceof Neuron &&
	(e.charCode === 80 || e.charCode === 112)) {
	over_glyph.add_parameters();
    }
}









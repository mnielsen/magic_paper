// glyphs.js: Defines the glyphs which can be used in Magic Paper.
//
// To add a new glyph type, start with the following stub code:
//
// function NewGlyph() {
//     Glyph.call(this);
//     this.points = [...]
// }
// makeSuper(NewGlyph, Glyph);
//
// You should also add NewGlyph to the following Array of glyphs which
// can be recognized by the system:

var recognizable_glyphs = [
    LinearNeuron, LowerGraph, MidGraph, SigmoidNeuron];

// Points in this.points are objects {x: xval, y: yval}.  They
// represent the shape of the glyph --- for a circular glyph, the
// points would be on a circle.  The points are used to help recognize
// the user's freehand sketches. It's probably helpful to look at some
// examples, below.
//
// At the least, this.points should be initialized to [].  Additional
// points should have xval between -1 and 1, and yval between -1 and
// 1.  Note that yval = -1 corresponds to the top of the glyph, and
// yval = 1 to the bottom. When glyphs are being recognized these
// bounding box values are rescaled to match the bounding box of the
// user's sketch.
//
// NewGlyph should have a NewGlyph.prototype.process(sketch) method.
// The sketch object represents the user's sketch.  The prototype
// method is often sufficient. It simply does:
//
//      this.bounding_box = sketch.bounding_box;
//      this.create_screen_points();
//
// That is, it creates a bounding_box attribute, exactly matching the
// sketch bounding_box. This sometimes need modification. For
// instance, for a circular glyph, you may wish for the width and
// height of the bounding_box to be the same, and this will typically
// mean modifying the sketch bounding_box.
//
// this.create_screen_points() simply creates a list of (scaled to
// canvas co-ordinates) points, based on this.bounding_box and the
// original this.points.  This is used to do interpolation.  It is
// unlikely to need changing.
//
// Each time the canvas is redrawn, the Glyph.display() method is
// called.  See, for example, the SigmoidNeuron.display() method.

function Glyph() {
    this.points = [];
    // special keyboard commands for this particular glyph type
    this.special_status = "";
}
Glyph.prototype.clone = function() {
    return Object.assign(new this.constructor(), JSON.parse(JSON.stringify(this)));
};
Glyph.prototype.create_screen_points = function() {
    var width = this.bounding_box.right-this.bounding_box.left;
    var height = this.bounding_box.bottom-this.bounding_box.top;
    var xmid = 0.5*(this.bounding_box.left+this.bounding_box.right);
    var ymid = 0.5*(this.bounding_box.top+this.bounding_box.bottom);
    this.screen_points = this.points.map(function(point) {
	return {"x": xmid+0.5*point.x*width, "y": ymid+0.5*point.y*height};
    });
}

Glyph.prototype.height = function() {return this.bounding_box.bottom-this.bounding_box.top;};
Glyph.prototype.width = function() {return this.bounding_box.right-this.bounding_box.left;};
Glyph.prototype.interpolate = function(start_sketch, final) {
    // Interpolate between start_sketch and this.  Execute the final
    // callback upon completion.
    var pairs = construct_pairs(this, start_sketch);
    var p = 0.0; // interpolation parameter
    interp();
    function interp() {
	p += 0.04;
	if (p < 1) {
	    redraw();
	    var paths = pairs.map(function(path_pairs) {
		return path_pairs.map(function(point_pair) {
		    return {"x": (1-p)*point_pair.x0 + p*point_pair.x1,
			    "y": (1-p)*point_pair.y0 + p*point_pair.y1};
		});
	    });
	    display(paths);
	    requestAnimationFrame(interp);
	} else {
	    final();
	};
    }
}
Glyph.prototype.onmousedown = function(e) {
    // pass
};
Glyph.prototype.process = function(sketch) {
    this.bounding_box = sketch.bounding_box;
    this.create_screen_points();
};

function LowerGraph() {
    Glyph.call(this);
    for (var j = 0; j < 100; j++) {
	this.points.push({"x": -1,        "y": 1-0.02*j});
	this.points.push({"x": -1+0.02*j, "y": 1});
    }
};
makeSuper(LowerGraph, Glyph);
LowerGraph.prototype.display = function() {
    ctx.arrow(this.bounding_box.left, this.bounding_box.bottom,
	      this.bounding_box.left, this.bounding_box.top);
    ctx.arrow(this.bounding_box.left, this.bounding_box.bottom,
	      this.bounding_box.right, this.bounding_box.bottom);
    if (this.input) {
	connect_neuron(this);
	// It's wasteful to find the network again every time we
	// display the graph -- it'd be more efficient to do it only
	// when the network structure changes. Still, this has the
	// benefit of making dynamic updating easy.
	var network = this.input.find_network();
	if (network.function) {plot_network_output(this);}
    }
    function connect_neuron(obj) {
	// TODO: At the moment makes some strong assumptions about the
	// connection to neurons, notably, that the LowerGraph is to
	// the right of the Neuron.  This should be more flexible.
	var x0 = obj.input.x()+obj.input.r()+5;
	var y0 = obj.input.y();
	var x1 = obj.bounding_box.left-10;
	var y1 = (obj.bounding_box.top+obj.bounding_box.bottom)/2-40;
	ctx.beginPath();
	ctx.moveTo(x0, y0);
	ctx.bezierCurveTo(x0+50, y0-50, x1-50, y1-50, x1, y1);
	// arrow head
	ctx.lineTo(x1, y1-10);
	ctx.moveTo(x1, y1);
	ctx.lineTo(x1-10, y1);
	ctx.strokeStyle = "red";
	ctx.lineWidth = 1.5;
	ctx.stroke();
	ctx.lineWidth = 1; // restore to the default used elsewhere
	ctx.closePath();
    }
    function plot_network_output(obj) {
	var xScale = function(x) {
	    return obj.bounding_box.left+x*0.9*obj.width();
	};
	var yScale = function(y) {
	    return(obj.bounding_box.bottom-y*0.9*obj.height());
	};
	ctx.text("1", xScale(1), yScale(0)+27, {"text-align": "center"}); // x axis label
	ctx.line(xScale(1), yScale(0), xScale(1), yScale(0)+5); // x axis tick
	ctx.text("1", xScale(0)-12, yScale(1)+7, {"text-align": "center"}); // y axis label
	ctx.line(xScale(0)-5, yScale(1), xScale(0), yScale(1)); // y axis tick
	for (var j=0; j < 200; j++) {
	    var x = j*0.005;
	    var y = network.function(x);
	    if (j === 0) {ctx.beginPath(); ctx.moveTo(xScale(x), yScale(y));}
	    else {ctx.lineTo(xScale(x), yScale(y));}
	}
	ctx.strokeStyle = "yellow";
	ctx.stroke();
	ctx.closePath();
    }
};

function MidGraph() {
    Glyph.call(this);
    for (var j = 0; j < 50; j++) {
	this.points.push({"x": -1,        "y": -1+0.04*j});
	this.points.push({"x": -1+0.04*j, "y": 0});
    };
    this.graph = {};
    this.xLabel = "";
    this.yLabel = "";
    this.labelFlag = false;
    this.special_status = "Label";
}
makeSuper(MidGraph, Glyph);
MidGraph.prototype.display = function() {
    ctx.arrow(this.bounding_box.left, this.bounding_box.bottom,
	      this.bounding_box.left, this.bounding_box.top,
	      "white", 1);
    ctx.arrow(this.bounding_box.left, (this.bounding_box.bottom+this.bounding_box.top)/2,
	      this.bounding_box.right, (this.bounding_box.bottom+this.bounding_box.top)/2,
	      "white", 1);
    var path = Object.keys(this.graph).sort(
	function(x, y) {return parseInt(x) - parseInt(y);}).map(
	function(x) {return {"x": parseInt(x)+this.bounding_box.left,
			     "y": this.graph[x]+this.bounding_box.top};}.bind(this));
    plot_path(path, "yellow");
    if (this.xLabel) {
	ctx.text(this.xLabel, this.bounding_box.right-15,
		 0.5*(this.bounding_box.bottom+this.bounding_box.top)+20,
		 {"text-align": "right"});
    }
    if (this.yLabel) {
	ctx.text(this.yLabel, this.bounding_box.left-12, this.bounding_box.top+25,
		 {"text-align": "right"});
    }
};

MidGraph.prototype.onkeypress = function(e) {
    // Keypress handler for MidGraph, used to label axes. Not fleshed
    // out, since I didn't need it.
    if (!this.labelFlag) {this.labelFlag = "xLabel";}
    if (this.labelFlag === "xLabel" && e.charCode === 13) {
	// switch to y axis when enter is hit while labelling x axis
	this.labelFlag = "yLabel";
    } else if (this.labelFlag === "yLabel" && e.charCode === 13) {
	// restore handlers when enter is hit while labelling y axis
	this.labelFlag = false;
	window.onmousedown = fnOnmousedown;
	window.onmousemove = fnOnmousemove;
	window.onmouseup = fnOnmouseup;
	window.onkeypress = fnOnkeypress;
    } else if (this.labelFlag === "xLabel") {
	this.xLabel += e.key;
    } else if (this.labelFlag === "yLabel") {
	this.yLabel += e.key;
    }
    redraw();
};
MidGraph.prototype.onmousedown = function(e) {
    action_onmousemove = over_glyph.sketchGraph.bind(over_glyph);
};
MidGraph.prototype.sketchGraph = function(e) {
    if (inside(mouse.canvasX, mouse.canvasY, this.bounding_box)) {
	this.graph[mouse.canvasX-this.bounding_box.left] = mouse.canvasY-this.bounding_box.top;
	redraw();
    }
};
    
function Neuron() {
    Glyph.call(this);
    // Input neurons.  Note that the format is {"w": weight, "neuron": Neuron}
    this.inputs = [];
    this.special_status = "Parameters";
}
makeSuper(Neuron, Glyph);
Neuron.prototype.add_parameters = function() {
    var bias_parameter_exists = function() {
	return glyphs.some(function(glyph) {
	    return ((glyph instanceof Parameter) && (glyph.in_neuron === this)
		    && (!glyph.out_neuron));
	}.bind(this));
    }.bind(this);
    var weight_parameter_exists = function(in_neuron) {
	return glyphs.some(function(glyph) {
	    return ((glyph instanceof Parameter) && (glyph.in_neuron.neuron === in_neuron)
		    && (glyph.out_neuron === this));
	}.bind(this));
    }.bind(this);
    if (!bias_parameter_exists()) {
	var bias = new Parameter(
	    this, "b", this.x()-50, this.bounding_box.top-34, 120, 28, "b = ");
	glyphs.push(bias);
    }
    for (var j=0; j < this.inputs.length; j++) {
	if (!weight_parameter_exists(this.inputs[j].neuron)) {
	    var x = this.inputs[j].neuron.bounding_box.right+10;
	    var y = 0.5*(this.inputs[j].neuron.bounding_box.top+
			 this.inputs[j].neuron.bounding_box.bottom)-34;
	    glyphs.push(new Parameter(
		this.inputs[j], "w", x, y, 120, 28, "w = ", this));
	}
    }
};
Neuron.prototype.clone = function() {
    // Deep cloning can be problematic in JS.  We can use a JSON hack
    // to do it, provided there are no circular references.  Neurons
    // can have circular references, so I've dealt with the problem by
    // using JSON to clone the parts without circular references, and
    // then cloning the other parts manually, so to speak.
    //
    // To do the cloning we need a list of all the enumerable keys
    // with no circular references.
    var keys =  ["points", "special_status", "b", "default_weight", "bounding_box", "screen_points"];
    if (keys.length !== Object.keys(this).length-1) {
	console.warn("Expected set of enumerable keys has changed, may need to modify "+
		     "Neuron.prototype.clone");
	console.log("Expected keys: "+keys);
	console.log("Actual keys: "+Object.keys(this));
    }
    var c = new this.constructor();
    for (var j=0; j < keys.length; j++) {
	if (keys[j] in this) {
	    c[keys[j]] = JSON.parse(JSON.stringify(this[keys[j]]));
	}
    }
    c.inputs = [];
    for (var j=0; j < this.inputs.length; j++) {
	c.inputs.push({"w": JSON.parse(JSON.stringify(this.inputs[j].w)),
		       "neuron": this.inputs[j].neuron});
    }
    return c;
}
Neuron.prototype.connect = function(e) {
    this.connectionArrow = {
	"x0": this.bounding_box.left+this.connectX, "y0": this.bounding_box.top+this.connectY,
	"x1": mouse.canvasX, "y1": mouse.canvasY
    };
    redraw();
};
Neuron.prototype.connectMouseup = function(e) {
    delete this.connectionArrow;
    delete this.connectX;
    delete this.connectY;
    if (over_glyph instanceof Neuron && over_glyph !== this) {
	over_glyph.inputs.push({"neuron": this, "w": over_glyph.default_weight});
    }
    if (over_glyph instanceof LowerGraph) {
	this.LowerGraph = over_glyph;
	over_glyph.input = this;
    }
    redraw();
};
Neuron.prototype.display_temp_connection = function() {
    if (this.connectionArrow) {
	ctx.arrow(
	    this.connectionArrow.x0, this.connectionArrow.y0,
	    this.connectionArrow.x1, this.connectionArrow.y1,
	    "white", 1);
    }
}
Neuron.prototype.find_network = function() {
    return new Network(this);
};
Neuron.prototype.onmousedown = function(e) {
    over_glyph.connectX = mouse.canvasX-over_glyph.bounding_box.left;
    over_glyph.connectY = mouse.canvasY-over_glyph.bounding_box.top;
    action_onmousemove = over_glyph.connect.bind(over_glyph);
    action_onmouseup = over_glyph.connectMouseup.bind(over_glyph);
};
Neuron.prototype.outputs = function() {
    var out = [];
    for (var j = 0; j < glyphs.length; j++) {// look through all glyphs
	var glyph = glyphs[j];
	if (glyph instanceof Neuron) {// if the glyph is a neuron, is _this_ an input?
	    var inputs = glyph.inputs.map(function(obj) {return obj.neuron});
	    if (inputs.indexOf(this) !== -1) {out.push(glyph)}; // then glyph is an output
	}
    }
    return out;
}
Neuron.prototype.x = function() {
    return (this.bounding_box.left+this.bounding_box.right)/2;
};
Neuron.prototype.y = function() {
    return (this.bounding_box.top+this.bounding_box.bottom)/2;
};
Neuron.prototype.r = function() {
    return (this.bounding_box.right-this.bounding_box.left)/2;
};

function LinearNeuron() {
    Neuron.call(this);
    this.b = 0;
    this.default_weight = 1;
    for (var j = 0; j < 40; j++) {
	this.points.push({"x": -1+j*0.05,    "y": -1});
	this.points.push({"x": 1,            "y": -1+j*0.05});
	this.points.push({"x":  1-j*0.05,    "y": 1});
	this.points.push({"x": -1,           "y": 1-j*0.05});
    }

};
makeSuper(LinearNeuron, Neuron);
LinearNeuron.prototype.display = function() {
    var x = this.bounding_box.left;
    var y = this.bounding_box.top;
    var size = this.bounding_box.right-this.bounding_box.left;
    this.display_temp_connection();
    ctx.beginPath();
    ctx.strokeStyle = "white";
    ctx.strokeRect(x, y, size, size);
    ctx.stroke();
    ctx.closePath();
    for (var j = 0; j < this.outputs().length; j++) {
	var neuron = this.outputs()[j];
	var deltaX = neuron.x()-this.x();
	var deltaY = neuron.y()-this.y();
	var l = Math.sqrt(deltaX*deltaX+deltaY*deltaY);
	var nX = deltaX/l;
	var nY = deltaY/l;
	var x0 = this.bounding_box.right;
	var y0 = this.y()+(nY/nX)*(x0-this.x());
	if (neuron instanceof LinearNeuron) {
	    if ((nX <= 0) || (Math.abs(nY) > Math.abs(nX))) {
		console.warn(
		    "Currently only able to connect to linear neurons in a"
			+ " left-right direction");
	    }
	    var x1 = neuron.bounding_box.left;
	    var y1 = this.y()+(nY/nX)*(x1-this.x());
	} else if (neuron instanceof SigmoidNeuron) {
	    var x1 = neuron.x()-neuron.r()*nX;
	    var y1 = neuron.y()-neuron.r()*nY;
	} else {
	    console.warn(
		"Trying to connect to a Neuron of a type not currently supported");
	}
	ctx.arrow(x0, y0, x1, y1, "white", 1);
    }
};
LinearNeuron.prototype.process = function(sketch) {
    var width = sketch.bounding_box.right-sketch.bounding_box.left;
    var height = sketch.bounding_box.bottom-sketch.bounding_box.top;
    var size = width;
    var x = (sketch.bounding_box.left+sketch.bounding_box.right
	     -size)/2;
    var y = (sketch.bounding_box.top+sketch.bounding_box.bottom
	     -size)/2;
    this.bounding_box = {"left": x, "top": y,
			 "right": x+size, "bottom": y+size};
    this.create_screen_points();
};
LinearNeuron.prototype.activation_fn = function(z) {return z;};

function SigmoidNeuron() {
    Neuron.call(this);
    this.b = -5;
    this.default_weight = 10;
    for (var j = 0; j < 100; j++) {
	var theta = 2*j*Math.PI/100;
	this.points.push({"x": Math.cos(theta), "y": Math.sin(theta)});
    }
}
makeSuper(SigmoidNeuron, Neuron);
SigmoidNeuron.prototype.display = function() {
    var r = 0.5*(this.bounding_box.right-this.bounding_box.left);
    var x = (this.bounding_box.left+this.bounding_box.right)/2;
    var y = (this.bounding_box.top+this.bounding_box.bottom)/2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2*Math.PI);
    ctx.strokeStyle = "white";
    ctx.stroke();
    ctx.closePath();
    this.display_temp_connection();
    for (var j = 0; j < this.outputs().length; j++) {
	var neuron = this.outputs()[j];
	var deltaX = neuron.x()-this.x();
	var deltaY = neuron.y()-this.y();
	var l = Math.sqrt(deltaX*deltaX+deltaY*deltaY);
	var nX = deltaX/l;
	var nY = deltaY/l;
	var x0 = this.x()+this.r()*nX;
	var y0 = this.y()+this.r()*nY;
	if (neuron instanceof LinearNeuron) {
	    if ((nX <= 0) || (Math.abs(nY) > Math.abs(nX))) {
		console.warn(
		    "Currently only able to connect to linear neurons on their"
			+ "left-hand side");
	    }
	    var x1 = neuron.bounding_box.left;
	    var y1 = this.y()+(nY/nX)*(x1-this.x());
	} else if (neuron instanceof SigmoidNeuron) {
	    var x1 = neuron.x()-neuron.r()*nX;
	    var y1 = neuron.y()-neuron.r()*nY;
	} else {
	    console.warn(
		"Trying to connect to a Neuron of a type not currently supported");
	}
	ctx.arrow(x0, y0, x1, y1, "white", 1);
    }
};
SigmoidNeuron.prototype.process = function(sketch) {
    var r = Math.max(
	0.5*(sketch.bounding_box.right-sketch.bounding_box.left),
	0.5*(sketch.bounding_box.bottom-sketch.bounding_box.top)
    );
    var x = (sketch.bounding_box.left+sketch.bounding_box.right)/2;
    var y = (sketch.bounding_box.top+sketch.bounding_box.bottom)/2;
    this.bounding_box = {
	"left": x-r, "right": x+r, "top": y-r, "bottom": y+r};
    this.create_screen_points();
};
SigmoidNeuron.prototype.activation_fn = sigmoid;

function Parameter(in_neuron, key, x, y, width, height, text, out_neuron) {
    // If a bias, call with in_neuron the Neuron, and out_neuron
    // undefined.  If a weight, call with in_neuron an object {"w":
    // weight, "neuron": input neuron}, and out_neuron the output
    // Neuron.
    //
    // TODO: Correct the design so we have a single uniform interface
    // for both cases.
    Glyph.call(this);
    this.in_neuron = in_neuron;
    this.key = key;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;
    this.out_neuron = out_neuron;
    this.bounding_box = {}; // set dynamically by display
}
makeSuper(Parameter, Glyph);
Parameter.prototype.display = function() {
    if (this.out_neuron) {// a weight, with both an in_neuron and out_neuron
	var x0 = this.in_neuron.neuron.x();
	var y0 = this.in_neuron.neuron.y();
	var x1 = this.out_neuron.x();
	var y1 = this.out_neuron.y();
	var grad = (y1-y0)/(x1-x0);
	this.bounding_box.left = (x0+x1-this.width)/2;
	this.bounding_box.right = (x0+x1+this.width)/2;
	var deltaY = Math.min(grad*(this.bounding_box.left+20-x0), grad*(this.bounding_box.right-20-x0));
	this.bounding_box.top = y0+deltaY-34;
	this.bounding_box.bottom = this.bounding_box.top+this.height;
    } else {// a bias, with just an in_neuron
	this.bounding_box.top = this.in_neuron.bounding_box.top-34;
	this.bounding_box.bottom = this.bounding_box.top+this.height;
	this.bounding_box.left = this.in_neuron.x()-this.width/2;
	this.bounding_box.right = this.in_neuron.x()+this.width/2;
    }
    if (over_glyph === this) {
	ctx.filledRoundedRectangle(
	    this.bounding_box.left, this.bounding_box.top,
	    this.bounding_box.right, this.bounding_box.bottom,
	    3, "#777", "#777", 0);
    }
    ctx.text(this.text+this.in_neuron[this.key],
	0.5*(this.bounding_box.left+this.bounding_box.right),
	this.bounding_box.top+22,
	     {"text-align": "center"});
};
Parameter.prototype.onmousedown = function(e) {
    this.scrubbingX = mouse.x;
    this.param = this.in_neuron[this.key];
    action_onmousemove = this.scrub.bind(this);
};
Parameter.prototype.scrub = function(e) {
    var deltaX = mouse.x-this.scrubbingX;
    const voxelSize = 6;
    this.in_neuron[this.key] = ramp(unramp(this.param)+Math.floor(deltaX/voxelSize));
    // We ramp the scrubbing up: 0, 0.1, 0.2, ..., 0.9, 1, 2, ..., 9,
    // 10, 20, 30,..., 90, 100, 200,....  Each increment is caused by
    // a mouse movement 1 voxel to the right.
    function ramp(x) {
	// Return the value to be output if we move x voxels to the
	// right of the 0 value for the parameter
	if (Math.abs(x) < 10) {return x/10;};
	if ((10 <= Math.abs(x)) && (Math.abs(x) < 19)) {return Math.sign(x)*(Math.abs(x)-9);};
	if ((19 <= Math.abs(x)) && (Math.abs(x) < 28)) {return Math.sign(x)*(Math.abs(x)-18)*10;};
	if ((28 <= Math.abs(x)) ** (Math.abs(x) < 37)) {return Math.sign(x)*(Math.abs(x)-27)*100;};
    };
    function unramp(y) {
	// Inverse of ramp(x), i.e., unramp(ramp(x)) = x.  May be
	// interpreted as the number of voxels to the right of 0 we
	// need to move to obtain a value of y.
	if (Math.abs(y) < 1) {return y*10;};
	if ((1 <= Math.abs(y)) && (Math.abs(y) < 10)) {return Math.sign(y)*(Math.abs(y)+9);};
	if ((10 <= Math.abs(y)) && (Math.abs(y) < 100)) {return Math.sign(y)*(Math.abs(y)/10+18);};
	if (100 <= Math.abs(y)) {return Math.sign(y)*(Math.abs(y)/100+27);};
    };
};

function SketchGlyph(sketch) {
    Glyph.call(this);
}
makeSuper(SketchGlyph, Glyph);
SketchGlyph.prototype.display = function() {
    var paths = this.relative_paths.map(function(relative_path) {
	return relative_path.map(function(pt) {
	    return {"x": pt.x*this.width()+this.bounding_box.left,
		    "y": pt.y*this.height()+this.bounding_box.top};
	}.bind(this));
    }.bind(this));
    display(paths);
};
SketchGlyph.prototype.init = function(sketch) {
    this.bounding_box = sketch.bounding_box;
    // Rescale the points along the paths to be in the range 0 to 1,
    // for both x and y co-ordinates.  This is done so that everything
    // is relative to the bounding box, making it easy to perform
    // operations like movement and rescaling and duplication.
    this.relative_paths = sketch.paths.map(function(path) {
	return path.map(function(pt) {
	    return {"x": (pt.x-this.bounding_box.left)/this.width(),
		    "y": (pt.y-this.bounding_box.top)/this.height()};
	}.bind(this));
    }.bind(this));
};
SketchGlyph.prototype.interpolate = function() {
    // pass
    };
SketchGlyph.prototype.process = function() {
    // pass
};

// Non-glyph classes
function Network(neuron) {
    // At present, assumes architecture is either:
    //
    // single input -> single output
    //
    // or:
    //
    // single input -> hidden layer -> single output
    if (neuron.inputs.length === 1 &&
	neuron.inputs[0].neuron.inputs.length === 0) {// single input neuron
	this.function = function(x) {
	    return neuron.activation_fn(neuron.inputs[0].w*x+neuron.b);
	}.bind(this);
    } else if (
	(neuron.inputs.length >= 1) &&
	    (neuron.inputs.every(function(n) {return n.neuron.inputs.length === 1;})) &&
	    (neuron.inputs.every(
		function(n) {
		    return n.neuron.inputs[0].neuron === neuron.inputs[0].neuron.inputs[0].neuron;
		}
	    ))
    ) { // single input -> hidden layer -> single output
	this.function = function(x) {
	    return neuron.activation_fn(neuron.b+ sum(neuron.inputs.map(
		function(n) {return n.w*n.neuron.activation_fn(n.neuron.inputs[0].w*x+n.neuron.b);})));
	};
    } else {
	this.function = undefined;
	console.log("Neural net doesn't have a supported architecture");
    }
}

// Miscellaneous functions
function construct_pairs(glyph, sketch) {
    // Return an Array containing all the points in the sketch, paired
    // with the closest corresponding point in the glyph
    return sketch.paths.map(function(path) {
	return path.map(function(point) {
	    var distances = glyph.screen_points.map(
		function(spt) {return distance(point, spt);});
	    var closest_point_index = distances.indexOf(Math.min(... distances));
	    var closest_point = glyph.screen_points[closest_point_index];
	    return {"x0": point.x, "y0": point.y, "x1": closest_point.x, "y1": closest_point.y};
	});
    });
}
function display(paths) {paths.forEach(function(path) {plot_path(path);});}
function plot_path(path, color) {
    if (!color) {color = "white";}
    if (path.length === 1) {
	ctx.beginPath();
	ctx.fillStyle = color;
	ctx.fillRect(path[0].x, path[0].y, 1, 1);
	ctx.closePath();
    } else if (path.length > 1) {
	for (var k = 0; k < path.length-1; k++) {
	    ctx.beginPath();
	    ctx.moveTo(path[k].x, path[k].y);
	    ctx.lineTo(path[k+1].x, path[k+1].y);
	    ctx.strokeStyle = color;
	    ctx.stroke();
	    ctx.closePath();
	}
    }
}

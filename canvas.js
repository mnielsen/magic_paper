// canvas.js: Helper functions for the canvas, for Magic Paper.

CanvasRenderingContext2D.prototype.arrow = function(
    x1, y1, x2, y2, color, lineWidth) {
    this.line(x1, y1, x2, y2, color, lineWidth);
    var delta = { // difference vector between the two points
	"x": x1-x2,
	"y": y1-y2
    };
    var norm = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
    var n = { // normalized difference vector, pointing from pt 2 to pt 1
	"x": delta.x / norm,
	"y": delta.y / norm
    };
    var m = { // vector orthogonal to n
	"x": -n.y,
	"y": n.x
    };
    var arrow1 = { // part of the arrowhead
	"x": 8*n.x+4*m.x,
	"y": 8*n.y+4*m.y
    };
    var arrow2 = { // other part of the arrowhead
	"x": 8*n.x-4*m.x,
	"y": 8*n.y-4*m.y
    };
    this.line(x2, y2, x2+arrow1.x, y2+arrow1.y, color, lineWidth);
    this.line(x2, y2, x2+arrow2.x, y2+arrow2.y, color, lineWidth);
};
CanvasRenderingContext2D.prototype.filledRectangle = function(
    x1, y1, x2, y2, color, fillColor, lineWidth) {
    this.strokeStyle = selfOrDefault(color, "white");
    this.fillStyle = selfOrDefault(fillColor, "black");
    this.lineWidth = selfOrDefault(lineWidth, 1);
    this.fillRect(x1, y1, x2-x1, y2-y1);
    this.strokeRect(x1, y1, x2-x1, y2-y1);
};
CanvasRenderingContext2D.prototype.filledRoundedRectangle = function(
    x1, y1, x2, y2, r, color, fillColor, lineWidth) {
    this.strokeStyle = selfOrDefault(color, "white");
    this.fillStyle = selfOrDefault(fillColor, "black");
    this.lineWidth = selfOrDefault(lineWidth, 1);
    this.beginPath();
    this.moveTo(x1+r, y1);
    this.lineTo(x2-r, y1);
    this.quadraticCurveTo(x2, y1, x2, y1+r);
    this.lineTo(x2, y2-r);
    this.quadraticCurveTo(x2, y2, x2-r, y2);
    this.lineTo(x1+r, y2);
    this.quadraticCurveTo(x1, y2, x1, y2-r);
    this.lineTo(x1, y1+r);
    this.quadraticCurveTo(x1, y1, x1+r, y1);
    this.closePath();
    this.stroke();
    this.fill();
};
CanvasRenderingContext2D.prototype.line = function(
    x1, y1, x2, y2, color, lineWidth) {
    this.beginPath();
    this.moveTo(x1, y1);
    this.lineTo(x2, y2);
    this.strokeStyle = selfOrDefault(color, "white");
    this.lineWidth = selfOrDefault(lineWidth, 1);
    this.stroke();
};
CanvasRenderingContext2D.prototype.text = function(content, x, y, opt_args) {
    // Note that the optional arguments are based on CSS property
    // names, not the canvas property names.  The exception is
    // "textBaseline", because the values for canvas are not modelled
    // on those for CSS.
    var opt_args = parseArgs(opt_args, {"font": DEFAULTFONT,
					"color": DEFAULTTEXT,
					"text-align": "left",
					"textBaseline": "alphabetic"});
    this.font = opt_args.font;
    this.fillStyle = opt_args.color;
    this.textAlign = opt_args["text-align"];
    this.textBaseline = opt_args.textBaseline;
    this.fillText(content, x, y);
};

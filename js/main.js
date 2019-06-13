/*********************************
 * Initialization
 *********************************/

// getElementById shorthand util
function $id(id) {
	return document.getElementById(id);
}

function init(){
    //Populate select elements
    var sel = $id("select-filter");
    for (var i=0; i<dither.filters.length; i++){
        var option = document.createElement("option");
        option.text = dither.filters[i][0];
        option.value = dither.filters[i][1];
        sel.add(option);
    }

    //Attach dragging events
    var filedrag = $id("filedrag");
    document.body.addEventListener("dragover", fileDragHover, false);
    document.body.addEventListener("dragleave", fileDragHover, false);
    document.body.addEventListener("drop", fileSelectHandler, false);
    filedrag.addEventListener("click", function(e){
        $id("imgfile").click()
    }, false);
    filedrag.style.display = "block";

    //Attach input element handlers
    $id("grayscale").addEventListener("change", function(e){
        dither.convertToGrayscale = e.target.checked;
        processImage();
    }, false);

    $id("imgfile").addEventListener("change", function(e){
        loadImage();
    }, false);

    $id("select-filter").addEventListener("change", function(e){
        processImage();
    }, false);
}

//Add listener
document.addEventListener('DOMContentLoaded', init, false);

/*********************************
 * Load test image and process it
 *********************************/

function loadImage(){
    input = $id('imgfile');
    if (!input) {
        alert("Couldn't find the imgfile element.");
    } else if (!input.files) {
        alert("This browser doesn't seem to support the 'files' property of file inputs.");
    } else {
        loadImageFile(input.files);
    }
}

function loadImageFile(files) {
    var fr, img, file;

    if (files.length > 0) {
        file = files[0];
        console.dir(file);
        $id("filename").innerHTML = file.name;
        fr = new FileReader();
        fr.onload = createImage;
        fr.readAsDataURL(file);
    }

    function createImage() {
        img = new Image();
        img.onload = imageLoaded;
        img.src = fr.result;
    }

    function imageLoaded() {
        var inCanvas = $id("input");
        var outCanvas = $id("output");
        inCanvas.height = outCanvas.height = img.height;
        inCanvas.width = outCanvas.width = img.width;

        var ctx = inCanvas.getContext("2d");
        ctx.drawImage(img,0,0);
        console.log("Image drawn");

        processImage();
    }
}

function processImage(){
    //Get selected filter function from array
    var sel = $id("select-filter");
    var filter = dither.filters[sel.selectedIndex][1];

    //Apply
    dither.drawDitherResult($id("input"),
                            $id("output"),
                            filter);

    //Create histograms
    createHistogram("input", "histogram-input");
    createHistogram("output", "histogram-output");
}

function clearCanvas(canvas, fill){
    var can = $id(canvas);
    var ctx = can.getContext("2d");
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, can.width, can.height);
}

/*********************************
 * Create histogram
 *********************************/

function createHistogram(srcCanvas, histCanvas){
    var canvas = $id(histCanvas); //histogram canvas
    var ctx = canvas.getContext("2d");
    var histogram = getHistogramData(srcCanvas); //data object

    //Get a few key numbers
    var max = histogram.maxVals.max(); //scale
    var y = canvas.height; //using canvas height as offset for y-axis

    //Set up and clear histogram canvas
    ctx.globalCompositeOperation = "source-over";
    clearCanvas(histCanvas, "#444444");
    ctx.globalCompositeOperation = "screen";

    //Draw histogram
    for (var i=0; i<histogram.vals[0].length; i++){
        var height = 0;

        //R
        height = mapRange(histogram.vals[0][i], [0, max], [0, y]);
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(i, y-height, 1, height);

        //G
        height = mapRange(histogram.vals[1][i], [0, max], [0, y]);
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(i, y-height, 1, height);

        //B
        height = mapRange(histogram.vals[2][i], [0, max], [0, y]);
        ctx.fillStyle = "#0000ff";
        ctx.fillRect(i, y-height, 1, height);
    }
}

function getHistogramData(canvasId){
    var histogram = {"maxVals"  : [0,0,0],
                     "avgVals" : [0,0,0],
                     "vals" :[zeroArray256(), zeroArray256(), zeroArray256()]
                    };

    //Get image data
    var canvas = $id(canvasId);
    var ctx = canvas.getContext("2d");
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    //Loop through each pixel
    for (var i=0; i<imageData.length; i+=4){
        //exclude fully transparent pixels from histogram
        if (imageData[i+3] > 0){
            var r = histogram.vals[0][ imageData[i] ]++;    //R
            var g = histogram.vals[1][ imageData[i+1] ]++;  //G
            var b = histogram.vals[2][ imageData[i+2] ]++;  //B
        }
    }

    //Get max & average
    histogram.maxVals[0] = histogram.vals[0].max();
    histogram.maxVals[1] = histogram.vals[1].max();
    histogram.maxVals[2] = histogram.vals[2].max();

    histogram.avgVals[0] = histogram.vals[0].average();
    histogram.avgVals[1] = histogram.vals[1].average();
    histogram.avgVals[2] = histogram.vals[2].average();

    return histogram;
}

function zeroArray256() {
  arr = [];
  for (var i=0; i<256; i++) { arr[i] = 0; }
  return arr;
}

Array.prototype.max = function () {
    return Math.max.apply(Math, this);
};

Array.prototype.average = function () {
    var sum = 0, j = 0;
   for (var i = 0; i < this.length, isFinite(this[i]); i++) {
          sum += parseFloat(this[i]); ++j;
    }
   return j ? sum / j : 0;
};

/*********************************
 * File dragging behavior
 *********************************/

function fileDragHover(e) {
	e.stopPropagation();
	e.preventDefault();
	$id("filedrag").className = (e.type == "dragover" ? "hover" : "");

    if (e.type == "dragover"){
        $id("filedrag").className = "hover";
        $id("filedrag").innerHTML = "Drop to load!";
    } else {
        $id("filedrag").className = "";
        $id("filedrag").innerHTML = "Drag and drop or click here to load a file";
    }

}

function fileSelectHandler(e) {
	//Cancel event
	fileDragHover(e);

	//Get files
	var files = e.target.files || e.dataTransfer.files;

	//Load the first file
    loadImageFile(files);
}

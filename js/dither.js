/*
 
 	Tobias, 2015.
 	tobiastoft@gmail.com

 */


/* Call with:

drawDitherResult(canvas, ditherAtkinsons);
drawDitherResult(canvas, ditherFloydSteinberg);
drawDitherResult(canvas, ditherHalftone);
...etc

*/

var dither = {};

dither.convertToGrayscale = true;

dither.applyFilter = function(index){
  if (index < this.filters.length && index >= 0){
    this.drawDitherResult(canvas, this.filters[index][1]);
  } else {
    console.log("Filter not found. Out of bounds.");
  }
}

dither.drawDitherResult = function(canvasIn, canvasOut, ditherer) {  
  var ctxIn = canvasIn.getContext('2d');
  var ctxOut = canvasOut.getContext('2d');

  //Create object for holding image data separately
  var imageData = ctxIn.getImageData(0, 0, canvasIn.width, canvasIn.height);
    
  console.log(imageData);

  //Get raw data
  var data = imageData.data;

  //Convert to weighted grayscale
  if (dither.convertToGrayscale){
    for(var i = 0; i < data.length; i += 4) {
      var brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
      // red
      data[i] = brightness;
      // green
      data[i + 1] = brightness;
      // blue
      data[i + 2] = brightness;
    }
  }

  //Run through ditherer
  ditherer(imageData);    
    
  //Put the dithered data back in the canvas object
  ctxOut.putImageData(imageData, 0, 0);
}

//utility function for mapping from one range to another
function mapRange(value, srcRange, dstRange){
  // value is outside source range return
  if (value < srcRange[0] || value > srcRange[1]){
    return NaN; 
  }

  var srcMax = srcRange[1] - srcRange[0],
      dstMax = dstRange[1] - dstRange[0],
      adjValue = value - srcRange[0];

  return (adjValue * dstMax / srcMax) + dstRange[0];

}

//utility function for lowering resolution
dither.snapToN = function(valIn, n){
  //convert to lower depth
  var val = Math.round( mapRange(valIn, [0, 255], [1, n]) );
  val = Math.round( mapRange(val, [1, n], [0, 255]) );
  
  return val;
}

dither.adjustPixelError = function(data, i, error, multiplier) {
  data[i] = data[i] + multiplier * error[0]; 
  data[i + 1] = data[i + 1] + multiplier * error[1]; 
  data[i + 2] = data[i + 2] + multiplier * error[2]; 
}

dither.dither4Bit = function(imageData){
  dither.ditherNBit(imageData, 16);
}

dither.dither3Bit = function(imageData){
  dither.ditherNBit(imageData, 8);
}

dither.dither2Bit = function(imageData){
  dither.ditherNBit(imageData, 4);
}

dither.dither1Bit = function(imageData){
  dither.ditherNBit(imageData, 2);
}

dither.ditherNBit = function(imageData, depth) {
  var data = imageData.data;

  for (var i = 0; i < data.length; i += 4) {
    data[i] = dither.snapToN( data[i], depth ); //R
    data[i + 1] = dither.snapToN( data[i + 1], depth ); //G
    data[i + 2] = dither.snapToN( data[i + 2], depth ); //B
  }
}


/***************************************************************
 *                                                             *
 *  Various threshold maps for the ordered dithering function  *
 *                                                             *
 *  Most threshold maps are from the ImageMagick XML files     *
 *                                                             *
 *  Find more here:                                            *
 *  http://www.imagemagick.org/Usage/quantize/#thresholds_xml  * 
 *                                                             *
 ***************************************************************/

/****
  ORDERED MAPS
 ****/

dither.ditherBayerOrdered2x2 = function(imageData){
  //standard 2x2
  var thresholdMap = [
  [1, 3],
  [4, 2]
  ];
  
  dither.ditherBayer(imageData, thresholdMap);
}

dither.ditherBayerOrdered3x3 = function(imageData){
  //standard 3x3
  var thresholdMap = [
  [3, 7, 4],
  [6, 1, 9],
  [2, 8, 5]
  ];
  
  dither.ditherBayer(imageData, thresholdMap);
}

dither.ditherBayerOrdered4x4 = function(imageData){
  //standard 4x4
  var thresholdMap = [
  [1, 9, 3, 11],
  [13, 5, 15, 7],
  [4, 12, 2, 10],
  [16, 8, 14, 6]
  ];
  
  dither.ditherBayer(imageData, thresholdMap);
}

dither.ditherBayerOrdered8x8 = function(imageData){
  //8x8 ordered
  var thresholdMap = [
  [1,  49, 13, 61, 4,  52, 16, 64 ],
  [33, 17, 45, 29, 36, 20, 48, 32 ],
  [9,  57, 5,  53, 12, 60, 8,  56 ],
  [41, 25, 37, 21, 44, 28, 40, 24 ],
  [3,  51, 15, 63, 2,  50, 14, 62 ],
  [35, 19, 47, 31, 34, 18, 46, 30 ],
  [11, 59, 7,  55, 10, 58, 6,  54 ],
  [43, 27, 39, 23, 42, 26, 38, 22]
  ];
  
  dither.ditherBayer(imageData, thresholdMap);
}

/****
  HALFTONE MAPS – ANGLED
 ****/

dither.ditherBayerHalftone4x4Angled = function(imageData){
  //halftone 4x4 angled
  var thresholdMap = [
  [4, 2, 7, 5],
  [3, 1, 8, 6],
  [7, 5, 4, 2],
  [8, 6, 3, 1]
  ];
  
  dither.ditherBayer(imageData, thresholdMap);
}

dither.ditherBayerHalftone6x6Angled = function(imageData){
  //halftone 6x6 angled
  var thresholdMap = [
  [14, 13, 10, 8,  2,  3],
  [16, 18, 12, 7,  1,  4],
  [15, 17, 11, 9,  6,  5],
  [8,  2,  3, 14, 13, 10],
  [7,  1,  4, 16, 18, 12],
  [9,  6,  5, 15, 17, 11]
  ];
  
  dither.ditherBayer(imageData, thresholdMap);
}

dither.ditherBayerHalftone8x8Angled = function(imageData){
  //halftone 8x8 angled
  var thresholdMap = [
  [13,   7,   8,  14,  17,  21,  22,  18],
  [ 6,   1,   3,   9,  28,  31,  29,  23],
  [ 5,   2,   4,  10,  27,  32,  30,  24],
  [16,  12,  11,  15,  20,  26,  25,  19],
  [17,  21,  22,  18,  13,   7,   8,  14],
  [28,  31,  29,  23,   6,   1,   3,   9],
  [27,  32,  30,  24,   5,   2,   4,  10],
  [20,  26,  25,  19,  16,  12,  11,  15]
  ];
  
  dither.ditherBayer(imageData, thresholdMap);
}

/****
  HALFTONE MAPS – ORTHOGONALLY ALIGNED OR UNANGLED
 ****/

dither.ditherBayerHalftone4x4Orthogonal = function(imageData){
  //halftone 4x4 orthogonally aligned
  var thresholdMap = [
  [ 7, 13, 11,  4],
  [12, 16, 14,  8],
  [10, 15,  6,  2],
  [ 5,  9,  3,  1]
  ];
  
  dither.ditherBayer(imageData, thresholdMap);
}

dither.ditherBayerHalftone6x6Orthogonal = function(imageData){
  //halftone 6x6 orthogonally aligned
  var thresholdMap = [
  [ 7,  17,  27,  14,   9,   4],
  [21,  29,  33,  31,  18,  11],
  [24,  32,  36,  34,  25,  22],
  [19,  30,  35,  28,  20,  10],
  [ 8,  15,  26,  16,   6,   2],
  [ 5,  13,  23,  12,   3,   1]
  ];
  
  dither.ditherBayer(imageData, thresholdMap);
}

dither.ditherBayerHalftone8x8Orthogonal = function(imageData){
  //halftone 8x8 orthogonally aligned
  var thresholdMap = [
  [ 7,  21,  33,  43,  36,  19,   9,   4],
  [16,  27,  51,  55,  49,  29,  14,  11],
  [31,  47,  57,  61,  59,  45,  35,  23],
  [41,  53,  60,  64,  62,  52,  40,  38],
  [37,  44,  58,  63,  56,  46,  30,  22],
  [15,  28,  48,  54,  50,  26,  17,  10],
  [ 8,  18,  34,  42,  32,  20,   6,   2],
  [ 5,  13,  25,  39,  24,  12,   3,   1]
  ];
  
  dither.ditherBayer(imageData, thresholdMap);
}

dither.ditherBayerHalftone16x16Orthogonal = function(imageData){
  //halftone 16x16 orthogonally aligned (huge)
  var thresholdMap = [
  [  4,  12,  24,  44,  72, 100, 136, 152, 150, 134,  98,  70,  42,  23,  11,   3],
  [  7,  16,  32,  52,  76, 104, 144, 160, 158, 142, 102,  74,  50,  31,  15,   6],
  [ 19,  27,  40,  60,  92, 132, 168, 180, 178, 166, 130,  90,  58,  39,  26,  18],
  [ 36,  48,  56,  80, 124, 176, 188, 204, 203, 187, 175, 122,  79,  55,  47,  35],
  [ 64,  68,  84, 116, 164, 200, 212, 224, 223, 211, 199, 162, 114,  83,  67,  63],
  [ 88,  96, 112, 156, 192, 216, 232, 240, 239, 231, 214, 190, 154, 111,  95,  87],
  [108, 120, 148, 184, 208, 228, 244, 252, 251, 243, 226, 206, 182, 147, 119, 107],
  [128, 140, 172, 196, 219, 235, 247, 256, 255, 246, 234, 218, 194, 171, 139, 127],
  [126, 138, 170, 195, 220, 236, 248, 253, 254, 245, 233, 217, 193, 169, 137, 125],
  [106, 118, 146, 183, 207, 227, 242, 249, 250, 241, 225, 205, 181, 145, 117, 105],
  [ 86,  94, 110, 155, 191, 215, 229, 238, 237, 230, 213, 189, 153, 109,  93,  85],
  [ 62,  66,  82, 115, 163, 198, 210, 221, 222, 209, 197, 161, 113,  81,  65,  61],
  [ 34,  46,  54,  78, 123, 174, 186, 202, 201, 185, 173, 121,  77,  53,  45,  33],
  [ 20,  28,  37,  59,  91, 131, 167, 179, 177, 165, 129,  89,  57,  38,  25,  17],
  [  8,  13,  29,  51,  75, 103, 143, 159, 157, 141, 101,  73,  49,  30,  14,   5],
  [  1,   9,  21,  43,  71,  99, 135, 151, 149, 133,  97,  69,  41,  22,  10,   2]
  ];
  
  dither.ditherBayer(imageData, thresholdMap);
}

/****
  HALFTONE MAPS – ORTHOGONALLY EXPANDING CIRCLES
 ****/

dither.ditherBayerHalftoneCircular5x5Black = function(imageData){
  //halftone circular 5x5 black
  var thresholdMap = [
  [1, 21, 16, 15,  4],
  [5, 17, 20, 19, 14],
  [6, 21, 25, 24, 12],
  [7, 18, 22, 23, 11],
  [2,  8,  9, 10,  3]
  ];
  
  dither.ditherBayer(imageData, thresholdMap);
}

dither.ditherBayerHalftoneCircular5x5White = function(imageData){
  //halftone circular 5x5 white
  var thresholdMap = [
  [25, 21, 10, 11, 22],
  [20,  9,  6,  7, 12],
  [19,  5,  1,  2, 13],
  [18,  8,  4,  3, 14],
  [24, 17, 16, 15, 23]
  ];
  
  dither.ditherBayer(imageData, thresholdMap);
}

dither.ditherBayerHalftoneCircular6x6Black = function(imageData){
  //halftone circular 6x6 black
  var thresholdMap = [
  [ 1,  5, 14, 13, 12,  4],
  [ 6, 22, 28, 27, 21, 11],
  [15, 29, 35, 34, 26, 20],
  [16, 30, 36, 33, 25, 19],
  [ 7, 23, 31, 32, 24, 10],
  [ 2,  8, 17, 18,  9,  3]
  ];
  
  dither.ditherBayer(imageData, thresholdMap);
}

dither.ditherBayerHalftoneCircular6x6White = function(imageData){
  //halftone circular 6x6 white
  var thresholdMap = [
  [36, 32, 23, 24, 25, 33],
  [31, 15,  9, 10, 16, 26],
  [22,  8,  2,  3, 11, 17],
  [21,  7,  1,  4, 12, 18],
  [30, 14,  6,  5, 13, 27],
  [35, 29, 20, 19, 28, 34]
  ];
  
  dither.ditherBayer(imageData, thresholdMap);
}

dither.ditherBayerHalftoneCircular7x7Black = function(imageData){
  //halftone circular 7x7 black
  var thresholdMap = [
  [ 3,  9, 18, 28, 17,  8,  2],
  [10, 24, 33, 39, 32, 23,  7],
  [19, 34, 44, 48, 43, 31, 16],
  [25, 40, 45, 49, 47, 38, 27],
  [20, 35, 41, 46, 42, 29, 15],
  [11, 21, 36, 37, 28, 22,  6],
  [ 4, 12, 13, 26, 14,  5,  1]
  ];
  
  dither.ditherBayer(imageData, thresholdMap);
}

dither.ditherBayerHalftoneCircular7x7White = function(imageData){
  //halftone circular 7x7 white
  var thresholdMap = [
  [47, 41, 32, 22, 33, 42, 48],
  [40, 26, 17, 11, 18, 27, 43],
  [31, 16,  6,  2,  7, 19, 34],
  [25, 10,  5,  1,  3, 12, 23],
  [30, 15,  9,  4,  8, 20, 35],
  [39, 29, 14, 13, 21, 28, 44],
  [46, 38, 37, 24, 36, 45, 49]
  ];
  
  dither.ditherBayer(imageData, thresholdMap);
}

/****
  CUSTOM MAPS
 ****/

dither.ditherBayerDiagonalLines = function(imageData){
  //45 diagonal map
  var thresholdMap = [
  [4, 2, 1, 3, 5],
  [2, 1, 3, 5, 4],
  [1, 3, 5, 4, 2],
  [3, 5, 4, 2, 1],
  [5, 4, 2, 1, 3]
  ];

  dither.ditherBayer(imageData, thresholdMap);
}

dither.ditherBayerVerticalLines = function(imageData){
  //vertical lines
  var thresholdMap = [
  [7, 8, 8, 8, 8, 7, 6, 6, 5, 5, 5, 6],
  [2, 1, 1, 1, 1, 2, 3, 4, 4, 4, 3, 3],
  [6, 6, 5, 5, 5, 6, 7, 8, 8, 8, 8, 7],
  [3, 4, 4, 4, 3, 3, 2, 1, 1, 1, 1, 2]
  ];

  dither.ditherBayer(imageData, thresholdMap);
}

/****
  ^^^ END OF MAPS ^^^
 ****/

dither.ditherBayer = function(imageData, thresholdMap) {
  var width = imageData.width,
  height = imageData.height,
  data = imageData.data;

  var thresholdMapSizeX = thresholdMap.length;
  var thresholdMapSizeY = thresholdMap[0].length;

  //get depth of map
  var depth = 0;
  for (var j = 0; j<thresholdMap.length; j++){
    for (var k = 0; k<thresholdMap[j].length; k++){
      if (thresholdMap[j][k] > depth){
        depth = thresholdMap[j][k];
      }
    }
  }

  //increase depth to be one level higher than the max value in the map
  depth++;

  //go through thresholds
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      var i = 4 * (y * width + x);

      //gray = .3 * data[i] + .59 * data[i + 1] + .11 * data[i + 2];
      
      //support color
      for (var p = 0; p<3; p++){
        scaled = (data[i + p] * depth) / 255; //get scaled value of pixel's color component

        var val = 0x00;
        if (scaled > thresholdMap[x % thresholdMapSizeX][y % thresholdMapSizeY]){
          val = 0xff;
        }

        data[i + p] = val;

      }
    }
  }
}


dither.ditherHalftone = function(imageData) {
  var width = imageData.width,
  height = imageData.height,
  data = imageData.data;

  for (var y = 0; y <= height - 2; y += 3) {
    for (var x = 0; x <= width - 2; x += 3) {

      sum_r = sum_g = sum_b = 0;
      indexed = [];
      count = 0;
      for (s_y = 0; s_y < 3; s_y++) {
        for (s_x = 0; s_x < 3; s_x++) {
          i = 4 * (width * (y + s_y) + (x + s_x));
          sum_r += data[i];
          sum_g += data[i + 1];
          sum_b += data[i + 2];

          data[i] = data[i + 1] = data[i + 2] = 0xff;

          indexed.push(i);
          count++;
        }
      }

      avg_r = (sum_r / 9) > 127 ? 0xff : 00;
      avg_g = (sum_g / 9) > 127 ? 0xff : 00;
      avg_b = (sum_b / 9) > 127 ? 0xff : 00;

      avg_lum = (avg_r + avg_g + avg_b) / 3;
      scaled = Math.round((avg_lum * 9) / 255);

      if (scaled < 9) {
        data[indexed[4]] = avg_r;
        data[indexed[4] + 1] = avg_g;
        data[indexed[4] + 2] = avg_b;
      }

      if (scaled < 8) {
        data[indexed[5]] = avg_r;
        data[indexed[5] + 1] = avg_g;
        data[indexed[5] + 2] = avg_b;
      }

      if (scaled < 7) {
        data[indexed[1]] = avg_r;
        data[indexed[1] + 1] = avg_g;
        data[indexed[1] + 2] = avg_b;
      }

      if (scaled < 6) {
        data[indexed[6]] = avg_r;
        data[indexed[6] + 1] = avg_g;
        data[indexed[6] + 2] = avg_b;
      }

      if (scaled < 5) {
        data[indexed[3]] = avg_r;
        data[indexed[3] + 1] = avg_g;
        data[indexed[3] + 2] = avg_b;
      }

      if (scaled < 4) {
        data[indexed[8]] = avg_r;
        data[indexed[8] + 1] = avg_g;
        data[indexed[8] + 2] = avg_b;
      }

      if (scaled < 3) {
        data[indexed[2]] = avg_r;
        data[indexed[2] + 1] = avg_g;
        data[indexed[2] + 2] = avg_b;
      }

      if (scaled < 2) {
        data[indexed[0]] = avg_r;
        data[indexed[0] + 1] = avg_g;
        data[indexed[0] + 2] = avg_b;
      }

      if (scaled < 1) {
        data[indexed[7]] = avg_r;
        data[indexed[7] + 1] = avg_g;
        data[indexed[7] + 2] = avg_b;
      }
    }
  }
}

/*
 *  Atkinson
 */

dither.ditherAtkinsons4bit = function(imageData){
  dither.ditherAtkinsonsNbit(imageData, 16);
}

dither.ditherAtkinsons3bit = function(imageData){
  dither.ditherAtkinsonsNbit(imageData, 8);
}

dither.ditherAtkinsons2bit = function(imageData){
  dither.ditherAtkinsonsNbit(imageData, 4);
}

dither.ditherAtkinsons1bit = function(imageData){
  dither.ditherAtkinsonsNbit(imageData, 2);
}

dither.ditherAtkinsonsNbit = function(imageData, depth) {
  /* 
    Redistribute the quantization error:
         *  1/8 1/8
    1/8 1/8 1/8
        1/8
  */

  var width = imageData.width;
  var d = 8; //divisor
  var neighbours =                /* X */   [4,          8,
                    (4*width)-4, (4*width), (4*width)+4,
                                 (4*width*2)];

  var weights =           [1/d, 1/d, 1/d, 1/d, 1/d, 1/d];

  dither.ditherGeneric(imageData, depth, neighbours, weights);
}

/*
 *  Floyd-Steinberg
 */

dither.ditherFloydSteinberg4bit = function(imageData){
  dither.ditherFloydSteinbergNbit(imageData, 16);
}

dither.ditherFloydSteinberg3bit = function(imageData){
  dither.ditherFloydSteinbergNbit(imageData, 8);
}

dither.ditherFloydSteinberg2bit = function(imageData){
  dither.ditherFloydSteinbergNbit(imageData, 4);
}

dither.ditherFloydSteinberg1bit = function(imageData){
  dither.ditherFloydSteinbergNbit(imageData, 2);
}

dither.ditherFloydSteinbergNbit = function(imageData, depth) {
  /* 
    Redistribute the quantization error:
      * 7
    3 5 1 
  */

  var width = imageData.width;
  var d = 16; //divisor
  var neighbours =                /* X */   [4, 
                    (4*width)-4, (4*width), (4*width)+4];

  var weights =           [7/d, 
                 3/d, 5/d, 1/d];

  dither.ditherGeneric(imageData, depth, neighbours, weights);
}


/*
 *  Function for applying the error diffusion
 */

dither.ditherGeneric = function(imageData, depth, neighbours, weights) {
  var data = imageData.data;

  for (var i=0; i<data.length; i+=4){
    var old_r = data[i]
    var old_g = data[i + 1]
    var old_b = data[i + 2];

    var new_r = dither.snapToN(old_r, depth);
    var new_g = dither.snapToN(old_g, depth);
    var new_b = dither.snapToN(old_b, depth);

    data[i] = new_r;
    data[i + 1] = new_g;
    data[i + 2] = new_b;

    var err_r = old_r - new_r;
    var err_g = old_g - new_g;
    var err_b = old_b - new_b;

    for (var j=0; j<neighbours.length; j++){
      var adj = i+neighbours[j];
      dither.adjustPixelError(data, adj, [err_r, err_g, err_b], weights[j]);
    }
  }
}


/****
  Array with function references and names for populating SELECT options.
 ****/

dither.filters = [
  ["No dithering 4 bits/channel", dither.dither4Bit],
  ["No dithering 3 bits/channel", dither.dither3Bit],
  ["No dithering 2 bits/channel", dither.dither2Bit],
  ["No dithering 1 bit/channel", dither.dither1Bit],

  ["Atkinson's 4-bit", dither.ditherAtkinsons4bit],
  ["Atkinson's 3-bit", dither.ditherAtkinsons3bit],
  ["Atkinson's 2-bit", dither.ditherAtkinsons2bit],
  ["Atkinson's 1-bit", dither.ditherAtkinsons1bit],

  ["Floyd-Steinberg 4-bit", dither.ditherFloydSteinberg4bit],
  ["Floyd-Steinberg 3-bit", dither.ditherFloydSteinberg3bit],
  ["Floyd-Steinberg 2-bit", dither.ditherFloydSteinberg2bit],
  ["Floyd-Steinberg 1-bit", dither.ditherFloydSteinberg1bit],

  ["Pixelated Halftone", dither.ditherHalftone],

  ["Bayer Diagonal lines", dither.ditherBayerDiagonalLines],
  ["Bayer Vertical lines", dither.ditherBayerVerticalLines],

  ["Bayer Ordered 2x2", dither.ditherBayerOrdered2x2],
  ["Bayer Ordered 3x3", dither.ditherBayerOrdered3x3],
  ["Bayer Ordered 4x4", dither.ditherBayerOrdered4x4],
  ["Bayer Ordered 8x8", dither.ditherBayerOrdered8x8],

  ["Bayer Halftone 4x4 Angled", dither.ditherBayerHalftone4x4Angled],
  ["Bayer Halftone 6x6 Angled", dither.ditherBayerHalftone6x6Angled],
  ["Bayer Halftone 8x8 Angled", dither.ditherBayerHalftone8x8Angled],

  ["Bayer Halftone 4x4 Orthogonal", dither.ditherBayerHalftone4x4Orthogonal],
  ["Bayer Halftone 6x6 Orthogonal", dither.ditherBayerHalftone6x6Orthogonal],
  ["Bayer Halftone 8x8 Orthogonal", dither.ditherBayerHalftone8x8Orthogonal],
  ["Bayer Halftone 16x16 Orthogonal", dither.ditherBayerHalftone16x16Orthogonal],

  ["Bayer Halftone Circular 5x5 Black", dither.ditherBayerHalftoneCircular5x5Black],
  ["Bayer Halftone Circular 5x5 White", dither.ditherBayerHalftoneCircular5x5White],
  ["Bayer Halftone Circular 6x6 Black", dither.ditherBayerHalftoneCircular6x6Black],
  ["Bayer Halftone Circular 6x6 White", dither.ditherBayerHalftoneCircular6x6White],
  ["Bayer Halftone Circular 7x7 Black", dither.ditherBayerHalftoneCircular7x7Black],
  ["Bayer Halftone Circular 7x7 White", dither.ditherBayerHalftoneCircular7x7White]
];
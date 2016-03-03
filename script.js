/*
git commit -am "your message goes here"
git push
*/
/*TODO 
Color tutorial
Camera
Matrix inverse
http://stackoverflow.com/a/29514445/3492994
*/
var gl; //WebGL lives in here!
var glcanvas; //Our canvas
//Translation
var pos = [0, -6, 0],
  velocity = [0, 0, 0];
//Rotation
var rotation = [35, 135, 0];
var scale = 0.05;
var matrixLoc;

var MatrixMath = {
  rotationXMatrix: function(angle) {
    var angleInRadians = angle * Math.PI / 180;
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1
    ];
  },
  rotationYMatrix: function(angle) {
    var angleInRadians = angle * Math.PI / 180;
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1
    ];
  },
  rotationZMatrix: function(angle) {
    var angleInRadians = angle * Math.PI / 180;
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [
      c, s, 0, 0, //Hehe, no screwing up my formatting, ok!?
      -s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  },
  translationMatrix: function(tx, ty, tz) {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      tx, ty, tz, 1
    ];
  },
  scaleMatrix: function(scale) {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, scale
    ];
  },
  scaleDimensionsMatrix: function(scaleX, scaleY, scaleZ) {
    return [
      scaleX, 0, 0, 0,
      0, scaleY, 0, 0,
      0, 0, scaleZ, 0,
      0, 0, 0, 1
    ];
  },
  perspectiveMatrix: function(fudgeFactor) {
    //z to w
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, fudgeFactor,
      0, 0, 0, 1,
    ]
  },
  makePerspective: function(fieldOfViewInRadians, aspect, near, far) {
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    var rangeInv = 1.0 / (near - far);

    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
  },
  multiply: function(matrix1, matrix2) {
    if (matrix1.length != 16 || matrix2.length != 16) {
      throw Error("The matrices need to be 4 * 4.");
    }
    var returnMatrix = [];
    for (var y = 0; y < 4; y++) {
      for (var x = 0; x < 4; x++) {
        var dotProduct = 0;
        for (var count = 0; count < 4; count++) {
          dotProduct += matrix1[y * 4 + count] * matrix2[count * 4 + x];
        }

        returnMatrix[y * 4 + x] = dotProduct;
      }
    }
    return returnMatrix;
  },
  dotProcuct: function(array1, array2) {
    if (array1.length != array2.length) {
      throw Error("Not same length.");
    }
    //Multiply each element of array2 by array1[i] and get their sum
    return array2.map((s, i) => array1[i] * s).reduce((prev, curr) => prev + curr);
  },
  transpose: function(matrix) {
    if (matrix.length != 16) {
      throw Error("The matrix needs to be 4 * 4.");
    }
    console.log(matrix);
    var transposedMatrix = [];
    for (var y = 0; y < 4; y++) {
      for (var x = 0; x < 4; x++) {
        transposedMatrix[x * 4 + y] = matrix[y * 4 + x];
      }
    }
    return transposedMatrix;
  }
};
var PerlinNoise = {
  //Our noisy noise
  noise: [],
  //How large the cells should be (int points)
  cellSize: 30,
  possibleVectors: [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ],
  vectors: [],
  setUp: function(noiseLength) {
    for (var i = 0; i < noiseLength; i++) {
      this.noise[i] = new Array(noiseLength);
    }
    for (var i = 0; i < Math.ceil(noiseLength / this.cellSize) + 1; i++) {
      this.vectors[i] = new Array(Math.ceil(noiseLength / this.cellSize) + 1);
    }

  },
  perlinNoise: function(noiseLength) {
    this.setUp(noiseLength);
    this.genVectors();
    for (var x = 0; x < noiseLength; x++) {
      for (var y = 0; y < noiseLength; y++) {
        this.noise[x][y] = this.point(x, y);
      }
    }
  },
  point: function(x, y) {
    //Our location relative to the current cell (0.something)
    var inCellX = (x % this.cellSize) / this.cellSize;
    var inCellY = (y % this.cellSize) / this.cellSize;
    x = Math.floor(x / this.cellSize);
    y = Math.floor(y / this.cellSize);
    //Create some random vectors (the gradient vectors)
    var dotProcucts = [
      this.dotProduct(this.vectors[x][y], inCellX, inCellY),
      this.dotProduct(this.vectors[x + 1][y], inCellX - 1, inCellY),
      this.dotProduct(this.vectors[x][y + 1], inCellX, inCellY - 1),
      this.dotProduct(this.vectors[x + 1][y + 1], inCellX - 1, inCellY - 1),
    ];

    //Blend factor?
    inCellX = this.smoothCurve(inCellX);
    inCellY = this.smoothCurve(inCellY);

    //Blend the top/bottom corners
    var interpolatedx1 = this.lerp(dotProcucts[0], dotProcucts[1], inCellX);
    var interpolatedx2 = this.lerp(dotProcucts[2], dotProcucts[3], inCellX);

    //Blend the blended stuff
    return this.lerp(interpolatedx1, interpolatedx2, inCellY);
  },
  genVectors: function() {
    for (var i = 0; i < this.vectors.length; i++) {
      for (var j = 0; j < this.vectors.length; j++) {
        this.vectors[i][j] = Math.floor(Math.random() * this.possibleVectors.length);
      }
    }
  },
  smoothCurve: function(value) {
    return Math.pow(value, 3) * (value * (value * 6 - 15) + 10);
  },
  //Linear interpolation
  lerp: function(a, b, t) {
    return a + t * (b - a);
  },
  dotProduct: function(vecID, x2, y2) {
    return this.possibleVectors[vecID][0] * x2 + this.possibleVectors[vecID][1] * y2;
  }
};

function fractalNoise(size, octaves, deltaFrequency, deltaAmplitude) {
  var fNoise = [];
  for (var i = 0; i < size; i++) {
    fNoise[i] = new Array(size).fill(0);
  }

  var amplitude = 1;
  for (var j = 0; j < octaves; j++) {
    PerlinNoise.perlinNoise(size);
    for (var x = 0; x < PerlinNoise.noise.length; x++) {
      for (var y = 0; y < PerlinNoise.noise[x].length; y++) {
        fNoise[x][y] += PerlinNoise.noise[x][y] * amplitude;

      }
    }
    amplitude /= deltaAmplitude;
    PerlinNoise.cellSize /= deltaFrequency;
  }
  return fNoise;
}

//Called by the body


function start() {
  //init canvas
  glcanvas = document.getElementById("glcanvas");
  glcanvas.width = window.innerWidth;
  glcanvas.height = window.innerHeight;
  //Events
  window.addEventListener('resize', () => {
    glcanvas.width = window.innerWidth;
    glcanvas.height = window.innerHeight;
  }, false);
  window.addEventListener("keydown", keyboardHandlerDown);
  window.addEventListener("keyup", keyboardHandlerUp);
  window.addEventListener("wheel", scrollHandler);
  window.addEventListener("mousemove", mouseHandler);
  glcanvas.requestPointerLock = glcanvas.requestPointerLock ||
    glcanvas.mozRequestPointerLock ||
    glcanvas.webkitRequestPointerLock;
  window.addEventListener("click", () => {
    glcanvas.requestPointerLock();
  });

  //Init WebGL
  PerlinNoise.cellSize = 60;
  var noise = fractalNoise(400, 6, 2, 2);
  gl = initWebGL(glcanvas);

  if (gl) {
    var vbo = [];
    //Array to valid VBO data
    for (var x = 0; x < noise.length - 1; x++) {
      for (var y = 0; y < noise.length - 1; y++) {
        vbo.push(x);
        vbo.push(noise[x][y] * 40);
        vbo.push(y);

        vbo.push(x);
        vbo.push(noise[x][y + 1] * 40);
        vbo.push(y + 1);

        vbo.push(x + 1);
        vbo.push(noise[x + 1][y] * 40);
        vbo.push(y);


        vbo.push(x);
        vbo.push(noise[x][y + 1] * 40);
        vbo.push(y + 1);

        vbo.push(x + 1);
        vbo.push(noise[x + 1][y] * 40);
        vbo.push(y);

        vbo.push(x + 1);
        vbo.push(noise[x + 1][y + 1] * 40);
        vbo.push(y + 1);
      }
    }
    //F
    /*var buffer = createVBO([
      // left column front
      0, 0, 0,
      0, 150, 0,
      30, 0, 0,
      0, 150, 0,
      30, 150, 0,
      30, 0, 0,

      // top rung front
      30, 0, 0,
      30, 30, 0,
      100, 0, 0,
      30, 30, 0,
      100, 30, 0,
      100, 0, 0,

      // middle rung front
      30, 60, 0,
      30, 90, 0,
      67, 60, 0,
      30, 90, 0,
      67, 90, 0,
      67, 60, 0,

      // left column back
      0, 0, 30,
      30, 0, 30,
      0, 150, 30,
      0, 150, 30,
      30, 0, 30,
      30, 150, 30,

      // top rung back
      30, 0, 30,
      100, 0, 30,
      30, 30, 30,
      30, 30, 30,
      100, 0, 30,
      100, 30, 30,

      // middle rung back
      30, 60, 30,
      67, 60, 30,
      30, 90, 30,
      30, 90, 30,
      67, 60, 30,
      67, 90, 30,

      // top
      0, 0, 0,
      100, 0, 0,
      100, 0, 30,
      0, 0, 0,
      100, 0, 30,
      0, 0, 30,

      // top rung front
      100, 0, 0,
      100, 30, 0,
      100, 30, 30,
      100, 0, 0,
      100, 30, 30,
      100, 0, 30,

      // under top rung
      30, 30, 0,
      30, 30, 30,
      100, 30, 30,
      30, 30, 0,
      100, 30, 30,
      100, 30, 0,

      // between top rung and middle
      30, 30, 0,
      30, 60, 30,
      30, 30, 30,
      30, 30, 0,
      30, 60, 0,
      30, 60, 30,

      // top of middle rung
      30, 60, 0,
      67, 60, 30,
      30, 60, 30,
      30, 60, 0,
      67, 60, 0,
      67, 60, 30,

      // front of middle rung
      67, 60, 0,
      67, 90, 30,
      67, 60, 30,
      67, 60, 0,
      67, 90, 0,
      67, 90, 30,

      // bottom of middle rung.
      30, 90, 0,
      30, 90, 30,
      67, 90, 30,
      30, 90, 0,
      67, 90, 30,
      67, 90, 0,

      // front of bottom
      30, 90, 0,
      30, 150, 30,
      30, 90, 30,
      30, 90, 0,
      30, 150, 0,
      30, 150, 30,

      // bottom
      0, 150, 0,
      0, 150, 30,
      30, 150, 30,
      0, 150, 0,
      30, 150, 30,
      30, 150, 0,

      // left side
      0, 0, 0,
      0, 0, 30,
      0, 150, 30,
      0, 0, 0,
      0, 150, 30,
      0, 150, 0
    ]);*/
    console.log(vbo.length);
    var buffer = createVBO(vbo);
    //Shaders
    var vertexShader = createShader(`
    attribute vec4 coordinates;
    
    uniform mat4 u_matrix; //The Matrix!
    
    varying vec4 color;
    void main(void){
      gl_Position = u_matrix * coordinates;
      color = coordinates;
    }`, gl.VERTEX_SHADER);

    var fragmentShader = createShader(`
    precision mediump float;
    varying vec4 color;
    void main() {
    if(color.y < -25.0) {
      gl_FragColor = vec4(-color.y/40.0, -color.y/40.0, -color.y/40.0, 1);  // white
    } else if(color.y < 0.0) {
      gl_FragColor = vec4(0, -color.y/30.0, 0, 1);  // green
    } else {
      gl_FragColor = vec4(0, 0, color.y/10.0, 1);  // blue
    }
    }`, gl.FRAGMENT_SHADER);

    // Put the vertex shader and fragment shader together into
    // a complete program
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(shaderProgram));

    // Everything we need has now been copied to the graphics
    // hardware, so we can start drawing

    // Clear the drawing surface
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Tell WebGL which shader program to use
    gl.useProgram(shaderProgram);
    //Feed the shader
    feedShader(shaderProgram, buffer, "coordinates");
    //Get the uniform variables
    matrixLoc = gl.getUniformLocation(shaderProgram, "u_matrix");
    gl.enable(gl.DEPTH_TEST);
    //gl.enable(gl.CULL_FACE);

    window.requestAnimationFrame(redraw);
  }
}

function redraw() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  pos[0] += velocity[0];
  pos[1] += velocity[1];
  pos[2] += velocity[2];
  //Our matrix
  /*var matrix = MatrixMath.multiply(MatrixMath.scaleDimensionsMatrix(scale, -scale, scale), MatrixMath.rotationXMatrix(rotation[0]));
  matrix = MatrixMath.multiply(matrix, MatrixMath.rotationYMatrix(rotation[1]))
  matrix = MatrixMath.multiply(matrix, MatrixMath.translationMatrix(pos[0], pos[1], pos[2]));
  matrix = MatrixMath.multiply(matrix, MatrixMath.perspectiveMatrix(1));*/

  var matrix = MatrixMath.multiply(MatrixMath.scaleDimensionsMatrix(scale, -scale, scale), MatrixMath.translationMatrix(pos[0], pos[1], pos[2]));
  matrix = MatrixMath.multiply(matrix, MatrixMath.rotationYMatrix(rotation[1]));
  matrix = MatrixMath.multiply(matrix, MatrixMath.rotationXMatrix(rotation[0]));
  matrix = MatrixMath.multiply(matrix, MatrixMath.makePerspective(1, glcanvas.clientWidth / glcanvas.clientHeight, 1, 100));
//Pass data to shader
gl.uniformMatrix4fv(matrixLoc, false, matrix);
//Triangle (Number of triangles)
gl.drawArrays(gl.TRIANGLES, 0, 2865618 / 3);
window.requestAnimationFrame(redraw);
}

function createVBO(vertices) {
  // Copy an array of data points forming a triangle to the
  // graphics hardware
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  return buffer;
}

function createShader(shaderCode, shaderType) {
  var shader = gl.createShader(shaderType);
  gl.shaderSource(shader, shaderCode);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(shader));

  return shader;
}

//uniform variables inside the shaders
function feedShader(shaderProgram, dataBuffer, name) {
  // Tell WebGL that the data from the array of triangle
  // coordinates that we've already copied to the graphics
  // hardware should be fed to the vertex shader as the
  // parameter "coordinates"
  var positionLocation = gl.getAttribLocation(shaderProgram, name);
  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, dataBuffer);
  var numComponents = 3; // (x, y, z)
  var type = gl.FLOAT;
  var normalize = false; // leave the values as they are
  var offset = 0; // start at the beginning of the buffer
  var stride = 0; // how many bytes to move to the next vertex
  // 0 = use the correct stride for type and numComponents
  gl.vertexAttribPointer(positionLocation, numComponents, type, normalize, stride, offset);

  return positionLocation; //Location of the stuff that is being fed to the shader
}
//Create WebGL
function initWebGL(canvas) {
  gl = null;

  // browser supports WebGL
  if (window.WebGLRenderingContext) {
    try {
      // Try to grab the standard context. If it fails, fallback to experimental.
      gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    }
    catch (e) {
      alert(e);
    }
    if (!gl) {
      alert("Your browser supports WebGL, but something screwed up.");
      gl = null;
    }
    console.log(gl);
  }
  else {
    alert("No WebGL?");
  }

  return gl;
}
//User input
function keyboardHandlerDown(keyboardEvent) {

  var offset = 0.1;

  //Next you will need to get the camera's X and Y rotation values (in degrees!)

  var pitch = rotation[0] % 360;
  var yaw = rotation[1] % 360;

  //Then we convert those values into radians
  var pitchRadian = pitch * (Math.PI / 180); // X rotation
  var yawRadian = yaw * (Math.PI / 180); // Y rotation

  //Now here is where we determine the new position:

  var newPosX = offset * Math.sin(yawRadian) * Math.cos(pitchRadian);
  var newPosY = offset * -Math.sin(pitchRadian);
  var newPosZ = offset * Math.cos(yawRadian) * Math.cos(pitchRadian);

  switch (keyboardEvent.code) {
    case "ArrowUp":
      velocity[0] = newPosX;
      velocity[1] = newPosY;
      velocity[2] = -newPosZ;
      break;
    case "ArrowDown":
      velocity[0] = -newPosX;
      velocity[1] = -newPosY;
      velocity[2] = newPosZ;
      break;
      /*case "ArrowLeft":
        rotation[1]++;
        break;
      case "ArrowRight":
        rotation[1]--;
        break;*/
  }
}

function keyboardHandlerUp(keyboardEvent) {
  switch (keyboardEvent.code) {
    case "ArrowUp":
      velocity[0] = 0.00;
      velocity[1] = 0.00;
      velocity[2] = 0.00;
      break;
    case "ArrowDown":
      velocity[0] = 0.00;
      velocity[1] = 0.00;
      velocity[2] = 0.00;
      break;
      /*case "ArrowLeft":
        velocity[2] = 0.00;
        break;
      case "ArrowRight":
        velocity[2] = 0.00;
        break;*/
  }
}

function scrollHandler(scrollEvent) {
  scale += scrollEvent.deltaY / 100000;
}

function mouseHandler(mouseEvent) {
  /*rotation[1] = mouseEvent.clientX / glcanvas.width * 180 + 180;
  rotation[0] = mouseEvent.clientY / glcanvas.height * 180 - 90;*/
  rotation[1] -= mouseEvent.movementX;
  rotation[0] -= mouseEvent.movementY;
}
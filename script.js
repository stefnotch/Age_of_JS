/*
git commit -am "your message goes here"
git push
*/
/*TODO 
Color tutorial
Translation tutorial
Redraw tutorial
*/
var gl; //WebGL lives in here!

//Called by the body
function start() {
  //init the WebGL
  var glcanvas = document.getElementById("glcanvas");
  glcanvas.width = window.innerWidth;
  glcanvas.height = window.innerHeight;
  window.addEventListener('resize', () => {
    glcanvas.width = window.innerWidth;
    glcanvas.height = window.innerHeight;
    redraw();
  }, false);

  gl = initWebGL(glcanvas);

  if (gl) {

    var buffer = createVBO([
      0.0, 0.5, 0,
      0.5, -0.5, 0, -0.5, -0.5, 0
    ]);
    var vertexShader = createShader(`
    attribute vec4 coordinates;
    uniform vec4 offset; 
    void main(void){
      gl_Position = coordinates + offset;
    }`, gl.VERTEX_SHADER);

    var fragmentShader = createShader(`
    void main() {
      gl_FragColor = vec4(0, 1, 0, 1);  // green
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
    gl.clearColor(1.0, 1.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Tell WebGL which shader program to use
    gl.useProgram(shaderProgram);
    //Feed the shader
    feedShader(shaderProgram, buffer, "coordinates");
    //Change a uniform variable
    var offsetLoc = gl.getUniformLocation(shaderProgram, "offset");
    gl.uniform4fv(offsetLoc, [-0.5, 0, 0, 0]); // offset it to the right half the screen
    redraw();

  }
}

function redraw() {
  //Triangle
  gl.drawArrays(gl.TRIANGLES, 0, 3);

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

//Feed the beast!
function feedShader(shaderProgram, dataBuffer, name) {
  // Tell WebGL that the data from the array of triangle
  // coordinates that we've already copied to the graphics
  // hardware should be fed to the vertex shader as the
  // parameter "coordinates"
  var positionLocation = gl.getAttribLocation(shaderProgram, name);
  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, dataBuffer);
  let numComponents = 3; // (x, y, z)
  let type = gl.FLOAT;
  let normalize = false; // leave the values as they are
  let offset = 0; // start at the beginning of the buffer
  let stride = 0; // how many bytes to move to the next vertex
  // 0 = use the correct stride for type and numComponents
  gl.vertexAttribPointer(positionLocation, numComponents, type, normalize, stride, offset);

  return positionLocation; //Location of the stuff that is being fed to the shader
}

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
  }
  else {
    alert("No WebGL?");
  }

  return gl;
}
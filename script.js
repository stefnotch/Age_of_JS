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
var offsetLoc, pos = [0,0,0,0], velocity=[0,0,0,0];
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
  window.addEventListener("keydown", keyboardHandlerDown);
  window.addEventListener("keyup", keyboardHandlerUp);
  gl = initWebGL(glcanvas);

  if (gl) {

    var buffer = createVBO([
      // left column
      0, 0, 0,
      30, 0, 0,
      0, 150, 0,
      0, 150, 0,
      30, 0, 0,
      30, 150, 0,

      // top rung
      30, 0, 0,
      100, 0, 0,
      30, 30, 0,
      30, 30, 0,
      100, 0, 0,
      100, 30, 0,

      // middle rung
      30, 60, 0,
      67, 60, 0,
      30, 90, 0,
      30, 90, 0,
      67, 60, 0,
      67, 90, 0
    ]);
    var vertexShader = createShader(`
    attribute vec4 coordinates;
    uniform vec4 offset; 
    void main(void){
    vec4 pos = vec4(coordinates.x*0.003,coordinates.y*-0.005,coordinates.z,coordinates.w) + offset;
      gl_Position = pos;
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
    // Tell WebGL which shader program to use
    gl.useProgram(shaderProgram);
    //Feed the shader
    feedShader(shaderProgram, buffer, "coordinates");
    //Change a uniform variable
    offsetLoc = gl.getUniformLocation(shaderProgram, "offset");
    

    window.requestAnimationFrame(redraw);
  }
}

function redraw() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  pos[0] += velocity[0];
  pos[1] += velocity[1];
  pos[2] += velocity[2];
  gl.uniform4fv(offsetLoc, pos);
  //Triangle
  gl.drawArrays(gl.TRIANGLES, 0, 18);
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

function keyboardHandlerDown(keyboardEvent) {
  switch (keyboardEvent.key) {
    case "ArrowUp":
      velocity[1] = 0.01;
      break;
    case "ArrowDown":
      velocity[1] = -0.01;
      break;
    case "ArrowLeft":
      velocity[0] = -0.01;
      break;
    case "ArrowRight":
      velocity[0] = 0.01;
      break;
  }
}

function keyboardHandlerUp(keyboardEvent) {

}
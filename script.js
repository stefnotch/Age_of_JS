/*
git commit -am "your message goes here"
git push

*/

var gl; //WebGL lives in here!

//Called by the body
function start() {
  //init the WebGL
  var glcanvas = document.getElementById("glcanvas");
  gl = initWebGL(glcanvas);

  if (gl) {
    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    // Near things obscure far things
    gl.depthFunc(gl.LEQUAL);
    // Clear the color as well as the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var vertexShader = createShader(`
    attribute vec2 coordinates;
    void main(void){
      gl_Position = vec4(coordinates, 0.0, 1.0);
    }`, gl.VERTEX_SHADER);

    var fragmentShader = createShader(`
    void main() {
      gl_FragColor = vec4(0, 1, 0, 1);  // green
    }`, gl.FRAGMENT_SHADER);

    // Put the vertex shader and fragment shader together into
    // a complete program
    //
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(shaderProgram));


  }
}

function createVBO() {
  // Copy an array of data points forming a triangle to the
  // graphics hardware
  //
  var vertices = [
    0.0, 0.5,
    0.5, -0.5, -0.5, -0.5,
  ];
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
}

function createShader(shaderCode, shaderType) {
  var shader = gl.createShader(shaderType);
  gl.shaderSource(shader, shaderCode);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(shader));

  return shader;
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
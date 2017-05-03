uniform float deltaTime;
uniform vec2 resolution;
uniform int currentDisplayUpdate;

uniform vec2 display1Resolution;
uniform vec2 display2Resolution;
uniform vec3 display1Size;
uniform vec3 display2Size;

uniform int pupilSamples;
uniform float pupilDiameter;
uniform float retinaHeight;
uniform float focalLength;
uniform float accommodationDistance;

uniform vec3 eyePosition;

uniform sampler2D display1;
uniform sampler2D display2;
uniform sampler2D lightField;

#define M_PI 3.1415926535897932384626433832795

void main() {
    vec2 displayResolution = currentDisplayUpdate < 2 ? display1Resolution : display2Resolution;

    gl_FragColor = vec4(gl_FragCoord.xy / displayResolution, 0.0, 1.0);
}
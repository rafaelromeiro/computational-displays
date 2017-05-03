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

// A hash function to approximate a uniform distribution
highp float rand(float seed, float v) {
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt = dot(vec2(seed, v), vec2(a, b));
    highp float sn = mod(dt, M_PI);
    return fract(sin(sn) * c);
}

// Transformation from the unit square to the unit circle through Shirley's method
vec2 toUnitDisk(vec2 unitSquarePoint) {
    float phi, r;
    vec2 p = unitSquarePoint * 2.0 - 1.0;
    if (p.x*p.x > p.y*p.y) {
        r = p.x;
        phi = (p.y / p.x) * (M_PI / 4.0);
    } else {
        if (p.y == 0.0) return vec2(0.0);
        r = p.y;
        phi = (M_PI / 2.0) - (M_PI / 4.0) * (p.x / p.y);
    }
    return vec2(r * cos(phi), r * sin(phi));
}

// Generate a random vec2 inside unit circle from a given vec3
vec2 sampleUnitDisk(vec3 p) {
    float a = rand(rand(rand(17.0, p.x), p.y), p.z);
    float b = rand(rand(rand(23.0, p.x), p.y), p.z);
    return toUnitDisk(vec2(a, b));
}

//Return true if inside [0, 1]², false otherwise
bool insideTextureCoordRange(vec2 p) {
    vec2 s = step(vec2(0.0), p) - step(vec2(1.0), p);
    return bool(s.x * s.y);
}

// Return local coordinates of ray intersection with a display
vec2 intersectLayer(vec3 origin, vec3 direction, vec3 displaySize) {
    vec3 layerPoint = origin + direction * (displaySize.z - origin.z)/direction.z;
    return layerPoint.xy / displaySize.xy + 0.5;
}

void main() {
    vec2 retinaCoord = (gl_FragCoord.xy - resolution * 0.5) * retinaHeight / resolution.y;
    vec3 retinaPoint = eyePosition + vec3(-retinaCoord.x, -retinaCoord.y, focalLength);
    vec3 focusPoint = eyePosition + (eyePosition - retinaPoint) * accommodationDistance / focalLength;

    const float MAX_SAMPLES = 2048.0;
    vec3 retinaColor = vec3(0.0);
    for (float k = 0.0; k < MAX_SAMPLES; k++) {
        if (k >= float(pupilSamples)) break;
        
        vec2 pupilCoord = sampleUnitDisk(vec3(gl_FragCoord.xy, k));
        vec3 pupilPoint = eyePosition + vec3(pupilCoord.x, pupilCoord.y, 0.0) * pupilDiameter;

        vec2 display1Coord = intersectLayer(pupilPoint, focusPoint - pupilPoint, display1Size);
        vec2 display2Coord = intersectLayer(pupilPoint, focusPoint - pupilPoint, display2Size);

        vec3 rayColor = vec3(1.0);

        if (insideTextureCoordRange(display1Coord))
            rayColor *= texture2D(display1, display1Coord).xyz;

        if (insideTextureCoordRange(display2Coord))
            rayColor *= texture2D(display2, display2Coord).xyz;

        retinaColor += rayColor / float(pupilSamples);
    }

    gl_FragColor = vec4(retinaColor, 1.0);
}
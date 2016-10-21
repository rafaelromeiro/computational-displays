uniform float deltaTime;
uniform vec2 resolution;

uniform vec2 displaySize;
uniform float displaySpacer;

uniform float pupilDiameter;
uniform float retinaDiameter;
uniform float focalLength;

uniform float accommodationDistance;
uniform int pupilSamples;
uniform vec3 eyePosition;

uniform sampler2D lenna;
uniform sampler2D baboon;
uniform sampler2D pinholes;
uniform sampler2D views;

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

// Return local coordinates of ray intersection with a layer
vec2 intersectLayer(vec3 origin, vec3 direction, float layerZ) {
    vec3 layerPoint = origin + direction * (layerZ - origin.z)/direction.z;
    return layerPoint.xy / displaySize + 0.5;
}

void main() {
    vec4 backgroundColor = vec4(0.4, 0.6, 0.2, 1.0);

    vec3 forwardVec = normalize(-eyePosition);
    vec3 leftVec = normalize(cross(forwardVec, vec3(0.0, 1.0, 0.0)));
    vec3 upVec = cross(leftVec, forwardVec);

    vec2 retinaCoord = (gl_FragCoord.xy - resolution * 0.5) * retinaDiameter / resolution.y;
    vec3 retinaPoint = eyePosition - leftVec * retinaCoord.x - upVec * retinaCoord.y - forwardVec * focalLength;

    vec3 focusPoint = eyePosition + (eyePosition - retinaPoint) * accommodationDistance / focalLength;

    // Spread points over disk through Vogel's method
    const float goldenAngle =  M_PI * (3.0 - sqrt(5.0));
    const float MAX_SAMPLES = 2048.0;
    vec4 retinaColor = vec4(0.0);
    float validRays = 0.0;
    for (float k = 0.0; k < MAX_SAMPLES; k++) {
        if (k >= float(pupilSamples)) break;
        float theta = k * goldenAngle;
        vec2 pupilCoord = sampleUnitDisk(vec3(gl_FragCoord.xy, k));
        vec3 pupilPoint = eyePosition + (leftVec * pupilCoord.x + upVec * pupilCoord.y) * pupilDiameter;

        vec2 layer0Coord = intersectLayer(pupilPoint, focusPoint - pupilPoint, 0.0);
        vec2 layer1Coord = intersectLayer(pupilPoint, focusPoint - pupilPoint, -displaySpacer);

        if (insideTextureCoordRange(layer0Coord) && insideTextureCoordRange(layer1Coord)) {
            retinaColor += (texture2D(pinholes, layer0Coord) * texture2D(views, layer1Coord));
            if (length(texture2D(pinholes, layer0Coord).xyz) > 0.0) validRays += 1.0;
        }
        else
            retinaColor += backgroundColor / float(pupilSamples);
    }

    gl_FragColor = vec4((retinaColor/validRays).rgb, 1.0);
}
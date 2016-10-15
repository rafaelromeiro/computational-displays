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

uniform sampler2D texture0;
uniform sampler2D texture1;

#define M_PI 3.1415926535897932384626433832795

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
    vec4 backgroundColor = vec4(0.4, 0.4, 0.6, 1.0);

    vec3 forwardVec = normalize(-eyePosition);
    vec3 leftVec = normalize(cross(forwardVec, vec3(0.0, 1.0, 0.0)));
    vec3 upVec = cross(leftVec, forwardVec);

    vec2 retinaCoord = (gl_FragCoord.xy - resolution * 0.5) * retinaDiameter / resolution.y;
    vec3 retinaPoint = eyePosition - leftVec * retinaCoord.x - upVec * retinaCoord.y - forwardVec * focalLength;

    vec3 focusPoint = eyePosition + (eyePosition - retinaPoint) * accommodationDistance / focalLength;

    // Spread points over disk through Vogel's method
    const float goldenAngle =  M_PI * (3.0 - sqrt(5.0));
    const float MAX_SAMPLES = 1024.0;
    vec4 retinaColor = vec4(0.0);
    for (float i = 0.0; i < MAX_SAMPLES; i++) {
        if (i >= float(pupilSamples)) break;
        float theta = i * goldenAngle;
        vec2 pupilCoord = vec2(cos(theta), sin(theta)) * sqrt(i / float(pupilSamples));
        vec3 pupilPoint = eyePosition + (leftVec * pupilCoord.x + upVec * pupilCoord.y) * pupilDiameter;

        vec2 layer0Coord = intersectLayer(pupilPoint, focusPoint - pupilPoint, 0.0);
        vec2 layer1Coord = intersectLayer(pupilPoint, focusPoint - pupilPoint, -displaySpacer);

        if (insideTextureCoordRange(layer0Coord) && insideTextureCoordRange(layer1Coord))
            retinaColor += (texture2D(texture0, layer0Coord) * texture2D(texture1, layer1Coord)) / float(pupilSamples);
        else
            retinaColor += backgroundColor / float(pupilSamples);
    }

    gl_FragColor = retinaColor;
}
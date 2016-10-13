uniform float deltaTime;
uniform vec2 resolution;

uniform vec2 displaySize;

uniform float pupilDiameter;
uniform float retinaDiameter;
uniform float focalLength;

uniform float accommodationDistance;
uniform int pupilSamples;
uniform vec3 eyePosition;

uniform sampler2D texture1;

bool insideTextureCoordRange(vec2 p) {
    vec2 s = step(vec2(0.0), p) - step(vec2(1.0), p);
    return bool(s.x * s.y);
}

void main() {
    vec4 backgroundColor = vec4(0.4, 0.4, 0.6, 1.0);

    vec3 forwardVec = normalize(-eyePosition);
    vec3 leftVec = cross(forwardVec, vec3(0.0, 1.0, 0.0));
    vec3 upVec = cross(leftVec, forwardVec);

    vec2 retinaCoord = (gl_FragCoord.xy - resolution * 0.5) * retinaDiameter / resolution.y;
    vec3 retinaPoint = eyePosition - leftVec * retinaCoord.x - upVec * retinaCoord.y - forwardVec * focalLength;

    vec3 focusPoint = eyePosition + (eyePosition - retinaPoint) * accommodationDistance / focalLength;
    vec3 pupilPoint = eyePosition;

    vec3 displayPoint = pupilPoint + (focusPoint - pupilPoint) * pupilPoint.z / (pupilPoint.z - focusPoint.z);
    vec2 displayCoord = displayPoint.xy / displaySize + 0.5;

    vec4 rayColor;
    if (insideTextureCoordRange(displayCoord))
        rayColor = texture2D( texture1, displayCoord );
    else
        rayColor = backgroundColor;

    gl_FragColor = rayColor;
}
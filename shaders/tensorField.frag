//#include "header.frag"

void main() {
    vec2 angularCoord = (floor(gl_FragCoord.xy / spatialResolution) + 0.5) / angularResolution;
    vec2 spatialCoord = fract(gl_FragCoord.xy / spatialResolution);

    vec3 angularPoint = vec3(angularCoord - 0.5, 1.0) * angularSize;
    vec3 spatialPoint = vec3(spatialCoord - 0.5, 1.0) * spatialSize;

    vec3 rayOrigin = angularPoint;
    vec3 rayDirection = normalize(spatialPoint - angularPoint);

    vec2 display1Coord = intersectLayer(rayOrigin, rayDirection, display1Size);
    vec2 display2Coord = intersectLayer(rayOrigin, rayDirection, display2Size);

    vec3 rayColor = vec3(1.0);
    if (insideTextureCoordRange(display1Coord))
        rayColor *= texture2D(display1, display1Coord).rgb;
    if (insideTextureCoordRange(display2Coord))
        rayColor *= texture2D(display2, display2Coord).rgb;

    gl_FragColor = vec4(rayColor, 1.0);
}
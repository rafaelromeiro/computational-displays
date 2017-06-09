//#include "header.frag"

void main() {
    vec2 spatialCoord = (floor(gl_FragCoord.xy / angularResolution) + 0.5) / spatialResolution;
    vec2 angularCoord = fract(gl_FragCoord.xy / angularResolution);

    vec3 spatialPoint = vec3(spatialCoord - 0.5, 1.0) * spatialSize;
    vec3 angularPoint = vec3(angularCoord - 0.5, 1.0) * angularSize;

    vec3 rayOrigin = spatialPoint;
    vec3 rayDirection = normalize(angularPoint - spatialPoint);

    gl_FragColor = vec4(raycastDisplay(rayOrigin, rayDirection), 1.0);
}
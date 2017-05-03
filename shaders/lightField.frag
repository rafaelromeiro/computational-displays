//#include "header.frag"

void main() {
    vec2 angularCoord = (floor(gl_FragCoord.xy / spatialResolution) + 0.5) / angularResolution;
    vec2 spatialCoord = fract(gl_FragCoord.xy / spatialResolution);

    vec3 angularPoint = vec3(angularCoord - 0.5, 1.0) * angularSize;
    vec3 spatialPoint = vec3(spatialCoord - 0.5, 1.0) * spatialSize;

    vec3 rayOrigin = angularPoint;
    vec3 rayDirection = normalize(spatialPoint - angularPoint);

    gl_FragColor = vec4(raycastScene(rayOrigin, rayDirection), 1.0);
}
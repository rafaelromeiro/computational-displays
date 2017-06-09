//#include "header.frag"

void main() {
    vec2 retinaCoord = (gl_FragCoord.xy - resolution * 0.5) * retinaHeight / resolution.y;
    vec3 retinaPoint = eyePosition + vec3(-retinaCoord.x, -retinaCoord.y, focalLength);
    vec3 focusPoint = eyePosition + (eyePosition - retinaPoint) * accommodationDistance / focalLength;

    const float MAX_SAMPLES = 2048.0;
    vec3 retinaColor = vec3(0.0);
    for (float k = 0.0; k < MAX_SAMPLES; k++) {
        if (k >= float(pupilSamples)) break;
        
        vec2 pupilCoord = sampleUnitDisk(rand(rand(gl_FragCoord.x, gl_FragCoord.y), k));
        vec3 pupilPoint = eyePosition + vec3(pupilCoord.x, pupilCoord.y, 0.0) * pupilDiameter * 0.5;

        vec3 rayOrigin = pupilPoint;
        vec3 rayDirection = normalize(focusPoint - pupilPoint);
        vec3 rayColor = vec3(1.0, 0.0, 1.0);

        // Render mode (scene: 1, sampled light field: 2, display: 3)
        if (renderMode == 0) rayColor = raycastScene(rayOrigin, rayDirection);
        if (renderMode == 1) rayColor = raycastSampledLightField(rayOrigin, rayDirection);
        if (renderMode == 2) rayColor = raycastDisplay(rayOrigin, rayDirection);

        retinaColor += rayColor;
    }

    gl_FragColor = vec4(retinaColor / float(pupilSamples), 1.0);
}
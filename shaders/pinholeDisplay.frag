uniform float deltaTime;
uniform vec2 resolution;

uniform vec2 eyeSize;
uniform float eyeDistance;

uniform vec2 displaySize;
uniform float angularResolution;
uniform float displaySpacer;

uniform bool debug;

vec4 intersectSphere(vec3 rayOrigin, vec3 rayDirection, vec4 rayColor, vec3 sphereCenter, float sphereRadius) {
    vec3 p = rayOrigin + dot(sphereCenter - rayOrigin, rayDirection) * rayDirection;
    float h = distance(p, sphereCenter);
    if (h < sphereRadius) {
        float d = sqrt(sphereRadius*sphereRadius - h*h);
        p -= d * rayDirection;
        rayColor = vec4(abs((p - sphereCenter) / sphereRadius), 1.0);
    }
    return rayColor;
}

vec4 intersectScene(vec3 rayOrigin, vec3 rayDirection) {
    vec4 backgroundColor = vec4(0.4, 0.4, 0.6, 1.0);
    vec4 rayColor = backgroundColor;

    rayColor = intersectSphere(rayOrigin, rayDirection, rayColor, vec3(-70.0, -90.0, -400.0), 10.0);
    rayColor = intersectSphere(rayOrigin, rayDirection, rayColor, vec3(-70.0, 40.0, -350.0), 10.0);
    rayColor = intersectSphere(rayOrigin, rayDirection, rayColor, vec3(50.0, -50.0, -300.0), 10.0);
    rayColor = intersectSphere(rayOrigin, rayDirection, rayColor, vec3(50.0, 50.0, -250.0), 10.0);
    rayColor = intersectSphere(rayOrigin, rayDirection, rayColor, vec3(40.0, 0.0, -200.0), 10.0);
    rayColor = intersectSphere(rayOrigin, rayDirection, rayColor, vec3(20.0, 0.0, -150.0), 10.0);
    rayColor = intersectSphere(rayOrigin, rayDirection, rayColor, vec3(0.0, 0.0, -100.0), 10.0);
    rayColor = intersectSphere(rayOrigin, rayDirection, rayColor, vec3(0.0, 8.0, -30.0), 3.0);

    return rayColor;
}

void main() {
    vec2 displayResolution = resolution * vec2(0.5, 1.0);
    vec2 viewSize =  displaySize * angularResolution / displayResolution;

    vec2 pinholeDistanceCandidates = viewSize * (eyeDistance + displaySpacer) / (eyeSize + viewSize);
    float pinholeDistance = min(pinholeDistanceCandidates.x, pinholeDistanceCandidates.y);
    vec2 pinholePitch = viewSize * (eyeDistance + displaySpacer - pinholeDistance) / (eyeDistance + displaySpacer);

    vec2 holeSize = viewSize * (pinholeDistance - displaySpacer) / pinholeDistance;
    vec2 holePitch = viewSize * eyeDistance / (eyeDistance + displaySpacer);

    vec2 displayPixel = gl_FragCoord.xy;
    bool frontLayer = (displayPixel.x < displayResolution.x);
    if (!frontLayer) displayPixel.x -= displayResolution.x;

    vec2 displayPoint = (displayPixel - displayResolution * 0.5) * displaySize / displayResolution;

    if (frontLayer) { // Front layer
        vec2 dist = holePitch * abs(fract(displayPoint / holePitch) - 0.5);

        if (dist.x < holeSize.x * 0.5 && dist.y < holeSize.y * 0.5)
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        else
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    } else { // Back layer
        vec3 rayOrigin = vec3((floor(displayPoint / viewSize) + 0.5) * pinholePitch,  pinholeDistance - displaySpacer);

        if (debug)
            rayOrigin = vec3(0.0, 0.0, eyeDistance);

        vec3 rayDirection = normalize(vec3(displayPoint, -displaySpacer) - rayOrigin);
        gl_FragColor = intersectScene(rayOrigin, rayDirection);
    }
}
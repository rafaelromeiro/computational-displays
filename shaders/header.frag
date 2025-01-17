uniform vec2 resolution;
uniform int imageExport;

uniform vec2 spatialResolution;
uniform vec2 angularResolution;
uniform vec3 spatialSize;
uniform vec3 angularSize;

uniform vec2 frontPanelResolution;
uniform vec2 rearPanelResolution;
uniform vec3 frontPanelSize;
uniform vec3 rearPanelSize;

uniform int pupilSamples;
uniform float pupilDiameter;
uniform float retinaHeight;
uniform float focalLength;
uniform float accommodationDistance;

uniform vec3 eyePosition;

uniform int renderMode;
uniform int scene;
uniform int interpolationMode;

uniform sampler2D sampledLightField;
uniform sampler2D displayLightField;
uniform sampler2D frontPanel;
uniform sampler2D rearPanel;

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

// Generate a random vec2 inside unit circle
vec2 sampleUnitDisk(float v) {
    float a = rand(17.0, v);
    float b = rand(23.0, v);
    return toUnitDisk(vec2(a, b));
}

//Return true if inside [0, 1]², false otherwise
bool insideTextureCoordRange(vec2 p) {
    vec2 s = step(vec2(0.0), p) - step(vec2(1.0), p);
    return bool(s.x * s.y);
}

// Return local coordinates of ray intersection with a layer
vec2 intersectLayer(vec3 origin, vec3 direction, vec3 layerSize) {
    vec3 layerPoint = origin + direction * (layerSize.z - origin.z)/direction.z;
    return layerPoint.xy / layerSize.xy + 0.5;
}

// Intersect a sphere with a ray and update the ray color if necessary
vec3 intersectSphere(vec3 rayOrigin, vec3 rayDirection, vec3 rayColor, vec3 sphereCenter, float sphereRadius) {
    vec3 p = rayOrigin + dot(sphereCenter - rayOrigin, rayDirection) * rayDirection;
    float h = distance(p, sphereCenter);
    if (h < sphereRadius) {
        float d = sqrt(sphereRadius*sphereRadius - h*h);
        p -= d * rayDirection;
        rayColor = abs((p - sphereCenter) / sphereRadius);
    }
    return rayColor;
}

// Raycast scene
vec3 raycastScene(vec3 rayOrigin, vec3 rayDirection) {
    vec3 rayColor;

    // Scene: spheres
    if (scene == 0) {
        rayColor = vec3(0.7, 0.7, 1.0);
        rayColor = intersectSphere(rayOrigin, rayDirection, rayColor, vec3(-600.0, -1000.0, -4000.0), 200.0);
        rayColor = intersectSphere(rayOrigin, rayDirection, rayColor, vec3(-600.0, 500.0, -3000.0), 200.0);
        rayColor = intersectSphere(rayOrigin, rayDirection, rayColor, vec3(400.0, -500.0, -2000.0), 200.0);
        rayColor = intersectSphere(rayOrigin, rayDirection, rayColor, vec3(100.0, 400.0, -1000.0), 100.0);
        rayColor = intersectSphere(rayOrigin, rayDirection, rayColor, vec3(130.0, 0.0, -300.0), 30.0);
        rayColor = intersectSphere(rayOrigin, rayDirection, rayColor, vec3(60.0, 0.0, -200.0), 27.0);
        rayColor = intersectSphere(rayOrigin, rayDirection, rayColor, vec3(0.0, 0.0, -100.0), 25.0);
        rayColor = intersectSphere(rayOrigin, rayDirection, rayColor, vec3(0.0, 8.0, -50.0), 5.0);
    }

    // Scene: test
    if (scene == 1) {
        rayColor = vec3(0.2, 1.0, 0.6);
    }

    return rayColor;
}

// Nearest sampled light field ray
vec3 nearestSampledLightFieldRay(vec2 spatialCoord, vec2 angularCoord) {
    if (!insideTextureCoordRange(spatialCoord)) return vec3(0.0);
    if (!insideTextureCoordRange(angularCoord)) return vec3(0.0);

    vec2 lfCoord = (floor(spatialCoord * spatialResolution) + angularCoord) / spatialResolution;

    return texture2D(sampledLightField, lfCoord).rgb;
}

// Nearest display light field ray
vec3 nearestDisplayLightFieldRay(vec2 spatialCoord, vec2 angularCoord) {
    if (!insideTextureCoordRange(spatialCoord)) return vec3(0.0);
    if (!insideTextureCoordRange(angularCoord)) return vec3(0.0);

    vec2 lfCoord = (floor(spatialCoord * spatialResolution) + angularCoord) / spatialResolution;

    return texture2D(displayLightField, lfCoord).rgb;
}

// Raycast sampled light field
vec3 raycastSampledLightField(vec3 rayOrigin, vec3 rayDirection) {
    vec2 spatialCoord = intersectLayer(rayOrigin, rayDirection, spatialSize);
    vec2 angularCoord = intersectLayer(rayOrigin, rayDirection, angularSize);

    if (interpolationMode == 0) // Nearest
        return nearestSampledLightFieldRay(spatialCoord, angularCoord);

    if (interpolationMode == 1) { // Quadrilinear
        // TODO
        return nearestSampledLightFieldRay(spatialCoord, angularCoord);
    }
}

// Raycast display
vec3 raycastDisplay(vec3 rayOrigin, vec3 rayDirection) {
    vec3 rayColor = vec3(1.0);

    vec2 frontPanelCoord = intersectLayer(rayOrigin, rayDirection, frontPanelSize);
    vec2 rearPanelCoord = intersectLayer(rayOrigin, rayDirection, rearPanelSize);

    if (insideTextureCoordRange(frontPanelCoord))
        rayColor *= texture2D(frontPanel, frontPanelCoord).rgb;
    if (insideTextureCoordRange(rearPanelCoord))
        rayColor *= texture2D(rearPanel, rearPanelCoord).rgb;

    return rayColor;
}

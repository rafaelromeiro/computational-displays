//#include "header.frag"

void main() {
    const float MAX_ANGULAR_RESOLUTION = 16.0;
    const float MAX_SPATIAL_RESOLUTION = 1024.0;
    float beta = 1.0;

    vec3 numerator = vec3(0.0);
    vec3 denominator = vec3(0.00000000001);

    vec3 pixelLL = vec3(floor(gl_FragCoord.xy) / display1Resolution - 0.5, 1.0) * display1Size;
    vec3 pixelUR = vec3(ceil(gl_FragCoord.xy) / display1Resolution - 0.5, 1.0) * display1Size;

    for (float u = 0.0; u < MAX_ANGULAR_RESOLUTION; u++) {
        if (u >= angularResolution.x) break;
        for (float v = 0.0; v < MAX_ANGULAR_RESOLUTION; v++) {
            if (v >= angularResolution.y) break;

            vec2 angularCoord = (vec2(u, v) + 0.5) / angularResolution;
            vec3 angularPoint = vec3(angularCoord - 0.5, 1.0) * angularSize;

            vec3 rayOrigin = angularPoint;
            vec3 rayDirectionLL = normalize(pixelLL - rayOrigin);
            vec3 rayDirectionUR = normalize(pixelUR - rayOrigin);

            vec2 spatialCoordA = intersectLayer(rayOrigin, rayDirectionLL, spatialSize);
            vec2 spatialCoordB = intersectLayer(rayOrigin, rayDirectionUR, spatialSize);

            vec2 spatialCoordLL = clamp(min(spatialCoordA, spatialCoordB), 0.0, 1.0);
            vec2 spatialCoordUR = clamp(max(spatialCoordA, spatialCoordB), 0.0, 1.0);

            vec2 spatialIndexLL = floor(spatialCoordLL * spatialResolution + 0.5) + 0.5;
            vec2 spatialIndexUR = ceil(spatialCoordUR * spatialResolution - 0.5);
            vec2 spatialIndex;

            for (float deltaS = 0.0; deltaS < MAX_SPATIAL_RESOLUTION; deltaS++) {
                spatialIndex.x = spatialIndexLL.x + deltaS;
                if (spatialIndex.x >= spatialIndexUR.x) break;
                for (float deltaT = 0.0; deltaT < MAX_SPATIAL_RESOLUTION; deltaT++) {
                    spatialIndex.y = spatialIndexLL.y + deltaT;
                    if (spatialIndex.y >= spatialIndexUR.y) break;

                    vec2 spatialCoord = spatialIndex / spatialResolution;
                    vec3 spatialPoint = vec3(spatialCoord - 0.5, 1.0) * spatialSize;

                    vec3 rayDirection = normalize(spatialPoint - angularPoint);

                    vec2 display2Coord = intersectLayer(rayOrigin, rayDirection, display2Size);

                    if (insideTextureCoordRange(display2Coord)) {
                        vec3 display2Color = texture2D(display2, display2Coord).rgb;
                        vec3 lfColor = nearestLightFieldRay(angularCoord, spatialCoord);
                        vec3 tfColor = nearestTensorFieldRay(angularCoord, spatialCoord);

                        numerator += tfColor * lfColor;
                        denominator += tfColor * display2Color;
                    }
                }
            }
        }
    }

    gl_FragColor = vec4(beta * numerator / denominator, 1.0);
}
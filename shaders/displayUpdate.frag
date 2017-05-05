//#include "header.frag"

void main() {
    vec3 displayColor;

    if (currentDisplayUpdate == 0) {
        float seed = rand(gl_FragCoord.x, gl_FragCoord.y);
        displayColor = vec3(rand(seed, 8.0), rand(seed, 5.0), rand(seed, 4.0));
    }

    if (currentDisplayUpdate == 1) {
        float lod = log2(display2Resolution.y);
        vec2 display1Coord = gl_FragCoord.xy / display1Resolution;
        vec3 displayPhi = texture2DLodEXT(display2Phi, display1Coord, lod).rgb;
        vec3 displaySqr = texture2DLodEXT(display2Sqr, vec2(0.5), lod).rgb;
        displayColor = displayPhi / max(displaySqr, 0.00000000001);
    }

    if (currentDisplayUpdate == 2) {
        float lod = log2(display1Resolution.y);
        vec2 display2Coord = gl_FragCoord.xy / display2Resolution;
        vec3 displayPhi = texture2DLodEXT(display1Phi, display2Coord, lod).rgb;
        vec3 displaySqr = texture2DLodEXT(display1Sqr, vec2(0.5), lod).rgb;
        displayColor = displayPhi / max(displaySqr, 0.00000000001);
    }

    gl_FragColor = vec4(displayColor, 1.0);
}
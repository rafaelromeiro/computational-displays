//#include "header.frag"

void main() {
    vec2 display1Coord;
    vec2 display2Coord;
    vec3 displayColor;

    if (currentDisplayUpdate == 1) {
        display1Coord = fract(gl_FragCoord.xy / display1Resolution);
        display2Coord = (floor(gl_FragCoord.xy / display1Resolution) + 0.5) / display2Resolution;
        displayColor = texture2D(display1, display1Coord).rgb;
    }
    if (currentDisplayUpdate == 2) {
        display1Coord = (floor(gl_FragCoord.xy / display2Resolution) + 0.5) / display1Resolution;
        display2Coord = fract(gl_FragCoord.xy / display2Resolution);
        displayColor = texture2D(display2, display2Coord).rgb;
    }

    vec3 display1Point = vec3(display1Coord - 0.5, 1.0) * display1Size;
    vec3 display2Point = vec3(display2Coord - 0.5, 1.0) * display2Size;

    vec3 rayOrigin = display1Point;
    vec3 rayDirection = normalize(display2Point - display1Point);

    gl_FragColor = vec4(raycastLightField(rayOrigin, rayDirection) * displayColor, 1.0);
}
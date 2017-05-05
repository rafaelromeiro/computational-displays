//#include "header.frag"

void main() {
    vec3 displayColor;

    if (currentDisplayUpdate == 1) {
        vec2 display1Coord = gl_FragCoord.xy / display1Resolution;
        displayColor = texture2D(display1, display1Coord).rgb;
    }
    if (currentDisplayUpdate == 2) {
        vec2 display2Coord = gl_FragCoord.xy / display2Resolution;
        displayColor = texture2D(display2, display2Coord).rgb;
    }

    gl_FragColor = vec4(displayColor * displayColor, 1.0);
}
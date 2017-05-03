//#include "header.frag"

void main() {
    vec2 displayResolution = currentDisplayUpdate < 2 ? display1Resolution : display2Resolution;

    gl_FragColor = vec4(gl_FragCoord.xy / displayResolution, 0.0, 1.0);
}
//#include "header.frag"

void main() {
    float seed = rand(gl_FragCoord.x, gl_FragCoord.y);
    vec3 displayColor = vec3(rand(seed, 8.0), rand(seed, 5.0), rand(seed, 4.0));
    gl_FragColor = vec4(displayColor, 1.0);
}
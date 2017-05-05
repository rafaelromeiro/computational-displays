//#include "header.frag"

void main() {
    float seed = rand(gl_FragCoord.x, gl_FragCoord.y);
    if (currentDisplayUpdate == 0) gl_FragColor = vec4(rand(seed, 8.0), rand(seed, 5.0), rand(seed, 4.0), 1.0);
    if (currentDisplayUpdate == 1) gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
    if (currentDisplayUpdate == 2) gl_FragColor = vec4(0.0, 1.0, 1.0, 1.0);
}
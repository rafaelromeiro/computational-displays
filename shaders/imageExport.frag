//#include "header.frag"

void main() {
    if (imageExport == 0) gl_FragColor = texture2D(lightField, gl_FragCoord.xy / resolution);
    if (imageExport == 1) gl_FragColor = texture2D(display1, gl_FragCoord.xy / resolution);
    if (imageExport == 2) gl_FragColor = texture2D(display2, gl_FragCoord.xy / resolution);
    if (imageExport == 3) gl_FragColor = texture2D(tensorField, gl_FragCoord.xy / resolution);
}
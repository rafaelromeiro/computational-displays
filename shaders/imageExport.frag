//#include "header.frag"

void main() {
    if (imageExport == 0) gl_FragColor = texture2D(sampledLightField, gl_FragCoord.xy / resolution);
    if (imageExport == 1) gl_FragColor = texture2D(frontPanel, gl_FragCoord.xy / resolution);
    if (imageExport == 2) gl_FragColor = texture2D(rearPanel, gl_FragCoord.xy / resolution);
    if (imageExport == 3) gl_FragColor = texture2D(displayLightField, gl_FragCoord.xy / resolution);
}
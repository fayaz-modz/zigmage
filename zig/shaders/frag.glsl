#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 outColor;

uniform sampler2D u_image;
uniform sampler2D u_curves;

// New Uniforms for Advanced Controls
uniform float u_exposure;    // -5 to 5
uniform float u_contrast;    // -100 to 100
uniform float u_highlights;  // -100 to 100
uniform float u_shadows;     // -100 to 100
uniform float u_blacks;      // -100 to 100
uniform float u_temperature; // -100 to 100
uniform float u_tint;        // -100 to 100
uniform float u_vibrance;    // -100 to 100
uniform float u_saturation;  // -100 to 100

float getLuma(vec3 color) {
    return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
    vec4 texColor = texture(u_image, v_texCoord);
    vec3 color = texColor.rgb;

    // --- 0. Curves (Input Mapping) ---
    // Look up each channel in the curves texture
    // x = channel value (0-1), y = 0.5 (center of 1px high texture)
    color.r = texture(u_curves, vec2(color.r, 0.5)).r;
    color.g = texture(u_curves, vec2(color.g, 0.5)).g;
    color.b = texture(u_curves, vec2(color.b, 0.5)).b;

    // --- 1. Exposure ---
    color *= pow(2.0, u_exposure);

    // --- 2. Color Temperature & Tint ---
    float temp = u_temperature / 100.0;
    float tint = u_tint / 100.0;
    
    vec3 whiteBalance = vec3(1.0);
    whiteBalance.r += temp * 0.4;
    whiteBalance.b -= temp * 0.4;
    whiteBalance.g -= tint * 0.4; 
    whiteBalance.r += tint * 0.1; 
    whiteBalance.b += tint * 0.1; 
    color *= whiteBalance;

    // --- 3. Contrast ---
    float contrastNorm = u_contrast / 100.0; // -1 to 1
    float contrastFactor = 1.0 + contrastNorm; 
    color = (color - 0.5) * contrastFactor + 0.5;

    // --- 4. Highlights, Shadows, Blacks ---
    float luma = getLuma(color);
    
    // Highlights
    float highlights = u_highlights / 100.0;
    float highlightMask = smoothstep(0.5, 1.0, luma);
    color += color * highlights * highlightMask * 0.5;
    
    // Shadows
    float shadows = u_shadows / 100.0;
    float shadowMask = 1.0 - smoothstep(0.0, 0.5, luma);
    color += color * shadows * shadowMask * 0.5;

    // Blacks
    float blacks = u_blacks / 100.0;
    float blackMask = 1.0 - smoothstep(0.0, 0.2, luma);
    color += vec3(blacks * 0.2 * blackMask);

    // --- 5. Saturation & Vibrance ---
    vec3 gray = vec3(getLuma(color));
    
    float sat = u_saturation / 100.0;
    float satFactor = 1.0 + sat; 
    
    float maxChan = max(color.r, max(color.g, color.b));
    float minChan = min(color.r, min(color.g, color.b));
    float curSat = maxChan - minChan;
    
    float vib = u_vibrance / 100.0;
    float vibFactor = 1.0 + (vib * (1.0 - curSat));
    
    color = mix(gray, color, satFactor * vibFactor);

    outColor = vec4(color, texColor.a);
}

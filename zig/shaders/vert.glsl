#version 300 es
layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texCoord;

out vec2 v_texCoord;

uniform vec2 u_scale;
uniform vec2 u_pan;

void main() {
    // Apply transform (pan, scale)
    vec2 pos = a_position * u_scale + u_pan;
    gl_Position = vec4(pos, 0.0, 1.0);
    v_texCoord = a_texCoord;
}

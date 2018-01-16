/**
 * Created by ss on 2018/1/7.
 */

import {MapIndexBase64} from "../data/MapIndex.js";
import {MapOutlineBase64} from "../data/MapOutline.js";
import {Utils} from "../utils/Utils";

function EarthSurfaceShader(controller) {

    var selectedColorDifferent = false;
    var helperColor = new THREE.Color();
    var surfaceColor = new THREE.Vector3();
    var selectedColor = new THREE.Vector3();

    var lookupCanvas, lookupTexture;
    var uniforms = createUniforms();

    function createUniforms() {

        loadSurfaceColor();

        var uniforms = {};

        var mapIndexedTexture = (new THREE.TextureLoader()).load(MapIndexBase64);

        uniforms.mapIndex = {type: 't', value: mapIndexedTexture};
        uniforms.mapIndex.value.magFilter = THREE.NearestFilter;
        uniforms.mapIndex.value.minFilter = THREE.NearestFilter;

        lookupCanvas = document.createElement('canvas');
        lookupCanvas.width = 256;
        lookupCanvas.height = 1;

        lookupTexture = new THREE.Texture(lookupCanvas);
        lookupTexture.magFilter = THREE.NearestFilter;
        lookupTexture.minFilter = THREE.NearestFilter;
        lookupTexture.needsUpdate = true;

        uniforms.lookup = {type: 't', value: lookupTexture};

        var mapOutlineTexture = (new THREE.TextureLoader()).load(MapOutlineBase64);

        uniforms.outline = {type: 't', value: mapOutlineTexture};
        uniforms.outlineLevel = {type: 'f', value: 1};

        uniforms.surfaceColor = { type: 'v3', value: surfaceColor };
        uniforms.flag = { type: 'f', value: 1 };

        uniforms.selectedColor = { type: 'v3', value: selectedColor };

        return uniforms;
    }

    function loadSurfaceColor() {

        if (controller.configure.clickedDifferent) {
            selectedColorDifferent = true;
            setHighlightColor(controller.configure.clickedColor);
        } else {
            selectedColorDifferent = false;
        }

        setShaderColor(controller.configure.surfaceColor);
    }

    function setShaderColor(color) {

        if (color == null) {
            return;
        }

        color = Utils.formatColor(color);

        helperColor.setHex(color);

        surfaceColor.x = helperColor.r;
        surfaceColor.y = helperColor.g;
        surfaceColor.z = helperColor.b;

        if (!selectedColorDifferent) {
            selectedColor.x = helperColor.r;
            selectedColor.y = helperColor.g;
            selectedColor.z = helperColor.b;
        }
    }

    function setHighlightColor(color) {

        if (color == null) {
            return;
        }

        color = Utils.formatColor(color);

        selectedColorDifferent = true;

        helperColor.setHex(color);

        selectedColor.x = helperColor.r;
        selectedColor.y = helperColor.g;
        selectedColor.z = helperColor.b;
    }

    function update() {
        loadSurfaceColor();
    }

    return {

        uniforms: uniforms,

        vertexShader: [

            "varying vec3 vNormal;",
            "varying vec2 vUv;",

            "void main() {",
                "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0);",
                "vNormal = normalize( normalMatrix * normal );",
                "vUv = uv;",
            "}"

        ].join( "\n" ),

        fragmentShader: [

            "uniform sampler2D mapIndex;",
            "uniform sampler2D lookup;",
            "uniform sampler2D outline;",
            "uniform float outlineLevel;",
            "varying vec3 vNormal;",
            "varying vec2 vUv;",

            "uniform vec3 surfaceColor;",
            "uniform float flag;",
            "uniform vec3 selectedColor;",

            "void main() {",
                "vec4 mapColor = texture2D( mapIndex, vUv );",
                "float indexedColor = mapColor.x;",
                "vec2 lookupUV = vec2( indexedColor, 0. );",
                "vec4 lookupColor = texture2D( lookup, lookupUV );",
                "float mask = lookupColor.x + (1.-outlineLevel) * indexedColor;",
                "mask = clamp(mask,0.,1.);",
                "float outlineColor = texture2D( outline, vUv ).x * outlineLevel;",
                "float diffuse = mask + outlineColor;",

                "vec3 earthColor = vec3(0.0, 0.0, 0.0);",
                "earthColor.x = flag * surfaceColor.x * diffuse + (1.0 - flag) * diffuse;",
                "earthColor.y = flag * surfaceColor.y * diffuse + (1.0 - flag) * diffuse;",
                "earthColor.z = flag * surfaceColor.z * diffuse + (1.0 - flag) * diffuse;",

                "if (lookupColor.x > 0.9) {",
                    "earthColor = selectedColor * diffuse;",
                "}",

                "gl_FragColor = vec4( earthColor, 1.  );",

            "}"

        ].join( "\n" ),

        lookupCanvas: lookupCanvas,

        lookupTexture: lookupTexture,

        setShaderColor: setShaderColor,

        setHighlightColor: setHighlightColor,

        update: update
    }
}

export {EarthSurfaceShader}
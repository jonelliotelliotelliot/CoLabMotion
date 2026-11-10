/**
 * colab-motion.jsx
 *
 * ExtendScript backend for the CoLab Motion CEP panel (forked from
 * Wave Motion v1.7.2). Every function called from index.html returns a JSON
 * string of the form {success, message, data?} instead of raising alerts,
 * so the panel can show a consistent status line.
 *
 * COMPATIBILITY: After Effects' ExtendScript engine is ES3. Do NOT use
 * Array.isArray, Array.prototype.map/forEach/filter/indexOf, String.trim,
 * Object.keys, Function.bind, etc. They are missing on some installs and
 * fail with "Function X is undefined". Use instanceof Array and plain loops.
 * (String.prototype.indexOf is ES3 and safe.)
 *
 * @author jon elliot
 * @version 1.3.1
 * @date 2026-11-09
 */


// -----------------------------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------------------------

var CONFIG = {
    name: "CoLab Motion",
    version: "1.3.1",
    assetFile: "colab-elements.aep",
    assetsFolderName: "CoLab Motion Assets",
    animatorPrefix: "CoLab"
};

var MSG = {
    noComp: "Open or select a composition first.",
    noLayer: "Select at least one layer.",
    oneTextLayer: "Select exactly one text layer."
};

var EASE_CONFIGS = {
    backIn:        { label: "Back In",     offset: 0.5, strength: 0.1, specs: [{inVal: 88, outVal: 88}, {inVal: 35, outVal: 60}, {inVal: 90, outVal: 90}] },
    backOut:       { label: "Back Out",    offset: 0.5, strength: 0.1, specs: [{inVal: 88, outVal: 88}, {inVal: 35, outVal: 20}, {inVal: 75, outVal: 75}] },
    backInOut:     { label: "Back In/Out", offset: 0.3, strength: 0.1, specs: [{inVal: 75, outVal: 75}, {inVal: 35, outVal: 75}, {inVal: 75, outVal: 35}, {inVal: 75, outVal: 75}] },
    easeInOutPwr1: { label: "InOut Pwr1", specs: [{inVal: 33, outVal: 33}] },
    easeInOutPwr2: { label: "InOut Pwr2", specs: [{inVal: 66, outVal: 66}] },
    easeInOutPwr3: { label: "InOut Pwr3", specs: [{inVal: 88, outVal: 88}] }
};

var ANCHOR_POSITIONS = {
    topLeft:      { x: 0,   y: 0   },
    topCenter:    { x: 0.5, y: 0   },
    topRight:     { x: 1,   y: 0   },
    middleLeft:   { x: 0,   y: 0.5 },
    center:       { x: 0.5, y: 0.5 },
    middleRight:  { x: 1,   y: 0.5 },
    bottomLeft:   { x: 0,   y: 1   },
    bottomCenter: { x: 0.5, y: 1   },
    bottomRight:  { x: 1,   y: 1   }
};

// Cursor icons, 1 unit tall with the tip at (0,0); scaled to the comp on creation.
// Adapted from Noun Project icons (CC BY 3.0): hand "point" by GreenHill
// (noun_point_938435), arrow "Cursor" by Icon Queen (noun_Cursor_8103550).
var CURSOR_SHAPES = {
    // Outer silhouette + inner edge; together (even-odd) they form the outline ring.
    hand: [
        { v: [[0.0494,0.0127],[0.084,0.1473],[-0.1209,0.5022],[-0.1217,0.5036],[-0.1426,0.5399],[-0.1438,0.5419],[-0.199,0.6376],[-0.118,0.5905],[-0.0115,0.5879],[0.0209,0.6187],[0.0301,0.6898],[-0.0274,0.7542],[-0.4659,0.9954],[-0.4682,0.9969],[-0.4687,0.997],[-0.4702,0.998],[-0.4708,0.9982],[-0.4721,0.9988],[-0.4729,0.9987],[-0.4742,0.9994],[-0.4751,0.9993],[-0.4768,0.9998],[-0.4776,0.9997],[-0.4787,1],[-0.4796,1],[-0.4814,0.9998],[-0.4823,0.9998],[-0.4835,0.9995],[-0.4844,0.9995],[-0.4857,0.9992],[-0.4863,0.9988],[-0.4879,0.9984],[-0.4886,0.998],[-0.4902,0.9975],[-0.4909,0.9971],[-0.4912,0.9969],[-0.4929,0.9959],[-0.9184,0.7503],[-0.9452,0.6483],[-0.6984,0.2209],[-0.6976,0.2195],[-0.6898,0.206],[-0.6886,0.2039],[-0.6477,0.1332],[-0.5138,0.0958],[-0.4752,0.1374],[-0.3544,0.1179],[-0.3178,0.1566],[-0.316,0.1535],[-0.1821,0.1161],[-0.1451,0.155],[-0.0845,0.05]],
          i: [[-0.0466,-0.0269],[0.027,-0.0468],[0,0],[0.0003,-0.0004],[0,0],[0.0004,-0.0007],[0,0],[0,0],[-0.0293,-0.0167],[-0.0079,-0.0126],[0.0077,-0.025],[0.0305,-0.0168],[0,0],[0.0008,-0.0004],[0,0],[0.0005,-0.0003],[0.0002,-0.0001],[0.0004,-0.0002],[0.0003,0],[0.0004,-0.0002],[0.0003,0],[0.0006,-0.0001],[0.0003,0],[0.0004,-0.0001],[0.0003,0],[0.0006,0.0001],[0.0003,0],[0.0004,0.0001],[0.0003,0],[0.0004,0.0001],[0.0002,0.0001],[0.0005,0.0002],[0.0002,0.0001],[0.0005,0.0002],[0.0002,0.0001],[0.0001,0.0001],[0.0006,0.0004],[0,0],[-0.0206,0.0356],[0,0],[-0.0003,0.0004],[0,0],[-0.0004,0.0007],[0,0],[-0.0463,-0.0267],[-0.0082,-0.0169],[-0.0401,-0.0232],[-0.0081,-0.0157],[0,0],[-0.0466,-0.0269],[-0.0081,-0.0157],[0,0]],
          o: [[0.0466,0.0269],[0,0],[-0.0003,0.0005],[0,0],[-0.0004,0.0007],[0,0],[0,0],[0.0375,-0.0216],[0.0133,0.0076],[0.0127,0.0202],[-0.0077,0.025],[0,0],[-0.0007,0.0005],[0,0],[-0.0005,0.0003],[-0.0002,0.0001],[-0.0004,0.0002],[-0.0003,0],[-0.0004,0.0002],[-0.0003,0],[-0.0005,0.0002],[-0.0003,0],[-0.0004,0.0001],[-0.0003,0],[-0.0006,0],[-0.0003,0],[-0.0004,-0.0001],[-0.0003,0],[-0.0004,-0.0001],[-0.0002,-0.0001],[-0.0005,-0.0001],[-0.0002,-0.0001],[-0.0005,-0.0001],[-0.0002,-0.0001],[-0.0001,-0.0001],[-0.0006,-0.0003],[0,0],[-0.0352,-0.0203],[0,0],[0.0003,-0.0005],[0,0],[0.0004,-0.0007],[0,0],[0.0271,-0.047],[0.0173,0.01],[0.0304,-0.0331],[0.0163,0.0094],[0,0],[0.027,-0.0468],[0.0163,0.0094],[0,0],[0.027,-0.0468]] },
        { v: [[0.0265,0.0524],[-0.0448,0.0729],[-0.1474,0.2507],[-0.2714,0.4655],[-0.3051,0.4728],[-0.307,0.4712],[-0.3085,0.4699],[-0.3102,0.468],[-0.3111,0.4426],[-0.1872,0.2278],[-0.205,0.1558],[-0.2759,0.1766],[-0.3999,0.3913],[-0.4233,0.4032],[-0.428,0.4018],[-0.4298,0.4008],[-0.432,0.4],[-0.4339,0.3984],[-0.4354,0.3971],[-0.4373,0.3955],[-0.4386,0.3938],[-0.44,0.3682],[-0.3598,0.2294],[-0.3773,0.1576],[-0.4486,0.1782],[-0.5287,0.317],[-0.5521,0.3288],[-0.5565,0.3276],[-0.5586,0.3264],[-0.5608,0.3256],[-0.5624,0.3242],[-0.5642,0.3227],[-0.5661,0.3212],[-0.5674,0.3195],[-0.5684,0.294],[-0.5186,0.2077],[-0.5368,0.1355],[-0.608,0.1561],[-0.6493,0.2276],[-0.6501,0.2289],[-0.6579,0.2424],[-0.6591,0.2445],[-0.9054,0.6712],[-0.8955,0.7106],[-0.4797,0.9506],[-0.0498,0.7141],[-0.0136,0.6761],[-0.0181,0.6431],[-0.095,0.6304],[-0.2362,0.7123],[-0.2673,0.664],[-0.1843,0.5204],[-0.1823,0.5169],[-0.1614,0.4807],[-0.1604,0.479],[0.0443,0.1244]],
          i: [[0.0243,0.014],[0.0148,-0.0257],[0,0],[0,0],[0.0104,0.0077],[0.0006,0.0006],[0.0005,0.0005],[0.0005,0.0007],[-0.0047,0.0077],[0,0],[0.0243,0.014],[0.0148,-0.0257],[0,0],[0.0092,0.0013],[0.0015,0.0006],[0.0006,0.0004],[0.0007,0.0003],[0.0006,0.0006],[0.0005,0.0005],[0.0006,0.0006],[0.0004,0.0006],[-0.0047,0.0078],[0,0],[0.0243,0.014],[0.0148,-0.0257],[0,0],[0.0092,0.0013],[0.0014,0.0005],[0.0007,0.0004],[0.0007,0.0003],[0.0005,0.0005],[0.0006,0.0006],[0.0006,0.0006],[0.0004,0.0006],[-0.0047,0.0077],[0,0],[0.0243,0.014],[0.0147,-0.0255],[0,0],[0.0003,-0.0004],[0,0],[0.0004,-0.0007],[0,0],[-0.013,-0.0075],[0,0],[0,0],[-0.0037,0.0119],[0.0062,0.01],[0.0364,-0.021],[0,0],[-0.015,0.0268],[0,0],[-0.0008,0.0011],[0,0],[-0.0004,0.0006],[0,0]],
          o: [[-0.0243,-0.014],[0,0],[0,0],[-0.0063,0.0113],[-0.0006,-0.0005],[-0.0005,-0.0004],[-0.0006,-0.0006],[-0.0053,-0.0073],[0,0],[0.0148,-0.0257],[-0.0243,-0.014],[0,0],[-0.0044,0.0082],[-0.0016,-0.0003],[-0.0006,-0.0003],[-0.0008,-0.0002],[-0.0006,-0.0005],[-0.0005,-0.0004],[-0.0006,-0.0005],[-0.0005,-0.0005],[-0.0054,-0.0073],[0,0],[0.0148,-0.0257],[-0.0243,-0.014],[0,0],[-0.0044,0.0082],[-0.0015,-0.0002],[-0.0007,-0.0004],[-0.0008,-0.0002],[-0.0005,-0.0004],[-0.0006,-0.0005],[-0.0006,-0.0005],[-0.0005,-0.0005],[-0.0053,-0.0073],[0,0],[0.0147,-0.0255],[-0.0238,-0.0137],[0,0],[-0.0003,0.0005],[0,0],[-0.0004,0.0007],[0,0],[-0.0082,0.0142],[0,0],[0,0],[0.0225,-0.0124],[0.0037,-0.0119],[-0.0125,-0.0199],[0,0],[-0.0347,0.0127],[0,0],[0.0006,-0.0012],[0,0],[0.0003,-0.0006],[0,0],[0.0148,-0.0257]] }
    ],
    arrow: [
        { v: [[0.0067,0.0301],[-0.3352,0.9727],[-0.3768,0.9876],[-0.3767,0.9876],[-0.388,0.9754],[-0.388,0.9754],[-0.5804,0.5804],[-0.9754,0.388],[-0.9726,0.3352],[-0.0301,-0.0067],[0.0067,0.0301]],
          i: [[0,0],[0,0],[0.0154,0.0091],[0,0],[0.0026,0.0052],[0,0],[0,0],[0,0],[-0.0237,0.0086],[0,0],[0.0083,-0.0229]],
          o: [[0,0],[-0.0061,0.0169],[0,0],[-0.0048,-0.0028],[0,0],[0,0],[0,0],[-0.0227,-0.0111],[0,0],[0.0229,-0.0083],[0,0]] }
    ]
};

var CURSOR_STYLES = {
    light: { fill: [1, 1, 1], line: [0, 0, 0] },
    dark:  { fill: [0, 0, 0], line: [1, 1, 1] }
};

var CURSOR = {
    heightRatio: 0.05,              // cursor height as a fraction of comp height (54px at 1080p)
    pulseColor: [0, 108 / 255, 224 / 255], // CoLab Blue #006CE0
    pulseRatio: 0.06,               // pulse ring diameter as a fraction of comp height
    pulseStrokeWidth: 7,            // px, at the pulse's full (100%) size
    pulseDelayFrames: 2,            // pulse starts mid-press
    pulseFrames: 12
};

// Import definitions (comp names, fit modes) live in index.html so the
// dropdown can be edited without touching this file.


// -----------------------------------------------------------------------------
// RESULT PROTOCOL & SHARED UTILITIES
// -----------------------------------------------------------------------------

function ok(message, data) {
    return JSON.stringify({ success: true, message: message, data: data });
}

function fail(message) {
    return JSON.stringify({ success: false, message: message });
}

/** Builds a result from a per-item loop: "<verb> 3/4 layer(s). Errors: ..." */
function report(verb, done, total, noun, errors) {
    var message = verb + " " + done + "/" + total + " " + noun + ".";
    if (errors.length) message += " Errors: " + errors.join("; ");
    return JSON.stringify({ success: done > 0, message: message });
}

function getActiveComp() {
    var item = app.project.activeItem;
    return (item instanceof CompItem) ? item : null;
}

/**
 * Runs fn inside a named undo group and always closes it, even on error.
 * The return value of fn is passed through.
 */
function inUndoGroup(name, fn) {
    app.beginUndoGroup(name);
    try {
        return fn();
    } finally {
        app.endUndoGroup();
        refreshUndoState();
    }
}

/**
 * Calls fn(item) for every element, collecting per-item errors instead of
 * aborting the whole batch. Returns the number of items that succeeded.
 */
function eachSafely(items, labelOf, fn, errors) {
    var done = 0;
    for (var i = 0; i < items.length; i++) {
        try {
            fn(items[i]);
            done++;
        } catch (e) {
            errors.push(labelOf(items[i]) + ": " + e.toString());
        }
    }
    return done;
}

function layerName(layer) { return layer.name; }

/**
 * Works around a long-standing After Effects bug where Edit > Undo can become
 * unavailable after a script adds properties or layers. Nudging the current
 * time doesn't touch the undo stack (playhead position isn't undoable) but
 * forces AE to refresh its UI state, including the Undo menu.
 */
function refreshUndoState() {
    try {
        var comp = getActiveComp();
        if (comp) {
            var t = comp.time;
            comp.time = (t === 0) ? comp.frameDuration : 0;
            comp.time = t;
        }
    } catch (e) {
        // Cosmetic UI refresh only; never let it mask the real result.
    }
}

/**
 * Returns the selected layer with the lowest index (frontmost), or null.
 * New layers are placed directly above it.
 */
function getTopmostSelectedLayer(comp) {
    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length === 0) return null;
    var topmost = selectedLayers[0];
    for (var i = 1; i < selectedLayers.length; i++) {
        if (selectedLayers[i].index < topmost.index) topmost = selectedLayers[i];
    }
    return topmost;
}

function copyArray(arr) {
    var out = [];
    for (var i = 0; i < arr.length; i++) out.push(arr[i]);
    return out;
}

/**
 * How many KeyframeEase objects setTemporalEaseAtKey expects for a property:
 * spatial properties (Position) take one, others take one per dimension.
 */
function easeDimensions(prop, keyIndex) {
    var t = prop.propertyValueType;
    if (t === PropertyValueType.TwoD_SPATIAL || t === PropertyValueType.ThreeD_SPATIAL) return 1;
    var v = prop.keyValue(keyIndex);
    return (v instanceof Array) ? v.length : 1;
}

function setUniformEase(prop, keyIndex, speed, inInfluence, outInfluence) {
    var dims = easeDimensions(prop, keyIndex);
    var easeIn = [], easeOut = [];
    for (var d = 0; d < dims; d++) {
        easeIn.push(new KeyframeEase(speed, inInfluence));
        easeOut.push(new KeyframeEase(speed, outInfluence));
    }
    prop.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
    prop.setTemporalEaseAtKey(keyIndex, easeIn, easeOut);
}

/** Shifts a property's static value, or every keyframe, by a per-axis delta. */
function offsetPositionBy(positionProp, dx, dy) {
    function shifted(v) {
        var out = copyArray(v);
        out[0] += dx;
        out[1] += dy;
        return out;
    }
    if (positionProp.numKeys > 0) {
        for (var k = 1; k <= positionProp.numKeys; k++) {
            positionProp.setValueAtKey(k, shifted(positionProp.keyValue(k)));
        }
    } else {
        positionProp.setValue(shifted(positionProp.value));
    }
}


// -----------------------------------------------------------------------------
// EASING HELPERS
// -----------------------------------------------------------------------------

// Matches "Position"/"Scale"/"Rotation" by matchName (locale-independent),
// including separated dimensions and 3D rotation/orientation.
function isTransformPropertyOfKind(prop, kinds) {
    var matchName = prop.matchName;
    for (var i = 0; i < kinds.length; i++) {
        var kind = kinds[i];
        if (kind === "Position" && matchName.indexOf("ADBE Position") === 0) return true;
        if (kind === "Scale" && matchName.indexOf("ADBE Scale") === 0) return true;
        if (kind === "Rotation" && (matchName.indexOf("ADBE Rotate") === 0 || matchName === "ADBE Orientation")) return true;
    }
    return false;
}

function findKeyframeSelections(comp, kinds, requiredKeyCount) {
    var selections = [];
    var selectedLayers = comp.selectedLayers;
    for (var i = 0; i < selectedLayers.length; i++) {
        var selectedProps = selectedLayers[i].selectedProperties;
        for (var j = 0; j < selectedProps.length; j++) {
            var prop = selectedProps[j];
            if (prop.propertyType !== PropertyType.PROPERTY || !isTransformPropertyOfKind(prop, kinds)) continue;
            var keys = [];
            for (var k = 1; k <= prop.numKeys; k++) {
                if (prop.keySelected(k)) keys.push(k);
            }
            if (keys.length > 0 && (!requiredKeyCount || keys.length === requiredKeyCount)) {
                selections.push({ property: prop, keys: keys });
            }
        }
    }
    return selections;
}

function calculateOvershoot(currentValue, boundaryValue, strength) {
    if (currentValue instanceof Array) {
        var out = [];
        for (var i = 0; i < currentValue.length; i++) {
            out.push(currentValue[i] + (currentValue[i] - boundaryValue[i]) * strength);
        }
        return out;
    }
    return currentValue + (currentValue - boundaryValue) * strength;
}

/** Applies the preset's ease specs to the keyframes at the given times. */
function applyTemporalEase(prop, times, easeKey) {
    var specs = EASE_CONFIGS[easeKey].specs;
    for (var i = 0; i < times.length; i++) {
        // If the preset has fewer specs than keys (generic eases), reuse the first.
        var spec = (specs.length === times.length) ? specs[i] : specs[0];
        setUniformEase(prop, prop.nearestKeyIndex(times[i]), 0, Math.max(spec.inVal, 1), Math.max(spec.outVal, 1));
    }
}

/** Replaces two keyframes with 3-4 keyframes that overshoot, then eases them. */
function bakeOvershoot(prop, key1, key2, easeKey) {
    var cfg = EASE_CONFIGS[easeKey];
    var t1 = prop.keyTime(key1), t2 = prop.keyTime(key2);
    var v1 = prop.keyValue(key1), v2 = prop.keyValue(key2);
    var span = t2 - t1;
    var times, values;
    if (easeKey === "backIn") {
        times = [t1, t1 + span * cfg.offset, t2];
        values = [v1, calculateOvershoot(v1, v2, cfg.strength), v2];
    } else if (easeKey === "backOut") {
        times = [t1, t2 - span * cfg.offset, t2];
        values = [v1, calculateOvershoot(v2, v1, cfg.strength), v2];
    } else {
        times = [t1, t1 + span * cfg.offset, t2 - span * cfg.offset, t2];
        values = [v1, calculateOvershoot(v1, v2, cfg.strength), calculateOvershoot(v2, v1, cfg.strength), v2];
    }
    // Remove the higher index first so the lower index stays valid.
    prop.removeKey(key2);
    prop.removeKey(key1);
    for (var i = 0; i < times.length; i++) {
        prop.setValueAtTime(times[i], values[i]);
    }
    applyTemporalEase(prop, times, easeKey);
}


// -----------------------------------------------------------------------------
// LAYOUT HELPERS (anchor / align)
// -----------------------------------------------------------------------------

function getZRotation(layer) {
    try { return layer.rotation.value; } catch (e) {}
    try { return layer.property("ADBE Transform Group").property("ADBE Rotate Z").value; } catch (e2) {}
    return 0;
}

/**
 * Moves the anchor point to one of 9 positions in the layer's bounding box
 * and compensates Position so the layer doesn't visually move. Accounts for
 * current scale and Z rotation; not for animated scale/rotation or 3D X/Y.
 */
function repositionAnchorForLayer(layer, time, anchorPos) {
    var rect = layer.sourceRectAtTime(time, false);
    var anchorProp = layer.anchorPoint;
    var oldAnchor = anchorProp.value;
    var newAnchor = copyArray(oldAnchor);
    newAnchor[0] = rect.left + rect.width * anchorPos.x;
    newAnchor[1] = rect.top + rect.height * anchorPos.y;

    var scale = layer.scale.value;
    var localDx = (newAnchor[0] - oldAnchor[0]) * scale[0] / 100;
    var localDy = (newAnchor[1] - oldAnchor[1]) * scale[1] / 100;
    var rad = getZRotation(layer) * Math.PI / 180;

    if (anchorProp.numKeys > 0) {
        throw new Error("Anchor Point is keyframed; remove its keyframes first.");
    }
    anchorProp.setValue(newAnchor);
    offsetPositionBy(layer.position,
        localDx * Math.cos(rad) - localDy * Math.sin(rad),
        localDx * Math.sin(rad) + localDy * Math.cos(rad));
}

/** Axis-aligned bounds in comp space (rotation ignored, like the anchor tool). */
function computeLayerBoundsInComp(layer, time) {
    var rect = layer.sourceRectAtTime(time, false);
    var anchor = layer.anchorPoint.value;
    var position = layer.position.value;
    var scale = layer.scale.value;
    var sx = scale[0] / 100, sy = scale[1] / 100;
    var xs = [rect.left, rect.left + rect.width], ys = [rect.top, rect.top + rect.height];
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (var i = 0; i < 2; i++) {
        for (var j = 0; j < 2; j++) {
            var cx = position[0] + (xs[i] - anchor[0]) * sx;
            var cy = position[1] + (ys[j] - anchor[1]) * sy;
            if (cx < minX) minX = cx;
            if (cx > maxX) maxX = cx;
            if (cy < minY) minY = cy;
            if (cy > maxY) maxY = cy;
        }
    }
    return { left: minX, right: maxX, top: minY, bottom: maxY };
}

function alignLayerToComp(layer, comp, alignType) {
    var b = computeLayerBoundsInComp(layer, comp.time);
    var dx = 0, dy = 0;
    if (alignType === "left") dx = -b.left;
    else if (alignType === "centerH") dx = comp.width / 2 - (b.left + b.right) / 2;
    else if (alignType === "right") dx = comp.width - b.right;
    else if (alignType === "top") dy = -b.top;
    else if (alignType === "centerV") dy = comp.height / 2 - (b.top + b.bottom) / 2;
    else if (alignType === "bottom") dy = comp.height - b.bottom;
    else throw new Error("Unknown align type: " + alignType);
    offsetPositionBy(layer.position, dx, dy);
}


// -----------------------------------------------------------------------------
// CURSOR & CLICK HELPERS
// -----------------------------------------------------------------------------

/** Quick scale dip (90%) toward the anchor point over 8 frames from time t. */
function addPressAnimation(layer, t, frameDuration) {
    var scaleProp = layer.scale;
    var original = scaleProp.valueAtTime(t, false);
    var pressed = copyArray(original);
    pressed[0] *= 0.9;
    pressed[1] *= 0.9;
    var times = [t, t + frameDuration * 4, t + frameDuration * 8];
    scaleProp.setValuesAtTimes(times, [original, pressed, original]);
    for (var k = 0; k < times.length; k++) {
        setUniformEase(scaleProp, scaleProp.nearestKeyIndex(times[k]), 0, 66, 66);
    }
}

function addVectorGroup(contents, name) {
    var group = contents.addProperty("ADBE Vector Group");
    group.name = name;
    return group;
}

function scalePoints(points, s) {
    var out = [];
    for (var i = 0; i < points.length; i++) out.push([points[i][0] * s, points[i][1] * s]);
    return out;
}

/** Adds a closed bezier path (from CURSOR_SHAPES data) scaled by `size`. */
function addPath(group, data, size) {
    var shape = new Shape();
    shape.vertices = scalePoints(data.v, size);
    shape.inTangents = scalePoints(data.i, size);
    shape.outTangents = scalePoints(data.o, size);
    shape.closed = true;
    group.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Group")
        .property("ADBE Vector Shape").setValue(shape);
}

function addFill(group, color) {
    var fill = group.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
    fill.property("ADBE Vector Fill Color").setValue(color);
    return fill;
}

/** Expanding, fading CoLab Blue ring that lasts CURSOR.pulseFrames from `time`. */
function createClickPulse(comp, position, time) {
    var d = comp.height * CURSOR.pulseRatio;
    var duration = CURSOR.pulseFrames * comp.frameDuration;

    var layer = comp.layers.addShape();
    layer.name = "Click Pulse";
    var group = addVectorGroup(layer.property("ADBE Root Vectors Group"), "Pulse");
    group.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Ellipse")
        .property("ADBE Vector Ellipse Size").setValue([d, d]);
    var stroke = group.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
    stroke.property("ADBE Vector Stroke Color").setValue(CURSOR.pulseColor);
    stroke.property("ADBE Vector Stroke Width").setValue(CURSOR.pulseStrokeWidth);

    layer.anchorPoint.setValue([0, 0]);
    layer.position.setValue(position);

    // Scale: quick burst out, long soft settle.
    layer.scale.setValuesAtTimes([time, time + duration], [[20, 20], [100, 100]]);
    setUniformEase(layer.scale, 1, 0, 33, 20);
    setUniformEase(layer.scale, 2, 0, 80, 33);

    // Opacity: hold at 100% for the first half, then an even fade out.
    var mid = time + duration / 2;
    layer.opacity.setValuesAtTimes([time, mid, time + duration], [100, 100, 0]);
    setUniformEase(layer.opacity, 1, 0, 33, 33);
    setUniformEase(layer.opacity, 2, 0, 33, 50);
    setUniformEase(layer.opacity, 3, 0, 50, 33);

    layer.inPoint = time;
    layer.outPoint = time + duration;
    return layer;
}

/**
 * Where a layer's anchor point (the cursor tip) is in comp space at `time`.
 * For an unparented 2D layer that's simply its Position. Otherwise AE's own
 * toComp() is evaluated through a temporary expression on `probe` (a layer we
 * just created), which handles parenting and 3D correctly.
 */
function tipPositionInComp(probe, layer, time) {
    if (!layer.parent && !layer.threeDLayer) {
        var p = layer.position.valueAtTime(time, false);
        return [p[0], p[1]];
    }
    var pos = probe.position;
    pos.expression = "var L = thisComp.layer(" + layer.index + ");" +
        " var p = L.toComp(L.anchorPoint.valueAtTime(" + time + "), " + time + "); [p[0], p[1]];";
    var v = pos.valueAtTime(time, false);
    pos.expression = "";
    return [v[0], v[1]];
}


// -----------------------------------------------------------------------------
// IMPORT HELPERS
// -----------------------------------------------------------------------------

function findCompByName(folder, name) {
    for (var i = 1; i <= folder.numItems; i++) {
        var item = folder.item(i);
        if (item instanceof CompItem && item.name === name) return item;
        if (item instanceof FolderItem) {
            var found = findCompByName(item, name);
            if (found) return found;
        }
    }
    return null;
}

/** Recursively collects every footage/comp item used by a comp's layers. */
function getAllDependencies(sourceComp, collected) {
    for (var i = 1; i <= sourceComp.numLayers; i++) {
        var source = sourceComp.layer(i).source;
        if (!source || !source.id) continue;
        var seen = false;
        for (var j = 0; j < collected.length; j++) {
            if (collected[j].id === source.id) { seen = true; break; }
        }
        if (seen) continue;
        collected.push(source);
        if (source instanceof CompItem) getAllDependencies(source, collected);
    }
}

function getOrCreateAssetsFolder() {
    var root = app.project.rootFolder;
    for (var i = 1; i <= root.numItems; i++) {
        var item = root.item(i);
        if (item instanceof FolderItem && item.name === CONFIG.assetsFolderName) return item;
    }
    return app.project.items.addFolder(CONFIG.assetsFolderName);
}


// -----------------------------------------------------------------------------
// DE-COMP HELPERS
// -----------------------------------------------------------------------------

/**
 * Copies a property's value, keyframes, interpolation, easing, spatial
 * tangents and expression onto another property of the same type.
 */
function copyPropertyAnimation(src, dst) {
    if (src.numKeys === 0) {
        dst.setValue(src.value);
    } else {
        for (var k = 1; k <= src.numKeys; k++) {
            dst.setValueAtTime(src.keyTime(k), src.keyValue(k));
        }
        for (var k2 = 1; k2 <= src.numKeys; k2++) {
            var di = dst.nearestKeyIndex(src.keyTime(k2));
            var inType = src.keyInInterpolationType(k2), outType = src.keyOutInterpolationType(k2);
            dst.setInterpolationTypeAtKey(di, inType, outType);
            if (inType === KeyframeInterpolationType.BEZIER || outType === KeyframeInterpolationType.BEZIER) {
                dst.setTemporalEaseAtKey(di, src.keyInTemporalEase(k2), src.keyOutTemporalEase(k2));
            }
            if (src.isSpatial) {
                try { dst.setSpatialTangentsAtKey(di, src.keyInSpatialTangent(k2), src.keyOutSpatialTangent(k2)); } catch (e) {}
            }
        }
    }
    if (src.canSetExpression && src.expression) {
        dst.expression = src.expression;
        dst.expressionEnabled = src.expressionEnabled;
    }
}

/** Sets a parent without AE adjusting the child's transform values. */
function setParentKeepingValues(child, parent) {
    if (typeof child.setParentWithJump === "function") {
        child.setParentWithJump(parent);
    } else {
        // Older AE: .parent compensates values, so restore them afterwards.
        var tg = child.property("ADBE Transform Group");
        var saved = {}, names = ["ADBE Anchor Point", "ADBE Position", "ADBE Scale", "ADBE Rotate Z"];
        for (var i = 0; i < names.length; i++) {
            var p = tg.property(names[i]);
            if (p && p.numKeys === 0) saved[names[i]] = p.value;
        }
        child.parent = parent;
        for (var n in saved) {
            if (saved.hasOwnProperty(n)) tg.property(n).setValue(saved[n]);
        }
    }
}


// =============================================================================
// PANEL ACTIONS (called from index.html; every one returns a JSON result)
// =============================================================================

/**
 * Single entry point for the panel: calls the named action with the given
 * arguments and turns any uncaught exception into a readable failure that
 * includes the line number, instead of CEP's bare "EvalScript error.".
 */
function runAction(fnName, args) {
    var fn = $.global[fnName];
    if (typeof fn !== "function") return fail("Unknown action: " + fnName);
    try {
        return fn.apply(null, args || []);
    } catch (e) {
        return fail(fnName + " failed: " + e.toString() + (e.line ? " (jsx line " + e.line + ")" : ""));
    }
}

function applyEase(easeKey) {
    var comp = getActiveComp();
    if (!comp) return fail(MSG.noComp);
    var cfg = EASE_CONFIGS[easeKey];
    if (!cfg) return fail("Unknown ease: " + easeKey);

    var isBack = easeKey.indexOf("back") === 0;
    var selections = findKeyframeSelections(comp, ["Position", "Scale", "Rotation"], isBack ? 2 : 0);
    if (selections.length === 0) {
        return fail(isBack
            ? "Select exactly 2 keyframes on Position, Scale or Rotation."
            : "Select keyframes on Position, Scale or Rotation.");
    }

    var errors = [];
    var done = inUndoGroup("Apply " + cfg.label + " Ease", function () {
        return eachSafely(selections, function (s) { return s.property.name; }, function (s) {
            if (isBack) {
                bakeOvershoot(s.property, s.keys[0], s.keys[1], easeKey);
            } else {
                var times = [];
                for (var i = 0; i < s.keys.length; i++) times.push(s.property.keyTime(s.keys[i]));
                applyTemporalEase(s.property, times, easeKey);
            }
        }, errors);
    });
    return report("Applied " + cfg.label + " to", done, selections.length, "property(s)", errors);
}

function applyClickAnimation() {
    var comp = getActiveComp();
    if (!comp) return fail(MSG.noComp);
    var layers = comp.selectedLayers;
    if (layers.length === 0) return fail(MSG.noLayer);

    var errors = [];
    var done = inUndoGroup("Apply Click Animation", function () {
        return eachSafely(layers, layerName, function (layer) {
            addPressAnimation(layer, comp.time, comp.frameDuration);
        }, errors);
    });
    return report("Added click animation to", done, layers.length, "layer(s)", errors);
}

// Expressions on the combined cursor, driven by its two checkboxes.
// effect("X")(1) addresses the checkbox by index, so it works in any AE language.
var CURSOR_EXPR = {
    arrowOpacity: 'effect("Hand")(1).value == 1 ? 0 : 100',
    handOpacity:  'effect("Hand")(1).value == 1 ? 100 : 0',
    fillColor:    'effect("Dark")(1).value == 1 ? [0, 0, 0, 1] : [1, 1, 1, 1]',
    lineColor:    'effect("Dark")(1).value == 1 ? [1, 1, 1, 1] : [0, 0, 0, 1]',
    // On the Pulse group's position: keeps the pulse where the latest click
    // started (an opacity key at 100 right after one at 0), even if the
    // cursor moves away. Delete it to make the pulse follow the cursor.
    plantPulse: [
        '// Keeps the pulse where the click happened. Delete to make it follow the cursor.',
        'var op = content("Pulse").transform.opacity;',
        'var t0 = null;',
        'for (var i = op.numKeys; i >= 1; i--) {',
        '    var k = op.key(i);',
        '    if (k.time <= time && k.value == 100 && (i == 1 || op.key(i - 1).value == 0)) { t0 = k.time; break; }',
        '}',
        'var p = (t0 === null) ? null : fromComp(toComp([0, 0], t0));',
        'p === null ? value : [p[0], p[1]];'
    ].join("\n")
};

function isCursorRig(layer) {
    if (layer.matchName !== "ADBE Vector Layer") return false;
    var contents = layer.property("ADBE Root Vectors Group");
    return !!(contents.property("Pointer") && contents.property("Pulse"));
}

/** Sets a keyframe and gives it a zero-speed bezier ease with the given influences. */
function easeKeyAt(prop, time, value, inInfluence, outInfluence) {
    prop.setValueAtTime(time, value);
    setUniformEase(prop, prop.nearestKeyIndex(time), 0, inInfluence, outInfluence);
}

/** Makes the segment leaving the key at `time` a hold. */
function holdAfter(prop, time) {
    var k = prop.nearestKeyIndex(time);
    prop.setInterpolationTypeAtKey(k, prop.keyInInterpolationType(k), KeyframeInterpolationType.HOLD);
}

/**
 * Keys one click on a cursor rig, all inside the cursor layer so it's
 * retimed by dragging its keys and fully editable in the Graph Editor:
 *   Pointer scale: 100 > 90 > 100 over 8 frames (the press)
 *   Pulse scale: 20 > 100, quick burst then long settle
 *   Pulse opacity: 0 (held) > 100, holds to the midpoint, then fades to 0
 */
function addRigClick(layer, t, f) {
    var contents = layer.property("ADBE Root Vectors Group");

    var press = contents.property("Pointer").property("ADBE Vector Transform Group").property("ADBE Vector Scale");
    easeKeyAt(press, t, [100, 100], 66, 66);
    easeKeyAt(press, t + 4 * f, [90, 90], 66, 66);
    easeKeyAt(press, t + 8 * f, [100, 100], 66, 66);

    var tf = contents.property("Pulse").property("ADBE Vector Transform Group");
    var scale = tf.property("ADBE Vector Scale");
    var opacity = tf.property("ADBE Vector Group Opacity");
    var start = t + CURSOR.pulseDelayFrames * f;
    var duration = CURSOR.pulseFrames * f;
    var end = start + duration;

    easeKeyAt(scale, start, [20, 20], 33, 20);
    easeKeyAt(scale, end, [100, 100], 80, 33);
    holdAfter(scale, end); // no drift toward the next click while invisible

    easeKeyAt(opacity, start - f, 0, 33, 33);
    holdAfter(opacity, start - f); // stays hidden right up to the click
    easeKeyAt(opacity, start, 100, 33, 33);
    easeKeyAt(opacity, start + duration / 2, 100, 33, 50);
    easeKeyAt(opacity, end, 0, 50, 33);
}

function setExpression(prop, staticValue, expression) {
    prop.setValue(staticValue);
    prop.expression = expression;
}

function addCheckbox(layer, name, on) {
    var effect = layer.property("ADBE Effect Parade").addProperty("ADBE Checkbox Control");
    effect.name = name;
    effect.property(1).setValue(on ? 1 : 0);
}

function groupOpacity(group) {
    return group.property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity");
}

/**
 * Creates one "Cursor" layer containing both the arrow and the hand, with
 * both tips on the anchor point. Effect Controls:
 *   Hand: off = arrow, on = hand (keyframe it, or use swapCursor)
 *   Dark: off = white with black outline, on = black with white outline
 */
function createCursor(style) {
    var comp = getActiveComp();
    if (!comp) return fail(MSG.noComp);
    var colors = CURSOR_STYLES[style];
    if (!colors) return fail("Unknown cursor style: " + style);
    var refLayer = getTopmostSelectedLayer(comp);

    inUndoGroup("Create Cursor", function () {
        var layer = comp.layers.addShape();
        layer.name = "Cursor";
        // Effects first, so the expressions below never reference a missing effect.
        addCheckbox(layer, "Hand", false);
        addCheckbox(layer, "Dark", style === "dark");

        var size = comp.height * CURSOR.heightRatio;
        var contents = layer.property("ADBE Root Vectors Group");

        // "Pointer" holds the arrow and hand; clicks key its scale (the press),
        // so the pulse below isn't squashed by it.
        // (Each group is finished before its sibling is added: adding to a
        // property group invalidates references to the existing siblings.)
        var pointer = addVectorGroup(contents, "Pointer");

        // Arrow: fill above stroke, so only the outer half of the stroke shows.
        var arrow = addVectorGroup(pointer.property("ADBE Vectors Group"), "Arrow");
        addPath(arrow, CURSOR_SHAPES.arrow[0], size);
        setExpression(addFill(arrow, colors.fill).property("ADBE Vector Fill Color"), colors.fill, CURSOR_EXPR.fillColor);
        var stroke = arrow.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
        setExpression(stroke.property("ADBE Vector Stroke Color"), colors.line, CURSOR_EXPR.lineColor);
        stroke.property("ADBE Vector Stroke Width").setValue(size * 0.07);
        stroke.property("ADBE Vector Stroke Line Join").setValue(2); // round
        setExpression(groupOpacity(arrow), 100, CURSOR_EXPR.arrowOpacity);

        // Hand: outline ring (outer + inner edge, even-odd) on top of a solid
        // silhouette, so there's no seam between outline and fill.
        var hand = addVectorGroup(pointer.property("ADBE Vectors Group"), "Hand");
        var ring = addVectorGroup(hand.property("ADBE Vectors Group"), "Outline");
        addPath(ring, CURSOR_SHAPES.hand[0], size);
        addPath(ring, CURSOR_SHAPES.hand[1], size);
        var ringFill = addFill(ring, colors.line);
        ringFill.property("ADBE Vector Fill Rule").setValue(2); // even-odd
        setExpression(ringFill.property("ADBE Vector Fill Color"), colors.line, CURSOR_EXPR.lineColor);
        var body = addVectorGroup(hand.property("ADBE Vectors Group"), "Body");
        addPath(body, CURSOR_SHAPES.hand[0], size);
        setExpression(addFill(body, colors.fill).property("ADBE Vector Fill Color"), colors.fill, CURSOR_EXPR.fillColor);
        setExpression(groupOpacity(hand), 0, CURSOR_EXPR.handOpacity);

        // "Pulse": hidden (0% opacity) until a click keys it. Below the pointer.
        var d = comp.height * CURSOR.pulseRatio;
        var pulse = addVectorGroup(contents, "Pulse");
        pulse.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Ellipse")
            .property("ADBE Vector Ellipse Size").setValue([d, d]);
        var ring2 = pulse.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
        ring2.property("ADBE Vector Stroke Color").setValue(CURSOR.pulseColor);
        ring2.property("ADBE Vector Stroke Width").setValue(CURSOR.pulseStrokeWidth);
        var pulseTf = pulse.property("ADBE Vector Transform Group");
        pulseTf.property("ADBE Vector Group Opacity").setValue(0);
        pulseTf.property("ADBE Vector Position").expression = CURSOR_EXPR.plantPulse;

        layer.anchorPoint.setValue([0, 0]);
        layer.position.setValue([comp.width / 2, comp.height / 2]);
        if (refLayer) layer.moveBefore(refLayer);
    });
    return ok("Created " + style + " cursor. Swap or the Hand checkbox switches arrow/hand.");
}

/**
 * Toggles the selected cursors between arrow and hand at the playhead with a
 * hold keyframe. If the checkbox isn't animated yet, the current state is
 * keyed at the layer's in-point first, so frames before the swap don't change.
 */
function swapCursor() {
    var comp = getActiveComp();
    if (!comp) return fail(MSG.noComp);
    var layers = comp.selectedLayers;
    if (layers.length === 0) return fail("Select a cursor layer.");
    var t = comp.time;

    var errors = [];
    var toHand = 0;
    var done = inUndoGroup("Swap Cursor", function () {
        return eachSafely(layers, layerName, function (layer) {
            var effect = layer.property("ADBE Effect Parade").property("Hand");
            if (!effect) throw new Error("not a CoLab cursor (no Hand checkbox)");
            var box = effect.property(1);
            var current = box.valueAtTime(t, false);
            if (box.numKeys === 0 && t > layer.inPoint) {
                box.setValueAtTime(layer.inPoint, current);
            }
            box.setValueAtTime(t, current ? 0 : 1);
            if (!current) toHand++;
        }, errors);
    });
    if (done === 0) return report("Swapped", done, layers.length, "cursor(s)", errors);
    var target = (toHand === done) ? "hand" : (toHand === 0 ? "arrow" : "hand/arrow");
    return report("Swapped to " + target + " on", done, layers.length, "cursor(s)", errors);
}

/**
 * The full click at the playhead. On a CoLab cursor, keys the press and
 * pulse inside the cursor layer (see addRigClick). On any other layer,
 * presses it and adds a separate pulse layer at its anchor point. With
 * nothing selected, adds a standalone pulse at comp centre.
 */
function applyCursorClick() {
    var comp = getActiveComp();
    if (!comp) return fail(MSG.noComp);
    var layers = comp.selectedLayers;
    var t = comp.time, f = comp.frameDuration;
    var pulseTime = t + CURSOR.pulseDelayFrames * f;

    if (layers.length === 0) {
        inUndoGroup("Click Pulse", function () {
            createClickPulse(comp, [comp.width / 2, comp.height / 2], pulseTime);
        });
        return ok("Added a click pulse at comp centre (select a cursor to click it instead).");
    }

    var errors = [];
    var done = inUndoGroup("Cursor Click", function () {
        return eachSafely(layers, layerName, function (layer) {
            if (isCursorRig(layer)) {
                addRigClick(layer, t, f);
                return;
            }
            addPressAnimation(layer, t, f);
            var pulse = createClickPulse(comp, [0, 0], pulseTime);
            pulse.position.setValue(tipPositionInComp(pulse, layer, pulseTime));
            pulse.moveAfter(layer);
        }, errors);
    });
    return report("Clicked", done, layers.length, "layer(s)", errors);
}

function repositionAnchor(anchorKey) {
    var comp = getActiveComp();
    if (!comp) return fail(MSG.noComp);
    var layers = comp.selectedLayers;
    if (layers.length === 0) return fail(MSG.noLayer);
    var anchorPos = ANCHOR_POSITIONS[anchorKey];
    if (!anchorPos) return fail("Unknown anchor position: " + anchorKey);

    var errors = [];
    var done = inUndoGroup("Reposition Anchor Point", function () {
        return eachSafely(layers, layerName, function (layer) {
            repositionAnchorForLayer(layer, comp.time, anchorPos);
        }, errors);
    });
    return report("Moved anchor on", done, layers.length, "layer(s)", errors);
}

function alignLayers(alignType) {
    var comp = getActiveComp();
    if (!comp) return fail(MSG.noComp);
    var layers = comp.selectedLayers;
    if (layers.length === 0) return fail(MSG.noLayer);

    var errors = [];
    var done = inUndoGroup("Align Layers to Composition", function () {
        return eachSafely(layers, layerName, function (layer) {
            alignLayerToComp(layer, comp, alignType);
        }, errors);
    });
    return report("Aligned", done, layers.length, "layer(s)", errors);
}

/** Full-frame black rectangle (brand background), placed above the selection. */
function createFullCompRectangle() {
    var comp = getActiveComp();
    if (!comp) return fail(MSG.noComp);
    var refLayer = getTopmostSelectedLayer(comp);

    inUndoGroup("Create Full-Comp Rectangle", function () {
        var shapeLayer = comp.layers.addShape();
        shapeLayer.name = "BG Rectangle";
        var tg = shapeLayer.property("ADBE Transform Group");
        tg.property("ADBE Anchor Point").setValue([0, 0]);
        tg.property("ADBE Position").setValue([0, 0]);

        var group = shapeLayer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        group.name = "Rectangle";
        var contents = group.property("ADBE Vectors Group");
        var rect = contents.addProperty("ADBE Vector Shape - Rect");
        rect.property("ADBE Vector Rect Size").setValue([comp.width, comp.height]);
        rect.property("ADBE Vector Rect Position").setValue([comp.width / 2, comp.height / 2]);
        contents.addProperty("ADBE Vector Graphic - Fill")
            .property("ADBE Vector Fill Color").setValue([0, 0, 0]);

        if (refLayer) shapeLayer.moveBefore(refLayer);
    });
    return ok("Created " + comp.width + "x" + comp.height + " background rectangle.");
}

/**
 * Imports a comp (and only what it depends on) from the bundled asset .aep,
 * then adds it to the active comp above the current selection.
 * def: { name, collapse?, fit?: "contain" | "cover" }
 */
function importAndPlaceComp(def, extensionPath) {
    var activeComp = getActiveComp();
    if (!activeComp) return fail(MSG.noComp);
    if (typeof def === "string") def = JSON.parse(def);
    var refLayer = getTopmostSelectedLayer(activeComp);
    var imported = false;

    try {
        var targetComp = findCompByName(app.project.rootFolder, def.name);

        if (!targetComp) {
            var aepFile = new File(extensionPath + "/elements/" + CONFIG.assetFile);
            if (!aepFile.exists) return fail("Asset file not found: " + aepFile.fsName);

            // importFile() runs its own undo transaction. Wrapping it in our own
            // undo group caused "Undo group mismatch" warnings, so it runs
            // unwrapped and our groups only open after it has returned.
            var importedFolder = app.project.importFile(new ImportOptions(aepFile));
            targetComp = findCompByName(importedFolder, def.name);
            if (!targetComp) {
                importedFolder.remove(); // don't leave the whole template behind
                return fail("Comp \"" + def.name + "\" isn't in " + CONFIG.assetFile + ". Check the name in index.html.");
            }

            var keep = [targetComp];
            getAllDependencies(targetComp, keep);
            inUndoGroup("Organize Imported Assets", function () {
                var assetsFolder = getOrCreateAssetsFolder();
                for (var i = 0; i < keep.length; i++) {
                    if (keep[i].parentFolder !== assetsFolder) keep[i].parentFolder = assetsFolder;
                }
                importedFolder.remove();
            });
            imported = true;
        }

        inUndoGroup("Import & Place \"" + def.name + "\"", function () {
            var layer = activeComp.layers.add(targetComp);
            layer.startTime = activeComp.time;
            layer.anchorPoint.setValue([targetComp.width / 2, targetComp.height / 2]);
            layer.position.setValue([activeComp.width / 2, activeComp.height / 2]);

            if (def.fit) {
                var rx = activeComp.width / targetComp.width, ry = activeComp.height / targetComp.height;
                var s = (def.fit === "cover" ? Math.max(rx, ry) : Math.min(rx, ry)) * 100;
                if (Math.abs(s - 100) > 0.01) layer.scale.setValue([s, s]);
            }
            if (def.collapse !== undefined) layer.collapseTransformation = def.collapse;
            if (refLayer) layer.moveBefore(refLayer);
        });
    } catch (e) {
        return fail("Import failed: " + e.toString());
    }
    return ok((imported ? "Imported and added" : "Added") + " \"" + def.name + "\".");
}

// Reference: https://ae-scripting.docsforadobe.dev/matchnames/layer/textlayer/#animators
function applyTextAnimation(rangeType, animatorName) {
    var comp = getActiveComp();
    if (!comp) return fail(MSG.noComp);
    var layers = comp.selectedLayers;
    if (layers.length !== 1 || !(layers[0] instanceof TextLayer)) return fail(MSG.oneTextLayer);

    inUndoGroup("Apply Text Animation", function () {
        var animator = layers[0].property("ADBE Text Properties")
            .property("ADBE Text Animators").addProperty("ADBE Text Animator");
        animator.name = animatorName;

        var props = animator.property("ADBE Text Animator Properties");
        props.addProperty("ADBE Text Position 3D").setValue([0, 15, 0]);
        props.addProperty("ADBE Text Opacity").setValue(0);

        var selector = animator.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
        var adv = selector.property("ADBE Text Range Advanced");
        adv.property("ADBE Text Range Type2").setValue(rangeType);
        adv.property("ADBE Text Range Shape").setValue(3);
        adv.property("ADBE Text Levels Max Ease").setValue(78);
        adv.property("ADBE Text Levels Min Ease").setValue(0);
        adv.property("ADBE Text Selector Mode").setValue(2);

        var offset = selector.property("ADBE Text Percent Offset");
        var t0 = comp.time, f = comp.frameDuration;
        var ramp = 25 * f, hold = 75 * f;
        offset.setValueAtTime(t0, -100);
        offset.setValueAtTime(t0 + ramp, 100);
        offset.setValueAtTime(t0 + ramp + hold, 100);
        offset.setValueAtTime(t0 + ramp + hold + ramp, -100);
    });
    return ok("Applied " + animatorName + ".");
}

function applyCharAnimation() {
    return applyTextAnimation(2, CONFIG.animatorPrefix + "-Char-Animator"); // Range Type2: characters
}

function applyWordAnimation() {
    return applyTextAnimation(3, CONFIG.animatorPrefix + "-Word-Animator"); // Range Type2: words
}

/** Characters appear one at a time (Hold keyframes, no fade, no cursor). */
function applyTypewriterEffect() {
    var comp = getActiveComp();
    if (!comp) return fail(MSG.noComp);
    var layers = comp.selectedLayers;
    if (layers.length !== 1 || !(layers[0] instanceof TextLayer)) return fail(MSG.oneTextLayer);

    var textLayer = layers[0];
    var numChars = textLayer.property("ADBE Text Properties").property("ADBE Text Document").value.text.length;
    if (numChars === 0) return fail("The selected text layer is empty.");

    inUndoGroup("Apply Typewriter Effect", function () {
        var animator = textLayer.property("ADBE Text Properties")
            .property("ADBE Text Animators").addProperty("ADBE Text Animator");
        animator.name = CONFIG.animatorPrefix + "-Typewriter";

        // Text animator Opacity is an absolute 0-100 value for the selected
        // (not-yet-typed) range, not a +/-100 offset like Position/Scale.
        animator.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity").setValue(0);

        var selector = animator.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
        var startProp = selector.property("ADBE Text Percent Start");
        selector.property("ADBE Text Percent End").setValue(100);

        var framesPerChar = 2;
        var step = comp.frameDuration * framesPerChar;
        for (var i = 0; i <= numChars; i++) {
            startProp.setValueAtTime(comp.time + i * step, (i / numChars) * 100);
        }
        for (var k = 1; k <= startProp.numKeys; k++) {
            startProp.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
        }
    });
    return ok("Typewriter applied to " + numChars + " character(s).");
}

/** Returns the selected keyframes' temporal easing as data for pasting. */
function copySelectedEases() {
    var comp = getActiveComp();
    if (!comp) return fail(MSG.noComp);

    var eases = [];
    var layers = comp.selectedLayers;
    for (var i = 0; i < layers.length; i++) {
        var props = layers[i].selectedProperties;
        for (var j = 0; j < props.length; j++) {
            var prop = props[j];
            if (prop.propertyType !== PropertyType.PROPERTY) continue;
            for (var k = 1; k <= prop.numKeys; k++) {
                if (!prop.keySelected(k)) continue;
                var inEase = prop.keyInTemporalEase(k), outEase = prop.keyOutTemporalEase(k);
                // Only the first dimension is kept; paste spreads it over every dimension.
                eases.push({
                    inEase:  { speed: inEase[0].speed,  influence: inEase[0].influence },
                    outEase: { speed: outEase[0].speed, influence: outEase[0].influence }
                });
            }
        }
    }
    if (eases.length === 0) return fail("Select one or more keyframes to copy their easing.");
    return ok("Copied easing from " + eases.length + " keyframe(s).", eases);
}

/**
 * Pastes copied easing onto the selected keyframes, in order. The source
 * ease is adapted to the target's structure (spatial vs per-dimension).
 */
function pasteSelectedEases(eases) {
    if (typeof eases === "string") eases = JSON.parse(eases);
    if (!eases || eases.length === 0) return fail("Nothing copied yet. Use Copy Easing first.");
    var comp = getActiveComp();
    if (!comp) return fail(MSG.noComp);

    var targets = [];
    var layers = comp.selectedLayers;
    for (var i = 0; i < layers.length; i++) {
        var props = layers[i].selectedProperties;
        for (var j = 0; j < props.length; j++) {
            var prop = props[j];
            if (prop.propertyType !== PropertyType.PROPERTY) continue;
            for (var k = 1; k <= prop.numKeys; k++) {
                if (prop.keySelected(k)) targets.push({ property: prop, keyIndex: k });
            }
        }
    }
    if (targets.length === 0) return fail("Select the keyframe(s) to paste easing onto.");
    if (targets.length !== eases.length) {
        return fail("Copied " + eases.length + " keyframe(s) but " + targets.length + " are selected. Select the same number.");
    }

    var errors = [];
    var done = inUndoGroup("Paste Keyframe Easing", function () {
        var n = 0;
        for (var t = 0; t < targets.length; t++) {
            try {
                var src = eases[t];
                var dims = easeDimensions(targets[t].property, targets[t].keyIndex);
                var inArr = [], outArr = [];
                for (var d = 0; d < dims; d++) {
                    inArr.push(new KeyframeEase(src.inEase.speed, src.inEase.influence));
                    outArr.push(new KeyframeEase(src.outEase.speed, src.outEase.influence));
                }
                targets[t].property.setInterpolationTypeAtKey(targets[t].keyIndex, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
                targets[t].property.setTemporalEaseAtKey(targets[t].keyIndex, inArr, outArr);
                n++;
            } catch (e) {
                errors.push(targets[t].property.name + ": " + e.toString());
            }
        }
        return n;
    });
    return report("Pasted easing onto", done, targets.length, "keyframe(s)", errors);
}

/**
 * Replaces the selected pre-comp layer with its contents, parented to a new
 * Null that carries the pre-comp layer's transform animation. Parenting
 * between layers inside the pre-comp is preserved.
 * Not handled: time remapping/stretch on the pre-comp layer, and effects or
 * masks applied to the pre-comp layer itself.
 */
function deconstructPrecomp() {
    var comp = getActiveComp();
    if (!comp) return fail(MSG.noComp);
    var selected = comp.selectedLayers;
    if (selected.length !== 1 || !(selected[0].source instanceof CompItem)) {
        return fail("Select exactly one pre-comp layer.");
    }
    var precompLayer = selected[0];
    var sourceComp = precompLayer.source;

    var transformNames = ["ADBE Anchor Point", "ADBE Position", "ADBE Scale", "ADBE Rotate Z", "ADBE Opacity"];
    if (precompLayer.threeDLayer) {
        transformNames.push("ADBE Orientation", "ADBE Rotate X", "ADBE Rotate Y");
    }

    var warnings = [];
    inUndoGroup("De-Comp \"" + precompLayer.name + "\"", function () {
        // 1. Null controller that takes over the pre-comp layer's transform.
        var controller = comp.layers.addNull(comp.duration);
        controller.name = precompLayer.name + " Controller";
        if (precompLayer.threeDLayer) controller.threeDLayer = true;
        controller.moveBefore(precompLayer);
        controller.startTime = precompLayer.startTime;
        if (precompLayer.parent) setParentKeepingValues(controller, precompLayer.parent);

        var srcTg = precompLayer.property("ADBE Transform Group");
        var dstTg = controller.property("ADBE Transform Group");
        for (var i = 0; i < transformNames.length; i++) {
            try {
                copyPropertyAnimation(srcTg.property(transformNames[i]), dstTg.property(transformNames[i]));
            } catch (e) {
                warnings.push(transformNames[i] + ": " + e.toString());
            }
        }

        // 2. Copy each layer out, keeping stack order. copyToComp doesn't
        //    return the new layer, so find it by diffing layer IDs.
        var copies = {}; // source layer index -> copied layer
        var last = controller;
        for (var j = 1; j <= sourceComp.numLayers; j++) {
            var original = sourceComp.layer(j);
            var before = {};
            for (var a = 1; a <= comp.numLayers; a++) before[comp.layer(a).id] = true;

            original.copyToComp(comp);

            var copy = null;
            for (var b = 1; b <= comp.numLayers; b++) {
                if (!before[comp.layer(b).id]) { copy = comp.layer(b); break; }
            }
            if (!copy) throw new Error("Couldn't find the copy of \"" + original.name + "\".");

            copy.moveAfter(last);
            copy.startTime = original.startTime + precompLayer.startTime;
            copies[j] = copy;
            last = copy;
        }

        // 3. Re-create parenting: inner parents map to their copies, top-level
        //    layers go under the controller. Values are kept as-is, since
        //    they're already relative to the right parent space.
        for (var c = 1; c <= sourceComp.numLayers; c++) {
            var innerParent = sourceComp.layer(c).parent;
            setParentKeepingValues(copies[c], innerParent ? copies[innerParent.index] : controller);
        }

        precompLayer.remove();
    });

    var message = "De-comped " + sourceComp.numLayers + " layer(s) from \"" + sourceComp.name + "\".";
    if (warnings.length) message += " Warnings: " + warnings.join("; ");
    return ok(message);
}

/**
 * Colours selected fill/stroke properties; if none are selected, colours the
 * first fill/stroke of each selected shape layer, or each selected text layer.
 */
function applySwatchColor(rgb) {
    if (typeof rgb === "string") rgb = JSON.parse(rgb);
    var comp = getActiveComp();
    if (!comp) return fail(MSG.noComp);

    var colorProps = {
        "ADBE Vector Fill Color": true, "ADBE Vector Stroke Color": true,
        "ADBE Text Fill Color": true, "ADBE Text Stroke Color": true
    };

    var painted = inUndoGroup("Apply Color Swatch", function () {
        var n = 0;
        var props = comp.selectedProperties;
        for (var i = 0; i < props.length; i++) {
            if (colorProps[props[i].matchName] === true) {
                setColorValue(props[i], rgb, comp.time);
                n++;
            }
        }
        if (n > 0) return n;

        var layers = comp.selectedLayers;
        for (var j = 0; j < layers.length; j++) {
            var layer = layers[j];
            if (layer instanceof TextLayer) {
                var textProp = layer.property("ADBE Text Properties").property("ADBE Text Document");
                var doc = textProp.value;
                doc.fillColor = rgb;
                doc.applyStroke = false;
                textProp.setValue(doc);
                n++;
            } else if (layer.matchName === "ADBE Vector Layer") {
                if (findAndPaintFirstColor(layer.property("ADBE Root Vectors Group"), rgb, comp.time)) n++;
            }
        }
        return n;
    });
    return painted > 0
        ? ok("Coloured " + painted + " item(s).")
        : fail("Select a shape or text layer, or a Fill/Stroke Color property.");
}

/** Sets a colour; on a keyframed property it keys the colour at `time` instead of throwing. */
function setColorValue(prop, color, time) {
    if (prop.numKeys > 0) prop.setValueAtTime(time, color);
    else prop.setValue(color);
}

function findAndPaintFirstColor(group, color, time) {
    for (var i = 1; i <= group.numProperties; i++) {
        var prop = group.property(i);
        if (!prop.enabled) continue;
        var mn = prop.matchName;
        if (mn === "ADBE Vector Graphic - Fill") {
            setColorValue(prop.property("ADBE Vector Fill Color"), color, time);
            return true;
        }
        if (mn === "ADBE Vector Graphic - Stroke") {
            setColorValue(prop.property("ADBE Vector Stroke Color"), color, time);
            return true;
        }
        if (mn === "ADBE Vector Group" && findAndPaintFirstColor(prop.property("ADBE Vectors Group"), color, time)) {
            return true;
        }
    }
    return false;
}

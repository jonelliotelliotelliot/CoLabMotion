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
    version: "1.6.0",
    assetFile: "colab-elements.aep",
    assetsFolderName: "CoLab Motion Assets",
    animatorPrefix: "CoLab"
};

var MSG = {
    noComp: "Open or select a composition first.",
    noLayer: "Select at least one layer.",
    oneTextLayer: "Select exactly one text layer.",
    noKeys: "Select some keyframes first."
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
function report(verb, done, total, noun, errors, note) {
    var message = verb + " " + done + "/" + total + " " + noun + ".";
    if (note) message += " " + note;
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
function shiftedXY(v, dx, dy) {
    var out = copyArray(v);
    out[0] += dx;
    out[1] += dy;
    return out;
}

function offsetPositionBy(positionProp, dx, dy) {
    if (positionProp.numKeys > 0) {
        for (var k = 1; k <= positionProp.numKeys; k++) {
            positionProp.setValueAtKey(k, shiftedXY(positionProp.keyValue(k), dx, dy));
        }
    } else {
        positionProp.setValue(shiftedXY(positionProp.value, dx, dy));
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
            // kinds = null accepts any keyframed property.
            if (prop.propertyType !== PropertyType.PROPERTY || (kinds && !isTransformPropertyOfKind(prop, kinds))) continue;
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

// "Curve" back eases: the overshoot lives in the Graph Editor handles instead
// of an extra keyframe. One bezier segment can have only two of: a smooth
// start, an overshoot, a smooth stop. So Back Out leaves its first key with
// speed (like Penner's easeOutBack), Back In arrives at speed, and Back In/Out
// adds one key at the midpoint (3 keys instead of 4).
var BACK_CURVE = {
    fastInfluence: 40,  // the side that carries speed; with 60 below, the peak lands near the middle
    slowInfluence: 60   // the side that eases to a stop
};

// Graph handle height, as a multiple of the move, that overshoots by
// `overshoot` (0.1 = 10%). The influences only shift when the peak happens.
function handleHeightForOvershoot(overshoot) {
    function peak(h) {
        var best = 0;
        for (var i = 0; i <= 200; i++) {
            var u = i / 200, m = 1 - u;
            var y = 3 * m * m * u * h + 3 * m * u * u + u * u * u;
            if (y > best) best = y;
        }
        return best - 1;
    }
    var lo = 1, hi = 20; // h = 1 never overshoots
    for (var n = 0; n < 40; n++) {
        var mid = (lo + hi) / 2;
        if (peak(mid) < overshoot) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
}

function isSpatial(prop) {
    var t = prop.propertyValueType;
    return t === PropertyValueType.TwoD_SPATIAL || t === PropertyValueType.ThreeD_SPATIAL;
}

/** Per-dimension speeds (value/sec) for a handle `h` moves tall and `influence` long. */
function launchSpeeds(v1, v2, dt, h, influence, dims) {
    var out = [];
    for (var d = 0; d < dims; d++) {
        var delta = (v1 instanceof Array) ? (v2[d] - v1[d]) : (v2 - v1);
        out.push(h * delta / (influence / 100 * dt));
    }
    return out;
}

function easesFor(speeds, influence) {
    var out = [];
    for (var d = 0; d < speeds.length; d++) out.push(new KeyframeEase(speeds[d], influence));
    return out;
}

function zeros(n) {
    var out = [];
    for (var d = 0; d < n; d++) out.push(0);
    return out;
}

/**
 * Eases only the segment from key k1 to k2 (k1's outgoing side, k2's incoming
 * side), so the other side of each key and any neighbouring segments keep
 * their easing.
 */
function setSegmentEase(prop, k1, k2, outEase, inEase) {
    var BEZ = KeyframeInterpolationType.BEZIER;
    var keys = [k1, k2];
    for (var i = 0; i < keys.length; i++) {
        try { prop.setTemporalAutoBezierAtKey(keys[i], false); } catch (e) {}
        try { prop.setTemporalContinuousAtKey(keys[i], false); } catch (e) {}
    }
    prop.setInterpolationTypeAtKey(k1, prop.keyInInterpolationType(k1), BEZ);
    prop.setInterpolationTypeAtKey(k2, BEZ, prop.keyOutInterpolationType(k2));
    prop.setTemporalEaseAtKey(k1, prop.keyInTemporalEase(k1), outEase);
    prop.setTemporalEaseAtKey(k2, inEase, prop.keyOutTemporalEase(k2));
}

/** One segment that overshoots past k2 (out) or dips before k1 (in). */
function curveSegment(prop, k1, k2, direction, overshoot) {
    var t1 = prop.keyTime(k1), t2 = prop.keyTime(k2);
    var dims = easeDimensions(prop, k1);
    var h = handleHeightForOvershoot(overshoot);
    var fast = launchSpeeds(prop.keyValue(k1), prop.keyValue(k2), t2 - t1, h, BACK_CURVE.fastInfluence, dims);
    var still = zeros(dims);
    if (direction === "out") {
        setSegmentEase(prop, k1, k2, easesFor(fast, BACK_CURVE.fastInfluence), easesFor(still, BACK_CURVE.slowInfluence));
    } else {
        setSegmentEase(prop, k1, k2, easesFor(still, BACK_CURVE.slowInfluence), easesFor(fast, BACK_CURVE.fastInfluence));
    }
}

/**
 * Linked Position can't overshoot through its speed graph, so separate it
 * into X/Y(/Z) Position and curve each one. Returns false if it can't.
 */
function curveOnSeparatedPosition(prop, key1, key2, easeKey) {
    if (prop.matchName !== "ADBE Position" || !prop.isSeparationLeader) return false;
    var layer = prop.propertyGroup(prop.propertyDepth);
    var dims = layer.threeDLayer ? 3 : 2;
    var t1 = prop.keyTime(key1), t2 = prop.keyTime(key2);
    prop.dimensionsSeparated = true;
    for (var d = 0; d < dims; d++) {
        var f = prop.getSeparationFollower(d);
        curveOvershoot(f, f.nearestKeyIndex(t1), f.nearestKeyIndex(t2), easeKey);
    }
    return true;
}

/** Two-key back ease (three for In/Out). Returns false if the property can't do it. */
function curveOvershoot(prop, key1, key2, easeKey) {
    if (isSpatial(prop)) return false; // speed along a motion path can't go negative
    var cfg = EASE_CONFIGS[easeKey];
    if (easeKey === "backIn") {
        curveSegment(prop, key1, key2, "in", cfg.strength);
    } else if (easeKey === "backOut") {
        curveSegment(prop, key1, key2, "out", cfg.strength);
    } else {
        var t1 = prop.keyTime(key1), t2 = prop.keyTime(key2);
        var v1 = prop.keyValue(key1), v2 = prop.keyValue(key2);
        var mid;
        if (v1 instanceof Array) {
            mid = [];
            for (var d = 0; d < v1.length; d++) mid.push((v1[d] + v2[d]) / 2);
        } else {
            mid = (v1 + v2) / 2;
        }
        var tm = (t1 + t2) / 2;
        prop.setValueAtTime(tm, mid);
        var km = prop.nearestKeyIndex(tm), k1 = prop.nearestKeyIndex(t1), k2 = prop.nearestKeyIndex(t2);
        // Each half is half the move, so double the fraction to keep the same
        // overshoot as the Keys version. Both halves meet the middle key at the
        // same speed, so the motion stays smooth through it.
        curveSegment(prop, k1, km, "in", cfg.strength * 2);
        curveSegment(prop, km, k2, "out", cfg.strength * 2);
    }
    return true;
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
    offsetLayerPosition(layer,
        localDx * Math.cos(rad) - localDy * Math.sin(rad),
        localDx * Math.sin(rad) + localDy * Math.cos(rad));
}

// 2D affine matrices [a, b, c, d, e, f]: x' = a*x + c*y + e, y' = b*x + d*y + f.
function matMul(m, n) {
    return [m[0] * n[0] + m[2] * n[1],          m[1] * n[0] + m[3] * n[1],
            m[0] * n[2] + m[2] * n[3],          m[1] * n[2] + m[3] * n[3],
            m[0] * n[4] + m[2] * n[5] + m[4],   m[1] * n[4] + m[3] * n[5] + m[5]];
}

function matApply(m, x, y) {
    return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

/** Position as [x, y], whether or not its dimensions are separated. */
function positionAtTime(layer, t) {
    var tg = layer.property("ADBE Transform Group");
    var pos = tg.property("ADBE Position");
    if (pos.dimensionsSeparated) {
        return [tg.property("ADBE Position_0").valueAtTime(t, false),
                tg.property("ADBE Position_1").valueAtTime(t, false)];
    }
    return pos.valueAtTime(t, false);
}

/**
 * Layer space -> its comp's space at time t, through every parent. 2D only:
 * 3D X/Y rotation, orientation and cameras are ignored.
 */
function layerToCompMatrix(layer, t) {
    var tg = layer.property("ADBE Transform Group");
    var anchor = tg.property("ADBE Anchor Point").valueAtTime(t, false);
    var pos = positionAtTime(layer, t);
    var scale = tg.property("ADBE Scale").valueAtTime(t, false);
    var rad = 0;
    try { rad = tg.property("ADBE Rotate Z").valueAtTime(t, false) * Math.PI / 180; } catch (e) {}
    var sx = scale[0] / 100, sy = scale[1] / 100;
    var cos = Math.cos(rad), sin = Math.sin(rad);
    // T(pos) * R(rot) * S(scale) * T(-anchor)
    var m = [cos * sx, sin * sx, -sin * sy, cos * sy, 0, 0];
    var off = matApply(m, -anchor[0], -anchor[1]);
    m[4] = off[0] + pos[0];
    m[5] = off[1] + pos[1];
    if (layer.parent) m = matMul(layerToCompMatrix(layer.parent, t), m);
    return m;
}

/** Time inside a precomp layer's source at comp time t. */
function sourceTimeOf(layer, t) {
    if (layer.timeRemapEnabled) return layer.property("ADBE Time Remapping").valueAtTime(t, false);
    return (t - layer.startTime) * 100 / layer.stretch;
}

function unionRect(r, pts) {
    for (var i = 0; i < pts.length; i++) {
        if (!r) r = { left: pts[i][0], right: pts[i][0], top: pts[i][1], bottom: pts[i][1] };
        r.left = Math.min(r.left, pts[i][0]); r.right = Math.max(r.right, pts[i][0]);
        r.top = Math.min(r.top, pts[i][1]);   r.bottom = Math.max(r.bottom, pts[i][1]);
    }
    return r;
}

function cornersThrough(m, rect) {
    var x0 = rect.left, x1 = rect.left + rect.width, y0 = rect.top, y1 = rect.top + rect.height;
    return [matApply(m, x0, y0), matApply(m, x1, y0), matApply(m, x0, y1), matApply(m, x1, y1)];
}

/** Bounds of everything visible in `comp` at time t, in its own space, or null. */
function compContentBounds(comp, t, depth) {
    var r = null;
    for (var i = 1; i <= comp.numLayers; i++) {
        var l = comp.layer(i);
        if (!(l instanceof AVLayer) && !(l instanceof ShapeLayer) && !(l instanceof TextLayer)) continue;
        try {
            if (!l.enabled || !l.hasVideo || l.guideLayer || l.nullLayer || l.adjustmentLayer) continue;
            if (l.isTrackMatte) continue;
        } catch (e) {}
        if (t < l.inPoint || t >= l.outPoint) continue;
        var rect = layerContentRect(l, t, depth);
        if (!rect || rect.width <= 0 || rect.height <= 0) continue;
        r = unionRect(r, cornersThrough(layerToCompMatrix(l, t), rect));
    }
    return r;
}

/**
 * The part of a layer that actually draws, in layer space. A precomp layer's
 * frame is usually the full comp, so use the content inside it instead.
 */
function layerContentRect(layer, t, depth) {
    var src = null;
    try { src = layer.source; } catch (e) {}
    if (src instanceof CompItem && depth < 5) {
        var b = compContentBounds(src, sourceTimeOf(layer, t), depth + 1);
        if (b) {
            if (!layer.collapseTransformation) {
                // Outside the precomp's frame is cropped.
                b = { left: Math.max(b.left, 0), right: Math.min(b.right, src.width),
                      top: Math.max(b.top, 0),   bottom: Math.min(b.bottom, src.height) };
                if (b.right <= b.left || b.bottom <= b.top) return null;
            }
            return { left: b.left, top: b.top, width: b.right - b.left, height: b.bottom - b.top };
        }
    }
    return layer.sourceRectAtTime(t, false);
}

/** Axis-aligned bounds of the layer's visible content in comp space. */
function computeLayerBoundsInComp(layer, time) {
    var rect = layerContentRect(layer, time, 0);
    if (!rect) throw new Error("nothing visible at the current time");
    return unionRect(null, cornersThrough(layerToCompMatrix(layer, time), rect));
}

/**
 * Moves the layer by (dx, dy) in comp space: converts through the parent's
 * transform, and handles separated X/Y Position.
 */
function moveLayerInComp(layer, dx, dy, time) {
    if (layer.parent) {
        var p = layerToCompMatrix(layer.parent, time);
        var det = p[0] * p[3] - p[2] * p[1];
        if (Math.abs(det) < 1e-9) throw new Error("parent is scaled to 0");
        var lx = (p[3] * dx - p[2] * dy) / det, ly = (-p[1] * dx + p[0] * dy) / det;
        dx = lx; dy = ly;
    }
    offsetLayerPosition(layer, dx, dy);
}

/** Offsets Position (in its parent's space), whether or not X/Y are separated. */
function offsetLayerPosition(layer, dx, dy) {
    var tg = layer.property("ADBE Transform Group");
    var pos = tg.property("ADBE Position");
    if (pos.dimensionsSeparated) {
        var axes = [[tg.property("ADBE Position_0"), dx], [tg.property("ADBE Position_1"), dy]];
        for (var i = 0; i < axes.length; i++) {
            var prop = axes[i][0], d = axes[i][1];
            if (prop.numKeys > 0) {
                for (var k = 1; k <= prop.numKeys; k++) prop.setValueAtKey(k, prop.keyValue(k) + d);
            } else {
                prop.setValue(prop.value + d);
            }
        }
    } else {
        offsetPositionBy(pos, dx, dy);
    }
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
    moveLayerInComp(layer, dx, dy, comp.time);
}

function hasPositionExpression(layer) {
    var tg = layer.property("ADBE Transform Group");
    var props = [tg.property("ADBE Position")];
    if (props[0].dimensionsSeparated) props = [tg.property("ADBE Position_0"), tg.property("ADBE Position_1")];
    for (var i = 0; i < props.length; i++) {
        try { if (props[i].expressionEnabled && props[i].expression !== "") return true; } catch (e) {}
    }
    return false;
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

/** Every expression on a layer, as {path: [property indices], text, enabled}. */
function collectExpressions(group, path, out) {
    for (var i = 1; i <= group.numProperties; i++) {
        var p, here = path.concat([i]);
        try { p = group.property(i); } catch (e) { continue; }
        if (!p) continue;
        if (p.propertyType === PropertyType.PROPERTY) {
            try {
                if (p.canSetExpression && p.expression !== "") {
                    out.push({ path: here, text: p.expression, enabled: p.expressionEnabled });
                }
            } catch (e) { /* some hidden properties refuse to be read */ }
        } else {
            collectExpressions(p, here, out);
        }
    }
    return out;
}

function propertyAtPath(layer, path) {
    var p = layer;
    for (var i = 0; i < path.length; i++) p = p.property(path[i]);
    return p;
}

function restoreExpressions(layer, list) {
    for (var i = 0; i < list.length; i++) {
        var p = propertyAtPath(layer, list[i].path);
        p.expression = list[i].text;
        p.expressionEnabled = list[i].enabled;
    }
}

/**
 * Takes parents, expressions and track matte links off every layer in a comp
 * (AE won't copyToComp a layer with them while an undo group is open).
 * Returns what was removed, indexed by layer index, for reattachAfterCopy.
 */
function detachForCopy(sourceComp) {
    var states = {};
    var n = sourceComp.numLayers;
    // Record everything before changing anything.
    for (var i = 1; i <= n; i++) {
        var layer = sourceComp.layer(i);
        var s = { parent: layer.parent ? layer.parent.index : 0, matte: 0, matteType: null, expressions: [] };
        try {
            if (layer.hasTrackMatte && layer.trackMatteLayer) {
                s.matte = layer.trackMatteLayer.index;
                s.matteType = layer.trackMatteType;
            }
        } catch (e) { /* pre-2023 AE: mattes are positional */ }
        s.expressions = collectExpressions(layer, [], []);
        states[i] = s;
    }
    for (var j = 1; j <= n; j++) {
        var l = sourceComp.layer(j);
        if (states[j].parent) setParentKeepingValues(l, null);
        if (states[j].matte) { try { l.removeTrackMatte(); } catch (e) {} }
        for (var k = 0; k < states[j].expressions.length; k++) {
            propertyAtPath(l, states[j].expressions[k].path).expression = "";
        }
    }
    return states;
}

function reattachAfterCopy(sourceComp, states) {
    for (var i = 1; i <= sourceComp.numLayers; i++) {
        var layer = sourceComp.layer(i), s = states[i];
        if (!s) continue;
        try { restoreExpressions(layer, s.expressions); } catch (e) {}
        try { if (s.parent) setParentKeepingValues(layer, sourceComp.layer(s.parent)); } catch (e) {}
        try { if (s.matte) layer.setTrackMatte(sourceComp.layer(s.matte), s.matteType); } catch (e) {}
    }
}

/** Sets a parent (or null) without AE adjusting the child's transform values. */
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

/** mode (back eases only): "curve" = overshoot in the graph, "keys" = baked overshoot key. */
function applyEase(easeKey, mode) {
    var comp = getActiveComp();
    if (!comp) return fail(MSG.noComp);
    var cfg = EASE_CONFIGS[easeKey];
    if (!cfg) return fail("Unknown ease: " + easeKey);
    var useCurve = (mode === "curve");
    var fellBack = 0, separated = 0;

    var isBack = easeKey.indexOf("back") === 0;
    var selections = isBack
        ? findKeyframeSelections(comp, ["Position", "Scale", "Rotation"], 2)
        : findKeyframeSelections(comp, null, 0);
    if (selections.length === 0) {
        return fail(isBack ? "Select exactly 2 keyframes on Position, Scale or Rotation." : MSG.noKeys);
    }

    var errors = [];
    var done = inUndoGroup("Apply " + cfg.label + " Ease", function () {
        return eachSafely(selections, function (s) { return s.property.name; }, function (s) {
            if (isBack) {
                if (useCurve) {
                    if (curveOvershoot(s.property, s.keys[0], s.keys[1], easeKey)) return;
                    if (curveOnSeparatedPosition(s.property, s.keys[0], s.keys[1], easeKey)) { separated++; return; }
                    fellBack++;
                }
                bakeOvershoot(s.property, s.keys[0], s.keys[1], easeKey);
            } else {
                var times = [];
                for (var i = 0; i < s.keys.length; i++) times.push(s.property.keyTime(s.keys[i]));
                applyTemporalEase(s.property, times, easeKey);
            }
        }, errors);
    });
    var notes = [];
    if (separated) notes.push("Separated Position into X/Y so the overshoot can sit in the curve.");
    if (fellBack) notes.push(fellBack + " property(s) used Keys mode (Curve can't apply there).");
    var note = notes.join(" ");
    return report("Applied " + cfg.label + " to", done, selections.length, "property(s)", errors, note);
}

/**
 * Panel entry point for the Easing section.
 * curve: "pwr1" | "pwr2" | "pwr3" | "back"
 * direction: "in" (starts slow) | "out" (ends slow) | "inout"
 * backMode: "curve" | "keys" (Back only)
 */
function applyEasing(curve, direction, backMode) {
    if (curve === "back") {
        var backKeys = { "in": "backIn", "out": "backOut", "inout": "backInOut" };
        return applyEase(backKeys[direction] || "backInOut", backMode);
    }
    var power = { pwr1: 1, pwr2: 2, pwr3: 3 }[curve];
    if (!power) return fail("Unknown curve: " + curve);
    if (direction === "inout") return applyEase("easeInOutPwr" + power);
    return applyDirectionalEase(power, direction);
}

/**
 * One-sided ease on each selected segment (two neighbouring selected keys).
 * "in" leaves the first key slowly and arrives at speed; "out" leaves at
 * speed and settles into the second key. With a single key selected, "in"
 * eases the segment leaving it and "out" the one arriving at it.
 */
function applyDirectionalEase(power, direction) {
    var comp = getActiveComp();
    if (!comp) return fail(MSG.noComp);
    var selections = findKeyframeSelections(comp, null, 0);
    if (selections.length === 0) return fail(MSG.noKeys);

    var a = EASE_CONFIGS["easeInOutPwr" + power].specs[0].inVal / 100; // slow-side influence
    var label = "Pwr" + power + (direction === "in" ? " In" : " Out");
    var errors = [], segmentCount = 0;
    var done = inUndoGroup("Apply " + label + " Ease", function () {
        return eachSafely(selections, function (s) { return s.property.name; }, function (s) {
            var prop = s.property, keys = s.keys, segments = [];
            for (var i = 0; i + 1 < keys.length; i++) {
                if (keys[i + 1] === keys[i] + 1) segments.push([keys[i], keys[i + 1]]);
            }
            if (keys.length === 1) {
                var k = keys[0];
                if (direction === "in" && k < prop.numKeys) segments.push([k, k + 1]);
                if (direction === "out" && k > 1) segments.push([k - 1, k]);
            }
            if (segments.length === 0) throw new Error("no segment to ease (select neighbouring keys)");
            for (var j = 0; j < segments.length; j++) {
                directionalSegment(prop, segments[j][0], segments[j][1], direction, a);
                segmentCount++;
            }
        }, errors);
    });
    return report("Applied " + label + " to", done, selections.length,
        "property(s) (" + segmentCount + " segment(s))", errors);
}

/**
 * The slow side is flat with influence a; the fast side's handle continues
 * the line from the slow handle to the far key, so the curve stays smooth
 * and never overshoots (cubic-bezier(a, 0, a + (1-a)/3, 1/3) for "in").
 */
function directionalSegment(prop, k1, k2, direction, a) {
    var t1 = prop.keyTime(k1), t2 = prop.keyTime(k2), dt = t2 - t1;
    var v1 = prop.keyValue(k1), v2 = prop.keyValue(k2);
    var dims = easeDimensions(prop, k1);
    var fast = [];
    if (isSpatial(prop)) {
        // One speed along the motion path: use the straight-line distance.
        var sum = 0;
        for (var d = 0; d < v1.length; d++) sum += (v2[d] - v1[d]) * (v2[d] - v1[d]);
        fast.push(Math.sqrt(sum) / ((1 - a) * dt));
    } else {
        for (var e = 0; e < dims; e++) {
            var delta = (v1 instanceof Array) ? (v2[e] - v1[e]) : (v2 - v1);
            fast.push(delta / ((1 - a) * dt));
        }
    }
    var slowInf = a * 100;
    var fastInf = Math.max((2 / 3) * (1 - a) * 100, 0.1);
    if (direction === "in") {
        setSegmentEase(prop, k1, k2, easesFor(zeros(dims), slowInf), easesFor(fast, fastInf));
    } else {
        setSegmentEase(prop, k1, k2, easesFor(fast, fastInf), easesFor(zeros(dims), slowInf));
    }
}

// -----------------------------------------------------------------------------
// FLATTEN
// -----------------------------------------------------------------------------

function zeroVector(v) {
    var out = [];
    for (var i = 0; i < v.length; i++) out.push(0);
    return out;
}

function sameValue(a, b) {
    var tol = 1e-4;
    if (a instanceof Array) {
        for (var i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > tol) return false;
        return true;
    }
    return Math.abs(a - b) <= tol;
}

/** Influence of each KeyframeEase in `eases`, never below AE's 0.1 minimum. */
function influencesOf(eases) {
    var out = [];
    for (var i = 0; i < eases.length; i++) out.push(Math.max(eases[i].influence, 0.1));
    return out;
}

function stillEases(eases) {
    var inf = influencesOf(eases), out = [];
    for (var i = 0; i < inf.length; i++) out.push(new KeyframeEase(0, inf[i]));
    return out;
}

/**
 * Removes drift between each pair of neighbouring selected keyframes: the
 * speed leaving the first and arriving at the second is set to zero, and on
 * Position the motion-path handles between them are flattened. A hold (same
 * value on both keys) becomes perfectly still; a move becomes a clean ease
 * with no overshoot. Influences, values and the easing outside the pair are
 * left alone.
 */
function flattenKeys() {
    var comp = getActiveComp();
    if (!comp) return fail(MSG.noComp);
    var selections = findKeyframeSelections(comp, null, 0);
    if (selections.length === 0) return fail(MSG.noKeys);

    var BEZ = KeyframeInterpolationType.BEZIER, HOLD = KeyframeInterpolationType.HOLD;
    var errors = [], pairs = 0, moving = 0;
    var done = inUndoGroup("Flatten Keyframes", function () {
        return eachSafely(selections, function (s) { return s.property.name; }, function (s) {
            var p = s.property, keys = s.keys, flattened = 0;
            for (var n = 0; n + 1 < keys.length; n++) {
                var k1 = keys[n], k2 = keys[n + 1];
                if (k2 !== k1 + 1) continue;   // only neighbouring keys
                flattened++;
                if (!sameValue(p.keyValue(k1), p.keyValue(k2))) moving++;
                try { p.setRovingAtKey(k1, false); p.setRovingAtKey(k2, false); } catch (e) {}
                if (p.keyOutInterpolationType(k1) !== HOLD) {
                    var pair = [k1, k2];
                    for (var i = 0; i < pair.length; i++) {
                        try { p.setTemporalAutoBezierAtKey(pair[i], false); } catch (e) {}
                        try { p.setTemporalContinuousAtKey(pair[i], false); } catch (e) {}
                    }
                    try {
                        p.setInterpolationTypeAtKey(k1, p.keyInInterpolationType(k1), BEZ);
                        p.setInterpolationTypeAtKey(k2, BEZ, p.keyOutInterpolationType(k2));
                        p.setTemporalEaseAtKey(k1, p.keyInTemporalEase(k1), stillEases(p.keyOutTemporalEase(k1)));
                        p.setTemporalEaseAtKey(k2, stillEases(p.keyInTemporalEase(k2)), p.keyOutTemporalEase(k2));
                    } catch (e) { /* hold-only properties (e.g. Source Text) are already still */ }
                }
                if (p.isSpatial) {
                    try {
                        p.setSpatialAutoBezierAtKey(k1, false); p.setSpatialContinuousAtKey(k1, false);
                        p.setSpatialAutoBezierAtKey(k2, false); p.setSpatialContinuousAtKey(k2, false);
                        var zero = zeroVector(p.keyOutSpatialTangent(k1));
                        p.setSpatialTangentsAtKey(k1, p.keyInSpatialTangent(k1), zero);
                        p.setSpatialTangentsAtKey(k2, zero, p.keyOutSpatialTangent(k2));
                    } catch (e) {}
                }
            }
            if (flattened === 0) throw new Error("select at least 2 neighbouring keyframes");
            pairs += flattened;
        }, errors);
    });
    var note = moving ? moving + " pair(s) have different values, so they still move, but without overshoot." : "";
    return report("Flattened " + pairs + " keyframe pair(s) on", done, selections.length, "property(s)", errors, note);
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

    var errors = [], expressions = 0;
    var done = inUndoGroup("Align Layers to Composition", function () {
        return eachSafely(layers, layerName, function (layer) {
            alignLayerToComp(layer, comp, alignType);
            if (hasPositionExpression(layer)) expressions++;
        }, errors);
    });
    var note = expressions ? expressions + " layer(s) have a Position expression, which may override the move." : "";
    return report("Aligned", done, layers.length, "layer(s)", errors, note);
}

function inList(item, list) {
    for (var i = 0; i < list.length; i++) if (list[i] === item) return true;
    return false;
}

/**
 * Adds a null with its anchor in its centre. With nothing selected it sits in
 * the middle of the comp. With layers selected it sits in the middle of their
 * combined bounds, just above the topmost one, and they're parented to it
 * without moving. Existing parent links inside the selection are kept; if
 * every selected root shares an outside parent, the null goes under that
 * parent so the rig keeps working.
 */
function addNull() {
    var comp = getActiveComp();
    if (!comp) return fail(MSG.noComp);
    var selected = [];
    for (var s = 0; s < comp.selectedLayers.length; s++) selected.push(comp.selectedLayers[s]);
    var topmost = getTopmostSelectedLayer(comp);

    var errors = [], parented = 0, roots = [];
    var nullLayer = inUndoGroup("Add Null", function () {
        // Centre of the selection's combined bounds (comp centre if none).
        var box = null;
        for (var i = 0; i < selected.length; i++) {
            try {
                var b = computeLayerBoundsInComp(selected[i], comp.time);
                box = unionRect(box, [[b.left, b.top], [b.right, b.bottom]]);
            } catch (e) { /* cameras, lights, empty layers: no bounds */ }
        }
        var cx = box ? (box.left + box.right) / 2 : comp.width / 2;
        var cy = box ? (box.top + box.bottom) / 2 : comp.height / 2;

        var n = comp.layers.addNull();
        n.name = selected.length ? "Null Control" : "Null";
        var rect = n.sourceRectAtTime(comp.time, false);
        n.anchorPoint.setValue([rect.left + rect.width / 2, rect.top + rect.height / 2]);
        n.position.setValue([cx, cy]);
        if (topmost) n.moveBefore(topmost);

        // Only the top of each selected hierarchy gets the null as parent.
        var sharedParent = null, mixed = false;
        for (var j = 0; j < selected.length; j++) {
            var p = selected[j].parent;
            if (p && inList(p, selected)) continue;
            roots.push(selected[j]);
            if (roots.length === 1) sharedParent = p;
            else if (p !== sharedParent) mixed = true;
        }
        // Setting .parent keeps the layer where it is on screen, like the pick whip.
        if (sharedParent && !mixed) n.parent = sharedParent;
        for (var k = 0; k < roots.length; k++) {
            try {
                roots[k].parent = n;
                parented++;
            } catch (e) {
                errors.push(roots[k].name + ": " + e.toString());
            }
        }

        for (var q = 0; q < selected.length; q++) selected[q].selected = false;
        n.selected = true;
        return n;
    });

    if (selected.length === 0) return ok("Added a null in the centre of the comp.");
    var message = "Added \"" + nullLayer.name + "\" and parented " + parented + "/" + roots.length + " layer(s) to it.";
    if (errors.length) message += " Errors: " + errors.join("; ");
    return JSON.stringify({ success: parented > 0, message: message });
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
 * between layers inside the pre-comp is preserved, as are track mattes, the
 * pre-comp layer's opacity (linked by expression) and its trim.
 * Not handled (reported as warnings): time remapping/stretch on the pre-comp
 * layer, and effects or masks applied to the pre-comp layer itself.
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
    // Things on the pre-comp layer that can't be carried over to the copies.
    if (precompLayer.timeRemapEnabled) warnings.push("time remapping ignored");
    if (precompLayer.stretch !== 100) warnings.push("time stretch ignored");
    try { if (precompLayer.property("ADBE Effect Parade").numProperties > 0) warnings.push("effects on the pre-comp layer dropped"); } catch (e) {}
    try { if (precompLayer.property("ADBE Mask Parade").numProperties > 0) warnings.push("masks on the pre-comp layer dropped"); } catch (e) {}

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

        // 2. Copy each layer out, keeping stack order. Inside an undo group,
        //    AE refuses to copy a layer that has a parent, expressions or (2023+)
        //    a track matte link, so those are taken off the originals first,
        //    put back on the copies, and always restored on the originals.
        var n = sourceComp.numLayers;
        var states = detachForCopy(sourceComp);
        var copies = {}; // source layer index -> copied layer
        try {
            var last = controller;
            for (var j = 1; j <= n; j++) {
                var original = sourceComp.layer(j);
                var before = {};
                for (var a = 1; a <= comp.numLayers; a++) before[comp.layer(a).id] = true;

                original.copyToComp(comp);

                // copyToComp doesn't return the new layer: find it by ID.
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

            // 3. Re-create parenting: inner parents map to their copies,
            //    top-level layers go under the controller. Values are kept
            //    as-is, since they're already relative to the right parent space.
            for (var c = 1; c <= n; c++) {
                var p = states[c].parent;
                setParentKeepingValues(copies[c], p ? copies[p] : controller);
            }

            // 4. Expressions and track mattes onto the copies.
            for (var m = 1; m <= n; m++) {
                restoreExpressions(copies[m], states[m].expressions);
                if (states[m].matte) {
                    try { copies[m].setTrackMatte(copies[states[m].matte], states[m].matteType); } catch (e) {}
                }
            }
        } catch (err) {
            // Leave the comp as it was: no half-finished de-comp.
            for (var r = n; r >= 1; r--) { try { if (copies[r]) copies[r].remove(); } catch (e) {} }
            try { controller.remove(); } catch (e) {}
            throw err;
        } finally {
            reattachAfterCopy(sourceComp, states);
        }

        // 5. Opacity doesn't pass through parenting, so the controller's
        //    opacity is multiplied in on every copy (only if it isn't a flat 100%).
        var ctrlOpacity = dstTg.property("ADBE Opacity");
        if (ctrlOpacity.numKeys > 0 || ctrlOpacity.value !== 100 || ctrlOpacity.expression) {
            var quoted = '"' + controller.name.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
            var link = "value * thisComp.layer(" + quoted + ").transform.opacity / 100";
            var skipped = [];
            for (var o = 1; o <= sourceComp.numLayers; o++) {
                var op = copies[o].property("ADBE Transform Group").property("ADBE Opacity");
                if (op.expression) { skipped.push(copies[o].name); continue; }
                op.expression = link;
            }
            if (skipped.length) warnings.push("opacity not linked (already has an expression): " + skipped.join(", "));
        }

        // 6. Respect the pre-comp layer's trim: nothing shows outside it.
        var trimIn = precompLayer.inPoint, trimOut = precompLayer.outPoint;
        for (var t = 1; t <= sourceComp.numLayers; t++) {
            var cp = copies[t];
            var newIn = Math.max(cp.inPoint, trimIn), newOut = Math.min(cp.outPoint, trimOut);
            if (newIn < newOut) {
                cp.inPoint = newIn;
                cp.outPoint = newOut;
            } else {
                cp.enabled = false; // entirely outside the trim; kept in case it's a parent
            }
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

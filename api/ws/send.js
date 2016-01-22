/**
 * Created by thomas on 2016-01-22 at 18:12.
 *
 * MIT Licensed
 */
var VERSION = 1;
module.exports = function (ws, payload, msg) {
    if (typeof payload === "object") {
        if (ws.authenticated)
            payload.authenticated = true;

        if (msg && msg.id)
            payload.id = msg.id;

        if (msg && msg.version)
            payload.version = msg.version;
        else payload.version = VERSION;

        if (msg && msg.type && !payload.type)
            payload.type = msg.type;

        payload = JSON.stringify(payload);
    }

    ws.send(payload, function (err) {
        if (err) console.error("WebSocket API error: %s", err);

        console.log("TX msg: " + payload);
    });
};
const bodyParser = require('body-parser');
var express = require('express');
var app = express();
var rpi = require('rpi-ws281x-native');

var date = new Date();

var NUM_LEDS = 51,
    pixelData = new Uint32Array(NUM_LEDS);
rpi.init(NUM_LEDS);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
var alarmBrightness = 0;
var timingAlarm;
var runningAlarm;

function setColor(color, brightness) {
    if (brightness !== undefined && brightness !== null && brightness <= 255) {
        rpi.setBrightness(parseInt(brightness));
        console.log('Set brightness to ' + brightness);
    }
    if (color) {
        for (var i = 0; i <= NUM_LEDS; i++) {
            pixelData[i] = '0x' + color;
        }
        rpi.render(pixelData);
        console.log('Set color to #' + color);
    }
}

function setAlarm(alarmtime) {
    if (!timingAlarm){
    timingAlarm = setTimeout(function () {
        runningAlarm = setInterval(increaseAlarmBrightness(), 3500);
    }, ((alarmtime - date.getTime())) - 900*1000);
    console.log('Alarm set for: ' + alarmtime);
    }
}

function increaseAlarmBrightness() {
    return function () {
        if (alarmBrightness < 255) {
            alarmBrightness++;
            setColor('93FF3F', alarmBrightness);
        } else if (alarmBrightness >= 255) {
            stopAlarm();
        }
    }
}

function stopAlarm() {
    clearTimeout(timingAlarm);
    clearInterval(runningAlarm);
    timingAlarm = null;
    runningAlarm = null;
    alarmBrightness = 0;
}

app.post('/setcolor', function (req, res) {
    if (runningAlarm) {
        stopAlarm();
    }
    setColor(req.body.color, req.body.brightness);
    res.end('Set color to #' + req.body.color + ' and brightness to ' + req.body.brightness);
});

app.post('/alarm', function (req, res) {
    setAlarm(req.body.alarmtime);
    res.end('Alarm Set!');
});

app.post('/alarmstop', function (req, res) {
    stopAlarm();
    res.end('Alarm Disabled!');
});

//Setup a default catch-all route that sends back a welcome message in JSON format.
app.get('*', (req, res) => res.status(200).send({
    message: 'Welcome to the beginning of nothingness.'
}));

app.listen(3000, function () {
    console.log('App is listening on port 3000!');
});

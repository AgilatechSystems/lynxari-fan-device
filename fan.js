const LynxariDevice = require(process.lynxari.device);
const device = require('@agilatech/gpio');

module.exports = class Fan extends LynxariDevice {
    
    constructor(config) {

        if ((config['gpio'] == null) || (config['gpio'] === 'undefined')) {
            throw 'Fan exception: gpio pin not defined';
        }

        config.streamPeriod = 0;
        config.devicePoll = 3600000;

        const hardware = new device(config['gpio']);

        super(hardware, config);

        this.onTime = config.manual_minutes * 60 * 1000;  // to get milliseconds
        this.limits = config.limits;

        // sanity check on limits -- lower should not be greater than upper
        this.limits.forEach((limit) => {
            if (limit.lower > limit.upper) {
                limit.lower = limit.upper;
            }
        });

        this.onState = 0; // bitmap of on flags for every limit

        this.manMask = 1<<this.limits.length; // the highest bit, just beyond all the limits bits

        this.onTimer;
    }

    addDeviceFunctionsToStates(config, onAllow, offAllow) {
    
        onAllow.push('data-input', 'timed-on', 'change-output', 'toggle-output');
        config.map('data-input', this.dataInput, [{name:'param'}, {name:'value'}]);
        config.map('timed-on', this.timedOn);
        config.map('change-output', this.changeOutput, [{name:'level'}]);
        config.map('toggle-output', this.toggleOutput);
        
    }

    dataInput(param, value, callback) {

        this.limits.forEach( (limit, idx) => {
            if (limit.name === param) {
                if (value > limit.upper) {
                    const status = this.hardware.sendCommandSync('high');
                    this.onState |= 1<<idx;  // set the bit at binary index
                    if (status > 0) {
                        this.syncLevel();
                    }
                }
                if (value <= limit.lower) {
                    this.onState &= ~(1<<idx);  // clear the bit at the binary index
                    this.checkStateBits();
                }
            }
        });

        if (typeof callback === 'function') {
            callback();
        }
    }

    timedOn(callback) {
        const status = this.hardware.sendCommandSync('high');
        this.onState |= this.manMask;

        if (status > 0) {
            this.syncLevel();
        }

        this.onTimer = setTimeout(() => {
            this.onState &= ~this.manMask; 
            clearTimeout(this.onTimer);
            this.onTimer = null;
            this.checkStateBits();
        }, this.onTime);

        callback();
    }

    changeOutput(level, callback) {
        if (level == 'low') {
            this.onState &= ~this.manMask;
            clearTimeout(this.onTimer);
            this.onTimer = null;
        }
        else {
            this.onState |= this.manMask;
        }

        this.checkStateBits();

        callback();
    }

    toggleOutput(callback) {
        if (this.level == 'low') {
            this.onState |= this.manMask;
        }
        else {
            this.onState &= ~this.manMask;
            clearTimeout(this.onTimer);
            this.onTimer = null;
        }

        this.checkStateBits();

        callback();
    }

    checkStateBits() {
        var status = 0;

        // if all onState bits are clear, then the fan can turn off
        if (this.onState == 0) {
            status = this.hardware.sendCommandSync('low');
        }
        else {
            status = this.hardware.sendCommandSync('high');
        }

        if (status > 0) {
            this.syncLevel();
        }
    }

    syncLevel() {
        this.deviceProperties['level'].cur = this.hardware.valueAtIndexSync(0);
        this.level = this.deviceProperties['level'].cur;

        this.info(`${this.name} level changed to ${this.deviceProperties['level'].cur}`);
    }
    
}





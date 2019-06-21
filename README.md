![Lynxari IoT Platform](https://agilatech.com/images/lynxari/lynxari200x60.png) **IoT Platform**
## Lynxari Ventilation Fan device driver

This device driver is specifically designed to be used with the Agilatech® Lynxari® IoT Platform.
Please see [agilatech.com](https://agilatech.com/software) to download a copy of the system. 


### Install
```
$> npm install @agilatech/lynxari-fan-device
```


### Design
This device driver is designed to control a single ventilation fan.  No assumptions are made as to the end use of the output, be it providing fresh air to a gerbil cage or exhausting explosive gasses from an industrial power plant.  Therefore, it is up to the end user application to decide upon latency and frequency issues.


### Usage
This device driver is designed to be consumed by the Agilatech® Lynxari® IoT system.  As such, it is not really applicable or useful in other environments.

To use it with Lynxari, insert its object definition as an element in the devices array in the _devlist.json_ file.
```
{
  "name": "FAN",
  "module": "@agilatech/lynxari-fan-device",
  "options": {
    "gpio": 23,
    "manual_minutes": 20,
    "limits": [
        {
            "name": "temperature",
            "upper":25,
            "lower":23
        },
        {
            "name": "co2",
            "upper": 8000,
            "lower": 5000
        }
    ]
  }
}
```


#### Device config object
The device config object is an element in the devlist.json device configuration file, which is located in the Lynxari root directory.  It is used to tell the Lynxari system to load the device, as well as several operational parameters.

_name_ is simply the name given to the device.  This name can be used in queries and for other identifcation purposes.

_module_ is the name of the npm module. The module is expected to exist in this directory under the _node_modules_ directory.  If the module is not strictly an npm module, it must still be found under the node_modules directory.

_options_ is an object within the device config object which defines all other operational parameters.  In general, any parameters may be defined in this options object, and most modules will have many several. This fan driver makes use of gpio, manual_minutes, and a limits array.

"gpio":<gpio>
The GPIO pin or other definition, where the system can connect to the output that is used to switch the fan on and off. MANDATORY

"manual_minutes": <minutes>
Defines the number of minutes the fan will remain on after it is manually switched on.

"limits": [<array>]
An array of limit objects which define a parameter and its upper and lower limits

{limit object}
Contains three parameters: name, upper, and lower.

"name":<param name>
The name of the parameter which shall have on/off control of the fan at defined limits. Note that this name MUST be identical to the name of the sensor parameter providing the data.  For example, if a temperature sensor is being used to provide input for when to switch the fan on and off, if the temperature parameter is named 'temp1', then the name given in the limit object must also be 'temp1'.

"upper":<numerical upper limit>
The numerical upper limit of the parameter, greater than which will cause the fan to turn on.

"lower":<numerical lower limit>
The numerical lower limit of the parameter, less than or equal to will cause the fan to turn off.

Note that upper and lower can be the same number. If the given lower limit is greater than the upper however, it will be corrected to be equal to the upper.


#### gpio is a manatory config parameter
Either in the .use statement or the config.json file, **gpio** must be defined to be the valid gpio pin number of the fan switch output.  Note that this number may not be the same as the physical connector pin number on the board.


#### module config 
Every module released by Agilatech includes configuration in a file named 'config.json' and we encourage any other publishers to follow the same pattern.  The parameters in this file are considered defaults, since they are overriden by definitions appearing in the options object of the Lynxari devlist.json file.

The construction of the config.json mirrors that of the options object, which is simply a JSON object with key/value pairs.
Here is an example of an 'config.json' file which operates a fan controlled at GPIO 23, will stay on for 10 minutes when manually triggered, and defines two parameters, temperature and humidity to control the fan:
```
{
    "name":"FAN",
    "gpio": 23,
    "manual_minutes": 10,
    "limits": [
        {
            "name": "temperature",
            "upper":25,
            "lower":23
        },
        {
            "name": "humidity",
            "upper": 60,
            "lower": 50
        }
    ]
}
```

  
#### Default values
If not specified in the config object, the program uses the following default values:
* _name_ : FAN


### Properties
All drivers contain the following 4 core properties:
1. **state** : the current state of the device, containing either the value *chron-on* or *chron-off* 
to indicate whether the device is monitoring data isochronally (a predefinied uniform time period of device data query).
2. **id** : the unique id for this device.  This device id is used to subscribe to this device streams.
3. **name** : the given name for this device.
4. **type** : the given type category for this device,  (_sensor_, _actuator_, etc)


#### Monitored Properties
In the *on* state, the driver software for this device monitors one value.
1. **level** - the current level of the gpio output, either 'high' or 'low', which corresponds to the fan being on or off respectively.

  
#### Streaming Properties
For this fan device, it is usual to disable streaming.  However, if it is not disabled, while in the *on* state, the driver software continuously streams this value in isochronal fashion with a period defined by *streamPeriod*. Note that a *streamPeriod* of 0 disables streaming.
1. **level_stream**
  

### State
This device driver has a binary state: __on__ or __off__. When off, no parameter values are streamed or available, and no commands are accepted other than the _turn-on_ transition. When on, the device is operational and accepts all commands.  The initial state is _off_.
  
  
### Transitions
1. **turn-on** : Sets the device state to *on*. When on, the device is operational and accepts all commands. Values are streamed, and the device is polled periodically to keep monitored values up to date.

2. **turn-off** : Sets the device state to *off*, When off, no parameter values are streamed or available, and no commands are accepted other than the _turn-on_ transition.


### Commands
1. **data-input(param, value)** : This transition allows environmental data to be passed to the fan, where it is evaluated against the upper and lower limits for the param. If the given value exceeds the upper limit, the fan is turned on, and likewise, if the value is less than or equal to the lower limit, turns the fan off. Again, note that the 'param' string MUST be identical to the name of the sensor parameter providing the data.  For example, if a temperature sensor is being used to provide input for when to switch the fan on and off, if the temperature parameter is named 'temp1', then the string given in the param argument must also be 'temp1'.

2. **timed-on** : Turns the fan on for the number of minutes given by the manual_minutes. Defaults to 10 mintues if no configuration value is given. The fan will turn off after the specified minutes, unless some other environmental condition has signaled the fan to turn on.

3. **change-output(level)** : Change the current fan output according to the parameter *level*. The acceptable value for *level* is either __high__ or __low__, which turns the fan on or off respectively.

4. **toggle-output** : Toggles the fan level to its compliment, i.e. high->low or low->high.



### Compatibility
This driver is designed to run within the Lynxari IoT platform.  While Lynxari will run on nearly any operating system, this driver employs UNIX-specific protocols and as such will run on the following operating systems:
* 32 or 64-bit Linux
* macOS and OS X
* SunOS
* AIX


### Copyright
Copyright © 2019 [Agilatech®](https://agilatech.com). All Rights Reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


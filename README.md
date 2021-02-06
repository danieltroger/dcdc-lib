# dcdc-lib
Library writte in nodejs to interface with uart dcdc converters

compatible buck converters:

400w buck/step down converter:
https://www.droking.com/400W-NC-Voltage-Regulator-Power-Supply-Module-DC-6-65V-to-0-60V-8A-Buck-Adapter-Charger-Voltmeter-Ammeter-Capacity-Meter-Time-Meter

The same module on ebay (I got the black one picture in droking): https://www.ebay.de/itm/Adjustable-400W-CC-CV-DC-DC-Step-down-Converter-Power-Supply-Module-Led-Driver/182257124080

Usage example:
```
import {DCDC} from "dcdc-lib";
const dcdc_regulator = await new DCDC({
    baudRate: 9600,
    prefix: ":",
    portId: "/dev/ttyS0"
  });
```

720w buck/step down converter:
https://www.droking.com/Power-Supply-Module-DC10V-75V-to-0-60V-12A-720W-Buck-Converter-Voltage-regulator-CNC-Control-Module-DC-12V-24V-36V-48V-Adapter

On ebay (I got one with green PCB):
https://www.ebay.de/itm/DKP6012-DC-DC-CNC-Programmierbar-Voltage-Step-Down-Module-Power-Supply-Modul/392532175205
Usage example:
```
import {DCDC} from "dcdc-lib";
const dcdc_regulator = await new DCDC({
    baudRate: 4800,
    prefix: "a",
    portId: "/dev/ttyS0"
  });
```

Methods of the class:
* setVoltage
* getSetVoltage
* getVoltage (gets actual outputted voltage, example: `const actual_voltage = await dcdc_regulator.getVoltage()`)
* setCurrent
* getSetCurrent
* getCurrent
* getCapacity (amount of ampere hours since switch on, unsure if accurate)
* getTime (time the module has been switched on)
* output (switches on or off)
* autoOn (switches auto on on or off)

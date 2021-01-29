import { init } from 'raspi';
import { Serial } from 'raspi-serial';

export class DCDC {
  #serial;
  #prefix;

  #promise_object = infinite_promise_creator();

  #last_send_time = new Date().getTime();
  #delay_between_cmds = 12;


  async #sendCommand (command) {
    const since_last_send = (new Date().getTime() - this.#last_send_time),
    time_to_wait = this.#delay_between_cmds - since_last_send;
    // console.log("since last send", since_last_send)
    if(time_to_wait > 0){
      // console.log("waiting", time_to_wait, "ms");
      await new Promise(r => setTimeout(r, time_to_wait));
    }
    const cmd = this.#prefix + command + "\r\n";
    // console.log("sending", cmd);
    this.#last_send_time = new Date().getTime();
    return await new Promise(r => this.#serial.write(cmd, r));
  }
  #padLeft(number) {
    const string = parseInt(number).toString(),
    [...string_as_array] = string,
    reversed_string_array = string_as_array.reverse();
    while(reversed_string_array.length < 4){
      reversed_string_array.push("0");
    }
    return reversed_string_array.reverse().join("");
  }
  async #readResult(){
    return await this.#promise_object.stack[this.#promise_object.stack.length-1];
  }
  async setVoltage(volts){
    if(volts < 0 || volts > 60){
      throw new Error ("Invalid voltage, must be between 0 and 60 volts", volts);
    }
    const centivolts = volts * 100,
    paddedValue = this.#padLeft(centivolts);
    await this.#sendCommand("wu" + paddedValue);
    const answer = await this.#readResult();
    // console.log("answer read in setvoltage:", answer);
    return answer === "#wuok";
  }
  async getSetVoltage(){ // Volts
    return await this.#queryNumeric("rv");
  }
  async getVoltage(){ // Volts
    return await this.#queryNumeric("ru");
  }
  async getCurrent(){ // Amperes
    return await this.#queryNumeric("ri");
  }
  async getSetCurrent(){ // Amperes
    return await this.#queryNumeric("ra");
  }
  async getCapacity(){ // Ampere Hours
    return await this.#queryNumeric("rc", 100);
  }
  async getTime(){ // Minutes
    return await this.#queryNumeric("rc", 1);
  }
  async getOutputState(){ // Boolean
    return await this.#queryNumeric("ro", 1);
  }
  async #queryNumeric(cmd, divideby){
    await this.#sendCommand(cmd);
    const answer = await this.#readResult();
    // console.log("answer recieved in queryNumeric:", answer);
    if(answer.substr(0,3) === "#" + cmd){
      return parseInt(answer.substr(3, answer.length)) / (divideby ? divideby : 100);
    } else {
      return false;
    }
  }
  async setVoltage(volts){
    volts = +volts;
    const centivolts = volts * 100,
    paddedValue = this.#padLeft(centivolts);
    await this.#sendCommand("wu" + paddedValue);
    const answer = await this.#readResult();
    // console.log("answer read in setvoltage:", answer);
    return answer === "#wuok";
  }
  async setCurrent(amps){
    amps = +amps;
    if(amps < 0 || amps > 8){
      throw new Error("invalid amps provided");
    }
    const centiamps = amps * 100,
    paddedValue = this.#padLeft(centiamps);
    await this.#sendCommand("wi" + paddedValue);
    const answer = await this.#readResult();
    // console.log("answer read in setcurrent:", answer);
    return answer === "#wiok";
  }
  async output(onoff){
    let cmd;
    if(onoff){
      cmd = "wo1";
    } else {
      cmd = "wo0";
    }
    await this.#sendCommand(cmd);
    const answer = await this.#readResult();
    // console.log("answer read in output:", answer);
    return answer === "#wook";
  }
  async autoOn(onoff){
    let cmd;
    if(onoff){
      cmd = "wy1";
    } else {
      cmd = "wy0";
    }
    await this.#sendCommand(cmd);
    const answer = await this.#readResult();
    // console.log("answer read in output:", answer);
    return answer === "#wyok";
  }
  async #datareader(){
    let buffer = "";
    this.#serial.on('data', (data) => {
      data = data.toString();
      //console.log("got data", data);
      const divided = (buffer + data).split("\r\n");
      if(divided.length > 1){
        divided.filter(v => v.length).forEach(entry => {
          this.#promise_object.resolve(entry);
          // console.log("found complete line, resolved promise with:", entry);
        });
        buffer = "";
      } else {
        buffer += data;
      }
    });
  }
  constructor (options) {
    const {baudRate, prefix, portId} = options;
    this.#prefix = prefix;
    this.#serial = new Serial({
      baudRate, portId
    });
    return (async () => {
      await new Promise(r => this.#serial.open(r));
      this.#datareader();
      return this;
    })()
  }
}
// main();
// async function main(){
//   let led1 = await new DCDC({
//     baudRate: 9600,
//     prefix: ":",
//     portId: "/dev/ttyS0"
//   });
//   // console.log(led1.setVoltage, led1);
//   // for(var i = 10; i > 1; i--){
//   //   const success = await led1.setVoltage(i);
//   //   if(!success){
//   //     console.log("error setting voltage to", i)
//   //     break;
//   //   }
//   //   const set_voltage = await led1.getSetVoltage();
//   //   const actual_voltage = await led1.getVoltage();
//   //   console.log({set_voltage, actual_voltage});
//   // }
//   while(true){
//     const set_voltage = await led1.getSetVoltage();
//     const actual_voltage = await led1.getVoltage();
//     process.stdout.write("set: " + set_voltage + " actual: " + actual_voltage + "\r");
//   }
// }
function infinite_promise_creator(){
  const cart_promise_object = {stack: [], internal_resolve: (a) => {}, resolve: (a) => {}};
  cart_promise_object.resolve = (argument) => {
    const oldresolve = cart_promise_object.internal_resolve;
    const newlength = cart_promise_object.stack.push(new Promise(r => cart_promise_object.internal_resolve = r));
    cart_promise_object.stack.splice(0, newlength-1);
    oldresolve(argument);
  };
  cart_promise_object.stack = [new Promise(r => cart_promise_object.internal_resolve = r)];
  return cart_promise_object;
}

import {DCDC} from "./index.js";
import WebSocket from "ws";

main();

let busy = false, dcdc_regulator;
async function main(){
  const wss = new WebSocket.Server({ port: 1300 });
  dcdc_regulator = await new DCDC({
    baudRate: 9600,
    prefix: ":",
    portId: "/dev/ttyS0"
  });
  console.log("dcdc initialized", dcdc_regulator);
  // const connections = [];
  wss.on('connection', function connection(ws) {
    // connections.push(ws);
    ws.on('message', (msg) => handle(msg, ws));
    ws.on('close', why => {
      console.log("connection closed", why, ws);
      // connections.splice(connections.indexOf(ws), 1);
    });
  });
  console.log("websocket server started");
}
async function handle (msg, ws) {
  if(busy){
    setTimeout(handle, 5, msg, ws);
    return;
  }
  busy = true;
  // console.log("got message", msg);
  let json = JSON.parse(msg);
  let fn = dcdc_regulator[json[0]];
  if(!fn){
    ws.send(JSON.stringify("invalid_function"));
    return;
  }
  json.splice(0,1);
  const retval = await fn.apply(dcdc_regulator, json);
  console.log("function", fn, "args", json, "returned", retval);
  ws.send(JSON.stringify(retval));
  busy = false;
}

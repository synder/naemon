# sample code    
    var path = require('path');
    var Naemon = require('naemon');
    var daemon = new Naemon();

    var scriptPath = path.join(__dirname, './lib/agent.js'); //child script path
    var args = [1,2,3]; //args will be send to child process

    daemon.start(scriptPath, args); //start Child with damon

    //when child process send message , this function will be callback
    daemon.receive(scriptPath, function(message){
        console.log(message);
    });

    //receive all child process message 
    daemon.receive(function(message){
        console.log(message);
    });

    //send message to child process which's path == scriptPath 
    daemon.message(scriptPath, { time : Date.now() });

    //send message to all child process which is daemoned by this daemon
    daemon.message({ time : Date.now() });

    //stop
    daemon.stop(scriptPath);
    //daemon.stop(); //this will stop all child process start by this daemon
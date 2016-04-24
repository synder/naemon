/**
 * Created by synder on 16/1/6.
 */

var path = require('path');
var util = require('util');
var child_process = require('child_process');
var EventEmitter = require('events').EventEmitter;

var Daemon = function(){

    EventEmitter.call(this);

    this.workers = {};

    var self = this;

    process.on('exit', function(code){
        self.stop('all');
    });
};

util.inherits(Daemon, EventEmitter);


/**
 * @desc start a module in childProcess
 * @param {String} module - the module path
 * @param {Array} [args] - the args will send to child process
 * @param {Object} [options] - options Object
 *      options.cwd String Current working directory of the child process
 *      options.cwdenv Object Environment key-value pairs
 *      options.cwdexecPath String Executable used to create the child process
 *      options.cwdexecArgv Array List of string arguments passed to the executable (Default: process.execArgv)
 *      options.cwdsilent Boolean If true, stdin, stdout, and stderr of the child will be piped to the parent, otherwise they will be inherited from the parent, see the "pipe" and "inherit" options for spawn()'s stdio for more details (default is false)
 *      options.cwduid Number Sets the user identity of the process. (See setuid(2).)
 *      options.cwdgid Number Sets the group identity of the process. (See setgid(2).)
 * @param {Function} [callback] - if start with error callback will be call
 * */
Daemon.prototype.start = function(module, args, options, callback){

    var self = this;

    module = path.normalize(module);

    if(self.workers[module]){
        if(self.workers[module].exit){
            self.workers[module].exit(0);
        }
        delete self.workers[module];
    }

    var childProcess = child_process.fork(module, args, options);

    childProcess.module = {
        path : module,
        pid : childProcess.pid
    };

    childProcess.on('error', function(err){
        callback && callback(err);
    });

    childProcess.on('exit', function (code) {
        if (code != 0) {
            self.start(module, args, options, function(){
                callback && callback(new Error(childProcess.module.path + ' exit'));
            });
        }
    });

    self.workers[module] = childProcess;

    return childProcess;
};

/**
 * @desc stop a module or all modules
 * @param {string} [module] the module path you want to stop
 * */
Daemon.prototype.stop = function(module){

    var self = this;

    if(!module) {
        for (var key in self.workers) {
            if (self.workers[key].exit) {
                self.workers[key].exit(0);
            }
            delete self.workers[key];
        }

        return true;
    }

    //stop a module
    module = path.normalize(module);

    if(self.workers[module]){

        if(self.workers[module].exit){
            self.workers[module].exit(0);
        }

        delete self.workers[module];

        return true;
    }

    return false;
};

/**
 * @desc send message to a module if module is
 * @param {string} [module] - a script module path
 * @param {object|string} message - the sending message
 * */
Daemon.prototype.message = function(module, message){

    if(arguments.length === 2){
        var childProcess = this.workers[arguments[0]];

        if(childProcess) {
            childProcess.send(arguments[1]);
        }else{
            throw new Error('can not find this module child process');
        }
    }else if(arguments.length === 1){
        for (var key in this.workers) {
            if (this.workers[key]) {
                this.workers[key].send(arguments[0]);
            }
        }
    }else{
        throw new Error('param error');
    }
};

/**
 * @desc send message to a module if module is
 * @param {string} [module] - a script module path, if do not give a module path, this will receive all message from child process
 * @param {object|string} callback - when message come, this function will be callback
 * */
Daemon.prototype.receive = function(module, callback){

    if(arguments.length === 2){
        var childProcess = this.workers[module];

        if(childProcess){
            childProcess.on('message', callback);
        }else{
            throw new Error('can not find this module child process');
        }
    }else if(arguments.length === 1){
        for (var key in this.workers) {
            if (this.workers[key]) {
                this.workers[key].on('message', callback);
            }
        }
    }else{
        throw new Error('param error');
    }
};


module.exports = Daemon;

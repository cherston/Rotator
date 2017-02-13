var Dispatcher = require('flux').Dispatcher;
var AppDispatcher = new Dispatcher();

AppDispatcher.handleAction = function(action){
  this.dispatch({
    source: 'VIEW_ACTION',
    action: action
  });
};
//can also use 'SERVER_ACTION' if the action is coming from server

module.exports = AppDispatcher;
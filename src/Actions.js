var AppDispatcher = require('./Dispatcher');
var AppConstants = require('./Constants');

var Actions = {
	swipe: function(streamID){
		AppDispatcher.handleAction({
			actionType: AppConstants.SWIPE,
			id: streamID
		});
	},
	setMode: function(streamID,mode){
		AppDispatcher.handleAction({
			actionType: AppConstants.SETMODE,
			id: streamID,
			mode: mode
		});
	},
	zoom: function(streamID,delta){
		AppDispatcher.handleAction({
			actionType: AppConstants.ZOOM,
			data: delta,
			id: streamID
		})
	},
	slide: function(step){
		console.log('actions.js slide');
		AppDispatcher.handleAction({
			actionType: AppConstants.SLIDE,
			data: step
		})
	},

	addStream: function(type,coords,datapts,mode,header,plot_mode,data_all){
		console.log('in actions adding plot_mode: ' + plot_mode);
		AppDispatcher.handleAction({
			actionType: AppConstants.ADDSTREAM,
			type: type,
			coords: coords,
			data: datapts,
			mode: mode,
			header: header,
			plot_mode: plot_mode,
			data_all: data_all
		})
	},
	play: function(){
		AppDispatcher.handleAction({
			actionType: AppConstants.PLAY
		})
	},
	pause: function(){
		AppDispatcher.handleAction({
			actionType: AppConstants.PAUSE
		})
	},
	speed: function(speed){
		AppDispatcher.handleAction({
			actionType: AppConstants.SPEED,
			speed: speed
		})
	},
	remove: function(streamID, type){
		AppDispatcher.handleAction({
			actionType: AppConstants.REMOVE,
			id: streamID,
			type: type
		})
	},
	occupy: function(obj_id,target_id){
		AppDispatcher.handleAction({
			actionType: AppConstants.OCCUPY,
			obj_id:obj_id,
			target_id:target_id
		})
	},
	extend: function(length){
		AppDispatcher.handleAction({
			actionType: AppConstants.EXTEND,
			length: length
		})
	},
	resize: function(x,y,length,width){
		AppDispatcher.handleAction({
			actionType: AppConstants.RESIZE,
			x:x,
			y:y,
			length: length,
			width: width
		})
	},
	toggleSpatialize: function(){
		AppDispatcher.handleAction({
			actionType: AppConstants.SPATIALIZE
		})
	},
	adjustBrushWindow: function(extent){
		console.log('extent in actions: ' + extent);
		AppDispatcher.handleAction({
			actionType: AppConstants.ADJUSTBRUSHWINDOW,
			extent: extent
		})
	},
	cluster: function(e){
		AppDispatcher.handleAction({
			actionType: AppConstants.CLUSTER,
			data: e
		})
	},
	nextCluster: function(){
		AppDispatcher.handleAction({
			actionType: AppConstants.NEXTCLUSTER
		})
	},
	removeCluster: function(id){
		AppDispatcher.handleAction({
			actionType: AppConstants.REMOVECLUSTER,
			id: id
		})
	},
	setFFT: function(id, data){
		AppDispatcher.handleAction({
			actionType: AppConstants.SETFFT,
			id: id,
		})
	},
	setFF: function(val,type){
		AppDispatcher.handleAction({
			actionType: AppConstants.SETFF,
			val: val,
			type: type,
		})
	},
	setModDepth: function(val,type){
		AppDispatcher.handleAction({
			actionType: AppConstants.SETMODDEPTH,
			val: val,
			type: type
		})
	},
	setMaxVal: function(val,type){
		AppDispatcher.handleAction({
			actionType: AppConstants.SETMAXVAL,
			val: val,
			type: type,
		})
	},
	setMinVal: function(val, type){
		console.log('in actions');
		AppDispatcher.handleAction({
			actionType: AppConstants.SETMINVAL,
			val: val,
			type: type,
		})

	},
	setScatterFreq: function(val,type){
		AppDispatcher.handleAction({
			actionType: AppConstants.SETSCATTERFREQ,
			val: val,
			type: type,
		})
	},
	setScatterGain: function(val, type){
		AppDispatcher.handleAction({
			actionType: AppConstants.SETSCATTERGAIN,
			val: val,
			type:type,
		})
	},
	setSampleRange: function(start, finish){
		AppDispatcher.handleAction({
			actionType: AppConstants.SETSAMPLERANGE,
			start: start,
			finish: finish
		})
	}
};

module.exports = Actions;


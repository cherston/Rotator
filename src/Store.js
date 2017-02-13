var AppDispatcher = require('./Dispatcher');
var appConstants = require('./Constants');
var objectAssign = require('react/lib/Object.assign');
var EventEmitter = require('events').EventEmitter;
var Immutable = require('immutable');
const { DFT } = require('digitalsignals');
var Correlation = require('node-correlation');



var RESIZE_EVENT = 'resize';
var CHANGE_EVENT = 'change';
var SLIDER = 'slide';

var _store = {
	//holds a list of data streams. Each stream has an associated id, swipestate, zoomstate
	//the overall list of datastreams also has an associated slidestate.
	audZone:Immutable.Map({left:235, top:400, length:150,width:150}),
	vizZone:Immutable.Map({left:65,top:400,length:150,width:150}),
	shift:50,
	SlideState:0,
	list:Immutable.List(),
	clusterList: Immutable.List(),
	auto:'pause',
	tempo:100.0,
	audio_occupancy:Immutable.List([null,null,null,null,null]),
	spatialize: true,
	clustnum: [{val: 0, contents:[], correlation:null}],
	FF: 80,
	high_synth: {FF: 180, modDepth:3, maxVal: 0.4, minVal: 0, Gain:0.3},
	low_synth: {FF: 180, modDepth:65, maxVal: 1.0, minVal: 0, Gain:0.6},
	noise: {FF: 280, modDepth:175, maxVal: 0.1, minVal: 0, Gain:0.2},
	scatter: {Freq: 125, Gain: 1,},
	clicks: {Freq: 3000, Gain: 1,}
};

//for user study
var setSampleRange = function(start, finish){
	//console.log('in set sample range. OLD First point: ' + _store.list.getIn([0,'data']);
	_store.list.map((stream,i) =>
		_store.list = _store.list.updateIn([i,'Data'],
			d => Immutable.fromJS(stream.get('data_all').slice(start,finish)))
	)
	//console.log('in set sample range. NEW First point: ' + _store.list.getIn([0,'Data']).get(0));
}
var setScatterGain = function(val, type){
	if(type === 'high')
		_store.high_synth.Gain = val;
	else if(type === 'low')
		_store.low_synth.Gain = val;
	else if(type === 'noise')
		_store.noise.Gain = val;
	else if(type === 'clicks')
		_store.clicks.Gain = val;
	else
		_store.scatter.Gain = val;
};
var setScatterFreq = function(val, type){
	if(type === 'scatter')
 		_store.scatter.Freq = val;
 	else
 		_store.clicks.Freq = val;
};
var setFF = function(val, type){
	if(type === 'high')
		_store.high_synth.FF = val;
	else if(type === 'low')
		_store.low_synth.FF = val;
	else if(type === 'noise')
		_store.noise.FF = val;
	else
		_store.scatter.FF = val;
};
var setModDepth = function(val, type){
	if(type === 'high')
		_store.high_synth.modDepth = val;
	else if(type === 'low')
		_store.low_synth.modDepth = val;
	else if(type === 'noise')
		_store.noise.modDepth = val;
	else
		_store.scatter.modDepth = val;
};
var setMaxVal = function(val, type){
	if(type === 'high')
	{
		console.log('setting high max val to: ' + val);
		_store.high_synth.maxVal = val;
	}
	else if(type === 'low')
		_store.low_synth.maxVal = val;
	else if(type === 'noise')
		_store.noise.maxVal = val;
	else
		_store.scatter.maxVal = val;
};
var setMinVal = function(val, type){
	console.log('type: ' + type);
	if(type === 'high')
	{
		console.log('setting high max val to: ' + val);
		_store.high_synth.minVal = val;
	}
	else if(type === 'low')
		_store.low_synth.minVal = val;
	else if(type === 'noise')
		_store.noise.minVal = val;
	else
		_store.scatter.minVal = val;
};
var setFFT = function(id, brush){
	console.log('in fft');

	if(_store.list.getIn([id,'fft']) === null || brush == true)
	{
		var data = _store.list.getIn([id,'Data']).slice(_store.SlideState,_store.SlideState + _store.shift).toJS();
	 	var dft = new DFT(2048, 44100);
		dft.forward(data);
		var spectrum = dft.spectrum;

		var spec_points = [];
		var len = spectrum.length;
		for(var i =0; i < len; i++){
			spec_points.push({x:i, y:spectrum[i]})
		}

		console.log('size of fft: ' + data.length);
		_store.list = _store.list.updateIn([id, 'fft'], d => spec_points)
		//console.log('updated to: ' + JSON.stringify(_store.list.getIn([id, 'fft'])))
	}
	else{
		_store.list = _store.list.updateIn([id, 'fft'], d => null)
	}
};
var removeCluster = function(i){

	_store.clustnum.map(function(clust, x){
		if(clust.val === i)
		{
			clust.contents.map((node) => _store.list = _store.list.updateIn([node, 'cluster'], d => null));
			_store.clustnum.splice(x,1)
		}
	});

};

Array.prototype.pairs = function (func) {
    var pairs = [];
    for (var i = 0; i < this.length - 1; i++) {
        for (var j = i; j < this.length - 1; j++) {
            func([this[i], this[j+1]]);
        }
    }
}

var pearson = function(stream_IDs){
	console.log('stream_IDs: ' + stream_IDs);
	var results = [];
	var pearsons = stream_IDs.pairs(function(pair){
		console.log('pair: ' + pair);
		var data1 = _store.list.getIn([pair[0],'Data']).toJS();
		var data2 = _store.list.getIn([pair[1],'Data']).toJS();


		var correlation = Correlation.calc(data1,data2);
		//console.log({a:_store.list.getIn([pair[0],'header']), b:_store.list.getIn([pair[1],'header']), correlation:correlation});
		results.push({a:_store.list.getIn([pair[0],'header']), b:_store.list.getIn([pair[1],'header']), correlation:correlation})

	})
	//console.log('pearsons: ' + JSON.stringify(results));
	return results
};

var correlate = function(stream_IDs){

	var data;
	var arr = [];
	for(var i = 0; i < _store.list.getIn([stream_IDs[0],'Data']).size; i++)
	{
		var sum = 0;
		for (var j = 0; j < stream_IDs.length; j++)
		{
			sum += _store.list.getIn([stream_IDs[j],'Data',i])
		}

		sum = sum / stream_IDs.length;
		arr.push(sum);

	}

	console.log('averages: ' + arr[0]);
	return arr;

	/*
	//console.log('data ' + data );
	var myData = [];
	for(var j = 0; j < 20000; j++) {
	    myData.push(Math.abs(30*Math.sin(0.00628 * j) + 10));
	}

	return myData;
	*/

};


var nextCluster = function(){
	const clustnumsize = _store.clustnum.length - 1
	console.log('updating cluster to ' + JSON.stringify(_store.clustnum[clustnumsize].val));
 	_store.clustnum[clustnumsize].contents.map(function(ref){
 		console.log('before: ' + _store.list.getIn([ref, 'cluster']));
 		_store.list = _store.list.updateIn([ref, 'cluster'], d => _store.clustnum[clustnumsize].val)
 		console.log('after: ' + _store.list.getIn([ref, 'cluster']));
 	});
 	_store.clustnum[clustnumsize].contents.map((ref) => _store.list = _store.list.updateIn([ref, 'selected'], d => false));
 	//console.log('cluster contents: ' + _store.clustnum[clustnumsize].contents + 'updated cluster to: ' + _store.clustnum[clustnumsize].val);



 	const nextnum = _store.clustnum[clustnumsize].val + 1;
 	const correlation = correlate(_store.clustnum[clustnumsize].contents);
 	const pearson_coef = pearson(_store.clustnum[clustnumsize].contents);
 	_store.clustnum.push({val:nextnum, contents:[], correlation:correlation})

 	// 7/4/16 TODO IF I WANT TO SOMETIME: 'ALL_DATA BEHAVIOR FOR CLUSTER. SET TO NULL FOR NOW. ALL_DATA WAS ADDED FOR USER STUDY'
 	addStream('cluster',{x:0,y:0},correlation,'n','Cluster Averages',nextnum,pearson_coef,'line',null);
};

var cluster = function(data){
	const clustnumsize = _store.clustnum.length - 1
	//_store.list = _store.list.updateIn([data.ref, 'cluster'], d => _store.clustnum.val + 1);
	console.log('adding data ref: ' + data.ref);
	_store.clustnum[clustnumsize].contents.push(data.ref);
	_store.list = _store.list.updateIn([data.ref, 'selected'], d => true);
	//console.log('updated to: _store.list.getIn([streamID_index,cluster])
	//console.log('updated to: ' + _store.list.getIn([data.ref, 'cluster']));

};
var adjustBrushWindow = function(extent){
	//console.log('Hi from the store :) Im adjusting the brush window for you to: ' + extent);
	_store.SlideState = extent[0];
	_store.shift = extent[1] - extent[0];
	_store.list.map(function(stream,i){if(stream.get('fft') !== null) setFFT(i, true)})
};

var toggleSpatialize = function(){
	console.log('setting spatialize to: ' + !_store.spatialize);
	_store.spatialize = !_store.spatialize;

};

var resize = function(bounds,mode){

	if(mode==='audioBounds')
		_store.audZone = bounds;
	else
		_store.vizZone = bounds;
	//console.log('setting store regions to' + bounds);

};

var addStream = function(type,coords,data,mode,header,clustnum,pearson_coef,plot_mode, data_all){

	console.log('adding stream with plot_mode: ' + plot_mode);
	var ID = _store.list.size;
	var stream = Immutable.fromJS({
		ID: ID,
		Name: ID,
		SwipeState: mode,
		ZoomState: '1',
		Coords: coords,
		Data: Immutable.fromJS(data),
		audID:null,
		header:header,
		cluster:null,
		selected: false,
		clustnum: clustnum,
		fft: null,
		pearson:pearson_coef,
		plot_mode:plot_mode,
		data_all: data_all
		});

	if(type === 'stream')
	{
		_store.list = _store.list.push(stream);
	}
	else if(type === 'cluster')
		_store.clusterList = _store.clusterList.push(stream);

	//console.log('coords in addstream: ' + coords.x + ',' + coords.y);
};



var swipe = function(streamID_index){
	_store.list = _store.list.updateIn([streamID_index,'SwipeState'],value => value === 'a' ? 'v' :'a' );
	const zone = _store.list.getIn([streamID_index,'audID']);
	if(zone !== null)
		_store.audio_occupancy = _store.audio_occupancy.set(zone,null)


};

var setMode = function(streamID_index, mode){
	//console.log('mode before: ' + _store.list.getIn([streamID_index, 'SwipeState']));
	_store.list = _store.list.updateIn([streamID_index,'SwipeState'],value =>mode);
	//console.log('modes after: ' + _store.list.map((el,i) => el.get('SwipeState')));
	updateClusterModes();
}

var updateClusterModes = function(){
	console.log('updating cluster modes');
	var found;
	console.log('stream modes: ' + _store.list.map((el,i) => el.get('SwipeState')));
	console.log('cluster modes: ' + _store.clusterList.map((el,i) => el.get('SwipeState')));
	for(var i=0; i < _store.clusterList.size; i++) {
	found = false;
	_store.clustnum.map(function(clust_ref){
		var new_mode = 'n';
			clust_ref.contents.map(function(streamID_index){
				var swipestate = _store.list.getIn([streamID_index,'SwipeState']);
		 		if(swipestate != 'n')
		 		{

			 		console.log('stream: ' + streamID_index + ' found in cluster: ' +clust_ref.val + ' is set to: ' + swipestate);

						if(_store.clusterList.get(i).get('clustnum') === clust_ref.val + 1){

							var cur_state = _store.clusterList.getIn([i, 'SwipeState']);
							new_mode = getNewMode(cur_state,swipestate);
							console.log('new mode: ' + new_mode);
							found = true
							_store.clusterList = _store.clusterList.updateIn([i,'SwipeState'],value => new_mode);
						}
				}
			})
		})

		console.log('found for cluster: ' + i + ' is: ' + found);
		if(!found)
		{
					console.log('setting cluster ' + i + ' to n');
					_store.clusterList = _store.clusterList.updateIn([i,'SwipeState'],value => 'n');
		}
	}


};
var getNewMode = function(cur_state, swipestate){

	var mode;
	if(swipestate === cur_state){
		mode = swipestate;
	}
	if( swipestate === 'a')
	{
		if(cur_state === 'v')
			mode = 'av'
		else
			mode ='a'
	}
	if( swipestate === 'v') //I added back the second clause bc of state when in aud and changing to viz and only 1 cluster member inside
	{
		if(cur_state === 'a')
			mode ='av'
		else
			mode ='v'
	}
	if(swipestate === 'av')
	{
		mode = swipestate
	}
	if(!cur_state)
		mode = swipestate

	console.log('swipestate in newmode: ' + swipestate + ' and cur_state is: ' + cur_state + ' so mode is: ' + mode);
	return mode;


};
	/*
	const clustnum = _store.list.getIn([streamID_index,'cluster']);

	if(clustnum != null){
		console.log('adjusting cluster mode of cluster #' + streamID_index + ' to: ' + mode + ' clustnum is: ' + clustnum);
		//console.log('cluster list before: ' + _store.clusterList);
		for(var i=0; i < _store.clusterList.size; i++)
		{
			if(_store.clusterList.get(i).get('Coords') === clustnum + 1){
				//console.log('setting cluster....');
				_store.clusterList = _store.clusterList.updateIn([i,'SwipeState'],value =>mode);
			}

		}

		//console.log('cluster list after: ' + _store.clusterList);
	}
	*/


var zoom = function(streamID_index,delta){
	_store.list = _store.list.updateIn([streamID_index,'ZoomState'], value => value + delta);
};

var slide = function(step){

		if(step === 0)
			_store.SlideState = 0;
		else if(step === 1)
			_store.SlideState += _store.shift - 1 ;
		else
			_store.SlideState -= _store.shift - 1 ;
		console.log('slidestate set to: ' + _store.SlideState);
};

var play = function(){
	_store.auto = 'play'
};
var pause = function(){
	_store.auto = 'pause'
};
var change_speed = function(speed){
	console.log('changing tempo');
	_store.tempo = speed
};
var remove = function(streamID_index, type){

	if(type === 'all')
		_store.list = Immutable.List();

	const zone = _store.list.getIn([streamID_index,'audID']);
	if(zone !== null)
		_store.audio_occupancy = _store.audio_occupancy.set(zone,null)
	_store.list = _store.list.remove(streamID_index);

	if(_store.list.size === 0)
	{
		_store.SlideState = 0;
		_store.Clustnum = {val: 0, contents:[]};
	}
};
var occupy = function(streamID_index,zone_id){
		_store.audio_occupancy = _store.audio_occupancy.set(zone_id,streamID_index);
		_store.list = _store.list.updateIn([streamID_index,'audID'],value => zone_id);
};
var extend = function(length){
		console.log('extending');

		if(length === 1)
		{
			_store.shift+= 100;
			//console.log('shift equals: ' + (_store.shift));
		}
		else
		{
			_store.shift-= 100;
			//console.log('shift equals: ' + (_store.shift));
		}


};

var Store = objectAssign({}, EventEmitter.prototype, {
	addChangeListener: function(cb){
		this.on(CHANGE_EVENT, cb);
	},

	removeChangeListener: function(cb){
		this.removeListener(CHANGE_EVENT, cb);
	},

	addSlideListener: function(cb){
		this.on(SLIDER, cb);
	},

	removeSlideListener: function(cb){
	this.removeListener(SLIDER, cb);
	},

	addResizeListener: function(cb){
		this.on(RESIZE_EVENT, cb);
	},

	removeResizeListener: function(cb){
	this.removeListener(RESIZE_EVENT, cb);
	},
	getStream: function(streamID_index){
		return _store.list.get(streamID_index);
	},
	getSpatialize: function(){
		return _store.spatialize;
	},
	getAuto: function(){
		return _store.auto
	},
	getAudZone: function(){
		return _store.audZone;
	},
	getVizZone: function(){
		return _store.vizZone;
	},
	getData: function(streamID_index,mode){
		return _store.list.getIn([streamID_index,'Data']).toJS();
	},

	getSwipeState: function(streamID_index){
		return _store.list.getIn([streamID_index,'SwipeState']);
	},
	getCluster: function(streamID_index){
		return _store.list.getIn([streamID_index,cluster])
	},
	getClustNum: function(){
		return _store.clustnum;
	},
	getClusterMates: function(val){
		return _store.clustnum.filter(function(v){
			return v.val === val;
			})[0].contents

	},
	//****************************************************
	getFF: function(type){
		if(type === 'high')
			return _store.high_synth.FF;
		else if(type === 'low')
			return _store.low_synth.FF;
		else if(type === 'noise')
			return _store.noise.FF;
		else
			return _store.scatter.FF;
	},
	getModDepth: function(type){
 		if(type === 'high')
			return _store.high_synth.modDepth;
		else if(type === 'low')
			return _store.low_synth.modDepth;
		else if(type === 'noise')
			return _store.noise.modDepth;
		else
			return _store.scatter.modDepth;
	},
	getMaxVal: function(type){
		console.log('in max val, type: ' + type);
		if(type === 'high')
		{
			console.log('getting max high val: ' + _store.high_synth.maxVal);
			return _store.high_synth.maxVal;
		}
		else if(type === 'low')
			return _store.low_synth.maxVal;
		else if(type === 'noise')
			return _store.noise.maxVal;
		else
			return _store.scatter.maxVal;
	},
	getMinVal: function(type){
		if(type === 'high')
		{
			console.log('getting min high val: ' + _store.high_synth.minVal);
			return _store.high_synth.minVal;
		}
		else if(type === 'low')
			return _store.low_synth.minVal;
		else if(type === 'noise')
			return _store.noise.minVal;
		else
			return _store.scatter.minVal;
	},
	getScatterFreq: function(type){
		if(type === 'scatter')
			return _store.scatter.Freq
		else
			return _store.clicks.Freq;
	},

	getScatterGain: function(type){
		if(type === 'high')
			return _store.high_synth.Gain;
		else if(type === 'low')
			return _store.low_synth.Gain;
		else if(type === 'noise')
			return _store.noise.Gain;
		else if(type === 'clicks')
			return _store.clicks.Gain;
		else
			return _store.scatter.Gain;
	},
	//****************************************************

	getScaleFactor: function(type){
		if(type === 'high')
			return .01 * _store.high_synth.modDepth * _store.high_synth.FF / _store.high_synth.maxVal
		else if(type === 'low')
			return .01 * _store.low_synth.modDepth * _store.low_synth.FF / _store.low_synth.maxVal
		else if(type === 'noise')
			return .01 * _store.noise.modDepth * _store.noise.FF / _store.noise.maxVal
		else
			return .01 * _store.scatter.modDepth * _store.scatter.FF / _store.scatter.maxVal

	},

	getCenter: function(){
		//console.log('aundzone in store: ' + _store.audZone);
	return ([_store.audZone.get('width') / 2 + _store.audZone.get('left'), _store.audZone.get('length') / 2 + _store.audZone.get('top'), 300]);
	},


	getStreams: function(mode){
		if(mode === 'all'){
			return _store.list;
		}
		else{
			var independent_streams = _store.list.filter(function(stream){
					return(stream.get('cluster') === null && (stream.get('SwipeState') === mode || stream.get('SwipeState') === 'av'))
				});

			var clusters;

			if(_store.clusterList.size > 0)
			{
 					clusters = _store.clusterList.filter(function(cluster){

						return(cluster.get('SwipeState') === mode || cluster.get('SwipeState') === 'av')
					});
			}
			//console.log('independent streams: ' + independent_streams.map((stream) =>(stream.get('SwipeState'))));
			if(independent_streams.size > 0)
					console.log('number of independent streams: ' + independent_streams.size + 'header: ' + independent_streams.getIn([0,'header']));
			if(clusters)
				if(clusters.size > 0)
					console.log('number of clusters: ' + clusters.size + ' header: ' + clusters.getIn([0,'header']));
			var all_streams = independent_streams.concat(clusters);

			if(clusters)
			{
				//console.log('clusters: ' + _store.clusterList.map((clust) =>(clust.get('SwipeState'))));
				return independent_streams.concat(clusters);
			}
			else
			{
				//console.log('returning only independent streams');
				return independent_streams;
			}
		}

	},
	getSlideState: function(){
		//console.log('getting slide state from the store: ' + _store.SlideState);
		return _store.SlideState;
	},

	getShift: function(){
		return _store.shift;
	},
	getOccupancy: function(pos){
		return _store.audio_occupancy.get(pos);
	},

	getAuto: function(){
		return _store.auto;
	},
	getTempo: function(){
		return _store.tempo;
	},
	getClustNum: function(){
		return _store.clustnum;
	},
});

AppDispatcher.register(function(payload){
	var action = payload.action;

	switch(action.actionType){
		case appConstants.SLIDE:
			console.log('slider action');
			slide(action.data);
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.SWIPE:
			//console.log('emitting CHANGE_EVENT');
			swipe(action.id);
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.ZOOM:
			zoom(action.id,action.data);
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.ADDSTREAM:
			addStream(action.type, action.coords,action.data,action.mode, action.header, null, null, action.plot_mode, action.data_all);
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.PLAY:
			play();
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.PAUSE:
			pause();
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.SPEED:
			change_speed(action.speed);
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.REMOVE:
			remove(action.id, action.type);
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.OCCUPY:
			occupy(action.obj_id,action.target_id);
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.EXTEND:
			extend(action.length);
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.RESIZE:
			resize(action.x,action.y,action.length,action.width);
			Store.emit(RESIZE_EVENT);
			break;
		case appConstants.SETMODE:
			setMode(action.id,action.mode)
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.SPATIALIZE:
			toggleSpatialize();
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.ADJUSTBRUSHWINDOW:
			//console.log(action.extent);
			adjustBrushWindow(action.extent);
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.CLUSTER:
			cluster(action.data);
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.NEXTCLUSTER:
			nextCluster();
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.REMOVECLUSTER:
			removeCluster(action.id);
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.SETFFT:
			setFFT(action.id);
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.SETFF:
			setFF(action.val, action.type);
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.SETMODDEPTH:
			setModDepth(action.val, action.type);
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.SETMAXVAL:
			setMaxVal(action.val, action.type);
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.SETMINVAL:
			console.log('here2');
			setMinVal(action.val, action.type);
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.SETSCATTERGAIN:
			setScatterGain(action.val, action.type);
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.SETSCATTERFREQ:
			setScatterFreq(action.val, action.type);
			Store.emit(CHANGE_EVENT);
			break;
		case appConstants.SETSAMPLERANGE:
			setSampleRange(action.start, action.finish);
			Store.emit(CHANGE_EVENT);
			break;
		default:
			return true;


	}
});

module.exports = Store;























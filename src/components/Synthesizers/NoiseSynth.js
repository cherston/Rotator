import React, {Component, PropTypes} from 'react';
import Actions from '../../Actions'
import Store from '../../Store'

class NoiseSynth extends Component {
	constructor(props) {

		super(props);
		this._AudioPrts = this._AudioPrts.bind(this);
		this.audioCtx = this.props.context;
		this.spb = this.props.spb;

		this.shift = 0;
		this.intervals = [];

		const parts = this._AudioPrts()
	 	this.bufferSource = parts[0];
		this.gainNode = parts[1];
		this.filter = parts[2];

		var temp = this.getInitialBeat();
		this.beatNumber = temp[0];
		this.nextNoteTime = temp[1];
		this.scheduleAheadTime = 1;
		this.lastNoteTime = null;

		this.rounded_nextNoteTime = parseFloat(this.nextNoteTime.toFixed(5));






	};

	_AudioPrts(audioCtx){
		//console.log('inwindow in webaudioosc: ' +JSON.stringify(this.props.inWindow));
		const gainNode = this.audioCtx.createGain();
		gainNode.gain.value = this.props.gain;

		var bufferSource = this.audioCtx.createBufferSource();
		var buffer = this.audioCtx.createBuffer(1, 100000, this.audioCtx.sampleRate);
		var data = buffer.getChannelData(0);
		var filter = this.audioCtx.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.value  = 2500;

		for (var i = 0; i < 100000; i++) {
		 data[i] = Math.random();
		}

		bufferSource.buffer = buffer;
		bufferSource.loop = true;

		//console.log('spatialize? ' + this.props.spatialize);
	 	if(this.props.spatialize)
	 	{
			var panner = this.audioCtx.createPanner();
			panner.panningModel = 'HRTF';
			panner.setPosition(this.props.spatialcoords.get('x'), this.props.spatialcoords.get('y'),0);
 			bufferSource.connect(panner);
			panner.connect(gainNode);
		}
		else
			bufferSource.connect(gainNode)


		gainNode.connect(filter);
		filter.connect(this.audioCtx.destination);
		bufferSource.start();


		return([bufferSource,gainNode,filter])


	};



	getInitialBeat(){

		var scaled_nextTime;

		var cur_time = this.audioCtx.currentTime;
		var scale_factor = 1000000;


		var time_to_add = this.spb.spb - ((parseInt(scale_factor*cur_time) % parseInt(scale_factor*this.spb.spb))/scale_factor);


		var beatNumber = this.props.approxbeat;
		var scaled_nextTime = this.props.nextTime;
		var scaled_nextTime2 = parseInt((cur_time + time_to_add) * scale_factor)/scale_factor + this.spb.spb;
		if(scaled_nextTime === null){
			//console.log('first synth');
			scaled_nextTime = scaled_nextTime2;
		}

		return[beatNumber, scaled_nextTime]
	}

	componentDidMount(){
		console.log('synth mounted');
		this.setInterval( () => {
			this.scheduler();
			console.log('play? ' + (Store.getAuto() === 'play') +  ' lastnotetime: ' + this.lastNoteTime + 'greater? ' + (this.audioCtx.currentTime > this.lastNoteTime));
			if(Store.getAuto() === 'play' && this.lastNoteTime && this.audioCtx.currentTime > this.lastNoteTime)
				{
				console.log('play! sliding in webAudioOsc... lastNoteTime is: ' + this.lastNoteTime + ' and current time is: ' + this.audioCtx.currentTime);
				 Actions.slide(1);
				 this.lastNoteTime = null;
				}
 			}

			,5);
	}

	setInterval(){
		this.intervals.push(setInterval.apply(null, arguments));
	}
	clearIntervals(){
		this.intervals.forEach(clearInterval);
	}

	componentWillUnmount(){

		this.gainNode.gain.value = 0;
		this.bufferSource.stop(this.audioCtx.currentTime + 0.03 );
		this.clearIntervals();
	}


	nextNote(){
		console.log('TEMPOaud: nextNote() 1: ' + this.props.spb.spb + ' 2: ' + this.spb.spb + ' 3: ' + this.props.spb.beat + ' 4: ' + this.beatNumber);
		//NOTE: THIS RUINS PERFECT SYNCHRONIZATION
		//if(this.props.spb.spb != this.spb.spb && (this.props.spb.beat >= this.beatNumber + this.shift))
		if(this.props.spb.spb != this.spb.spb)
		{
			//console.log('key: ' + this.props.keynum + 'beat: ' + this.props.spb.beat + 'I will be changing tempo at beat: ' + this.beatNumber);
			this.spb = this.props.spb;
			console.log('TEMPOaud tempo is now set to: ' + this.spb.spb);
		}


		//HERE

		console.log('TEMPOaud spb: ' + this.spb.spb);
		/*
		if(this.spb.spb < 0.01)
		{
			this.effective_spb = this.spb.spb * 100;
			this.shift=100;
		}
		else if(this.spb.spb <0.05)
		{
			this.effective_spb = this.spb.spb * 20;
			this.shift=20;
		}
		else if(this.spb.spb < 0.1)
		{
			this.effective_spb = this.spb.spb * 10;
			this.shift=10;
		}
		*/
		if(this.spb.spb < 0.05)
		{
			this.shift = parseInt(0.05/this.spb.spb);
			this.effective_spb = this.spb.spb * this.shift;

		}

		else
		{
			this.effective_spb = this.spb.spb;
			this.shift= 1;
		}

		//WHEN I CHANGED this.spb.spb to this.effective_spb, no more line
		this.nextNoteTime += this.effective_spb;
		this.rounded_nextNoteTime = parseFloat(this.nextNoteTime.toFixed(5));

		this.beatNumber += this.shift;
		console.log('nextNoteTime unrounded: ' + this.nextNoteTime + ' current time: ' + this.audioCtx.currentTime);
		console.log('shift: ' + this.shift + ' effective SPB: ' + this.effective_spb);



		//console.log("IN NEXT NOTE");
		if(this.props.st_ID === 0) //in order to only call these once
		{
			if(this.beatNumber >= this.props.inWindow.size - 1){
				//console.log('reassigning lastnotetime');
 				this.lastNoteTime = this.nextNoteTime;
 			}
			//console.log('calling setbeat in webaudioOSC');
			if(this.beatNumber >= this.props.inWindow.size)
				this.beatNumber = 0;

			this.props.setbeat(this.beatNumber,this.props.inWindow.size,this.nextNoteTime);
			this.props.setNextTime(this.nextNoteTime);
			//console.log('beatnumber: ' + this.beatNumber + ' inwindowsize:' + this.props.inWindow.size);

		}
			//console.log('calling setbeat in webaudioOSC');
		if(this.beatNumber >= this.props.inWindow.size)
				this.beatNumber = 0;

	}

	getScaled(beat){
		console.log('here ' + ((9.5 - Store.getMaxVal('noise')) / (Store.getMaxVal('noise') - Store.getMinVal('noise')) * 2 * Store.getMaxVal('noise') + (parseFloat(Store.getMaxVal('noise') ))));
		return (beat - Store.getMaxVal('noise')) / (Store.getMaxVal('noise') - Store.getMinVal('noise')) * 2 * Store.getMaxVal('noise') + parseFloat(Store.getMaxVal('noise'));
	}


	scheduleNote(beatNumber, time){
		//console.log('scheduling beat number: ' + beatNumber + ' for time: ' + time + ' it is currently: ' + this.audioCtx.currentTime + ' and the value is: ' + 16 * Math.pow(1.15,this.props.inWindow.get(beatNumber)));

 		if(this.props.inWindow.size > beatNumber) //to account for shrinking window size
		{
			var scaled_data = this.getScaled(this.props.inWindow.get(beatNumber));
			console.log('ff: ' + this.props.ff + ' SF: ' + this.props.scale_factor + ' beatnum:' + this.props.inWindow.get(beatNumber));
			var freq = parseFloat(this.props.ff) + scaled_data * this.props.scale_factor;
			console.log('incoming freq: ' + this.props.inWindow.get(beatNumber) + 'scaled data: ' + scaled_data + 'freq: ' + freq);
			this.filter.frequency.value = Math.abs(freq);
			console.log('gain in noisesynth: ' + this.props.gain);
			this.gainNode.gain.value = this.props.gain;

			//var freq = (this.props.inWindow.get(beatNumber) - 7) * (200) + 100
			//var freq = Math.pow(this.props.inWindow.get(beatNumber),1.6);
			//this.osc.frequency.setValueAtTime(freq,time);

		}
	}

	scheduler() {
			//console.log('here! tempo: ' + JSON.stringify(this.props.spb));

		while(this.rounded_nextNoteTime < parseFloat(this.audioCtx.currentTime.toFixed(1)) + this.scheduleAheadTime)
		{
				this.scheduleNote(this.beatNumber,this.nextNoteTime);
 				this.nextNote();

		}



	}




	shouldComponentUpdate(nextProps, nextState){

		return (nextProps.inWindow !== this.props.inWindow
				|| nextProps.center != this.props.center
				|| nextProps.ff !== this.props.ff
				|| nextProps.scale_factor !== this.props.scale_factor)

	}


	render(){
		console.log('TEMPO rerendering webaudioosc');
		//console.log('setting listener position to: ' + this.props.center.x + ' ' + this.props.center.y);
		//console.log('the oscillators position is: ' + this.props.spatialcoords.get('x') + ',' + this.props.spatialcoords.get('y'));

		if(this.props.spatialize)
			this.audioCtx.listener.setPosition(this.props.center.x, this.props.center.y,1)

		//console.log('I am synth #' + this.props.keynum + ' and my spatial position is: ' + JSON.stringify(this.props.spatialcoords) + '. The Center is: ' + JSON.stringify(this.props.center));
 		return(null);

	}
}
export default NoiseSynth
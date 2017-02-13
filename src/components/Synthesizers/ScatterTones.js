import React, {Component, PropTypes} from 'react';
import Actions from '../../Actions'
import Store from '../../Store'
var ImpulseResponse = require('./carpark_balloon_ir.wav');
import arrayToAudioBuffer from 'array-to-audiobuffer'
var ADSR = require('adsr');

class ScatterTones extends Component {
	constructor(props) {

		super(props);
		this._AudioPrts = this._AudioPrts.bind(this);
		this.audioCtx = this.props.context;
		this.spb = this.props.spb;

		this.shift = 0;
		this.intervals = [];

		const parts = this._AudioPrts()
		this.osc = parts[0];
		this.gainNode = parts[1];

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
		gainNode.gain.value = 0;

		const osc = this.audioCtx.createOscillator();
		osc.frequency.value = 0;

		//const convolver = this.audioCtx.createConvolver();




		var buffer = this.audioCtx.createBuffer(1, 44100, this.audioCtx.sampleRate);
		var data = buffer.getChannelData(0);

		for(var i = 0; i < 44100; i++)
			if(i%100 === 0)
				data[i] = 1;
			else
				data[i] = 1;

		//console.log('data: ' + data);
		var buffer = arrayToAudioBuffer({
			context: this.audioCtx,
			data:[1]
		});




		//console.log('convolver: ' + convolver.buffer.getChannelData(0));

		const  fr = new FileReader();

		/*
		fr.onload = function(e) {
			 console.log('result: ' + JSON.stringify(e.target.result));
			 this.audioCtx.decodeAudioData(e.target.result, function(converted_Buffer){
			 convolver.buffer = converted_buffer;
		})}.bind(this)
		console.log('impulse response: ' + typeof(ImpulseResponse));

		//fr.readAsArrayBuffer(new Blob([ImpulseResponse], {type: 'audio/wav'}));
		fr.readAsText(new Blob([ImpulseResponse], {type: 'audio/wav'}));
		*/

		//console.log('spatialize? ' + this.props.spatialize);
	 	if(this.props.spatialize)
	 	{
			var panner = this.audioCtx.createPanner();
			panner.panningModel = 'HRTF';
			panner.setPosition(this.props.spatialcoords.get('x'), this.props.spatialcoords.get('y'),0);
 			osc.connect(panner);
			panner.connect(gainNode);

		}
		else
			osc.connect(gainNode)

		var envelopeModulator = ADSR(this.audioCtx);
		envelopeModulator.connect(gainNode.gain);

		gainNode.connect(this.audioCtx.destination);
 		//gainNode.connect(convolver);
		//osc.connect(convolver);
		//convolver.connect(this.audioCtx.destination);
		//osc.connect(this.audioCtx.destination);
		osc.start()



		return([osc,gainNode])


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
			//console.log('play? ' + (Store.getAuto() === 'play') +  ' lastnotetime: ' + this.lastNoteTime + 'greater? ' + (this.audioCtx.currentTime > this.lastNoteTime));
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

		this.osc.stop(this.audioCtx.currentTime + 0.03 );
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
		console.log('here ' + ((9.5 - Store.getMaxVal('low')) / (Store.getMaxVal('low') - Store.getMinVal('low')) * 2 * Store.getMaxVal('low') + (parseFloat(Store.getMaxVal('low') ))));
		return (beat - Store.getMaxVal('low')) / (Store.getMaxVal('low') - Store.getMinVal('low')) * 2 * Store.getMaxVal('low') + parseFloat(Store.getMaxVal('low'));
	}


	scheduleNote(beatNumber, time, num){
		//console.log('scheduling beat number: ' + beatNumber + ' for time: ' + time + ' it is currently: ' + this.audioCtx.currentTime + ' and the value is: ' + 16 * Math.pow(1.15,this.props.inWindow.get(beatNumber)));

 		if(this.props.inWindow.size > beatNumber) //to account for shrinking window size
		{
			/*
			var freq = 0;
			if(this.props.inWindow.get(beatNumber) !== 1)
			{
				var scaled_data = this.getScaled(this.props.inWindow.get(beatNumber));

				//hack
				if(scaled_data < 1)
					scaled_data += 1;
				console.log('ff: ' + this.props.ff + ' SF: ' + this.props.scale_factor + ' beatnum:' + this.props.inWindow.get(beatNumber));
				freq = parseFloat(this.props.ff) + scaled_data * this.props.scale_factor * num;
 			}
 			else{

 				freq = this.props.freq
 			}
 			*/
 			var freq = this.props.freq;
			var envelopeModulator = ADSR(this.audioCtx);
			envelopeModulator.connect(this.gainNode.gain);


			envelopeModulator.attack = .03 // seconds
			envelopeModulator.decay = .03 // seconds
			envelopeModulator.sustain = 0.1 // multiply gain.gain.value
			envelopeModulator.release = 0.3 // seconds

			console.log('gain in scattertones: ' + this.props.gain);
			envelopeModulator.value.value = this.props.gain // value is an AudioParam

			envelopeModulator.start(time)


			var stopAt = envelopeModulator.stop(time + 0.5);
			this.gainNode.gain.setValueAtTime(0,stopAt);

			console.log('slice dinging! ' + freq + ' time: ' + time);
			this.osc.frequency.setValueAtTime(freq,time);
			//this.gainNode.gain.setValueAtTime(Store.getScatterGain(),time);
			//this.gainNode.gain.setValueAtTime(0,time + 0.1);

		}
	}

	scheduler() {
			//console.log('here! tempo: ' + JSON.stringify(this.props.spb));

		if(this.rounded_nextNoteTime < parseFloat(this.audioCtx.currentTime.toFixed(1)) + this.scheduleAheadTime)
		{


 				var num_steps_in_interval = this.props.inWindow.slice(this.beatNumber - this.shift - 20,this.beatNumber).reduce((a,b) => a + b, 0);
 					/*
					for(var i = 0; i < num_steps_in_interval; i++)
					{

						var time = this.audioCtx.currentTime + (i+1) * 1;
						console.log('scheduling: ' + this.beatNumber + ' for time ' + time + 'curtime is: ' + this.audioCtx.currentTime + ' i is' + i);
						this.scheduleNote(this.beatNumber,time);
						this.nextNote();

					}
					*/
					for(var i = 1; i <= num_steps_in_interval; i++)
					{
						console.log('slice: ' + this.props.inWindow.slice(this.beatNumber,this.beatNumber + this.shift + 1));
						console.log('slice scheduling: ' + this.beatNumber + ' for time ' + (this.audioCtx.currentTime + i * 1) + 'curtime is: ' + this.audioCtx.currentTime + ' i is' + i);
						this.scheduleNote(this.beatNumber,(this.audioCtx.currentTime + i * .3),num_steps_in_interval);
						this.nextNote();

					}
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
		console.log('ScatterTones creation!');
		//console.log('setting listener position to: ' + this.props.center.x + ' ' + this.props.center.y);
		//console.log('the oscillators position is: ' + this.props.spatialcoords.get('x') + ',' + this.props.spatialcoords.get('y'));

		if(this.props.spatialize)
			this.audioCtx.listener.setPosition(this.props.center.x, this.props.center.y,1)

		//console.log('I am synth #' + this.props.keynum + ' and my spatial position is: ' + JSON.stringify(this.props.spatialcoords) + '. The Center is: ' + JSON.stringify(this.props.center));
 		return(null);

	}
}
export default ScatterTones
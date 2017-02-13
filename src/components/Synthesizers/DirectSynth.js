import React, {Component, PropTypes} from 'react';
import Actions from '../../Actions'
import Store from '../../Store'
import arrayToAudioBuffer from 'array-to-audiobuffer'
import resampler from 'audio-resampler'

class Synth2 extends Component {
	constructor(props) {

		super(props);
		this._AudioPrts = this._AudioPrts.bind(this);
		this.process_resampled = this.process_resampled.bind(this);
		this.audioCtx = this.props.context;
		this.spb = this.props.spb;


		this.shift = 0;
		this.intervals = [];
		console.log('in constructor');
		this.playbackRate = (this.spb.spb - .00026) * (1 - .04) / (.000037 - .00026) + .05
		this._AudioPrts()
		this.gainNode = null;

		console.log('about to call getInitialBeat');


		this.scheduleAheadTime = 0.5;
		this.lastNoteTime = null;
		this.bufferSource = null;





		console.log('playback rate: ' + this.playbackRate);
		//this.osc.start(parseFloat(this.nextNoteTime));



	};

	process_resampled(event){
		var resampled_buffer = event.getAudioBuffer()
		console.log('resampled buffer duration:' + event.getAudioBuffer().duration);


		var bufferSource = this.audioCtx.createBufferSource();
		this.bufferSource = bufferSource;
		this.bufferSource.playbackRate.value = this.playbackRate;
		this.bufferSource.buffer = resampled_buffer;
		this.bufferSource.loop = true;



		const gainNode = this.audioCtx.createGain();
		gainNode.gain.value = 1;


		//console.log('spatialize? ' + this.props.spatialize);
	 	if(this.props.spatialize)
	 	{
			var panner = this.audioCtx.createPanner();
			panner.panningModel = 'HRTF';
			panner.setPosition(this.props.spatialcoords.get('x'), this.props.spatialcoords.get('y'),0);
 			this.bufferSource.connect(panner);
			panner.connect(gainNode);
		}
		else
			this.bufferSource.connect(gainNode)



		gainNode.connect(this.audioCtx.destination);




		this.gainNode = gainNode;
		return;
	}

	_AudioPrts(audioCtx){
		console.log('in audioprts');

		//convert data in the window to audio: aka range from -1 to 1. Assuming 30 is the maximum value
		var data = this.props.inWindow.map((i) => (i / 20) - 0.5);
		console.log('data: ' + data[0]);

		var buffer = arrayToAudioBuffer({
			context: this.audioCtx,
			data:this.props.inWindow
		});
		var resampled_buffer;
		console.log('resampled buffer before: ' + resampled_buffer);
		resampler(buffer,96000, (event) => this.process_resampled(event));



	};



	getInitialBeat(){
		console.log('in getinitialbeat');
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
		console.log('pause length: ' + 1000 * (scaled_nextTime-cur_time));
		setTimeout(function
			startBuffer(){
				this.bufferSource.start();
				console.log('starting buffer');
				console.log('buffer duration: ' + this.bufferSource.duration);
			}.bind(this)
			,1000 * (scaled_nextTime-cur_time));

		return[beatNumber, scaled_nextTime]
	}

	componentDidMount(){

		console.log('synth mounted');

		var temp = this.getInitialBeat();
		this.beatNumber = temp[0];
		this.nextNoteTime = temp[1];
		this.rounded_nextNoteTime = parseFloat(this.nextNoteTime.toFixed(5));
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
		this.bufferSource.stop();
		//this.osc.stop(this.audioCtx.currentTime + 0.03 );
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

			//adjusting playback rate of buffer
			this.playbackRate = (this.spb.spb - .00026) * (1 - .04) / (.000037 - .00026) + .05
			this.bufferSource.playbackRate.value = this.playbackRate;
		}


		//HERE

		console.log('TEMPOaud spb: ' + this.spb.spb);

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

		if(this.beatNumber >= this.props.inWindow.size){
			this.beatNumber = 0;
		}

		//console.log("IN NEXT NOTE");
		if(this.props.st_ID === 0) //in order to only call these once
		{
			this.props.setbeat(this.beatNumber,this.props.inWindow.size,this.nextNoteTime);
			this.props.setNextTime(this.nextNoteTime);
			console.log('beatnumber: ' + this.beatNumber + ' inwindowsize:' + this.props.inWindow.size);
			if(this.beatNumber >= this.props.inWindow.size - 1){
				//console.log('reassigning lastnotetime');
 				this.lastNoteTime = this.nextNoteTime;
 			}
		}

	}



	scheduler() {
			//console.log('here! tempo: ' + JSON.stringify(this.props.spb));

		while(this.rounded_nextNoteTime < parseFloat(this.audioCtx.currentTime.toFixed(1)) + this.scheduleAheadTime)
		{

 				this.nextNote();

		}



	}




	shouldComponentUpdate(nextProps, nextState){


		return (nextProps.inWindow !== this.props.inWindow || nextProps.center != this.props.center)

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
export default Synth2
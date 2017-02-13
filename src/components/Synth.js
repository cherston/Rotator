import React, {Component, PropTypes} from 'react';
import Store from '../Store';


class Synth1 extends Component {
	constructor(props) {
		console.log('creating a synth');
		super(props);
	};

	shouldComponentUpdate(nextProps, nextState){
		//return true;
		return nextProps.latest !== this.props.latest
	};

	synthesize_latest(latest){
			console.log('synthesizing latest: ' + latest);
			var synth = new Tone.SimpleSynth().toMaster();
			var note = latest*75;
			synth.triggerAttackRelease(note,'8n');

		};

	render(){
		console.log('in synth with latest = ' + this.props.latest);
		if(this.props.latest !== null)
			this.synthesize_latest(this.props.latest);
		return(null);
	}
}
export default Synth1
import React, {Component, PropTypes} from 'react';
import Store from '../Store';
import Actions from '../Actions';
import NewLineChart from './NewLineChart';
import { DragSource } from 'react-dnd';
import { DragTypes } from '../DragConstants';
import DirectSynth from './Synthesizers/DirectSynth';
import Envelope from './Synthesizers/Envelope';
import Clicks from './Synthesizers/Clicks';
import NoiseSynth from './Synthesizers/NoiseSynth';
import OscHigh from './Synthesizers/OscHigh';
import OscLow from './Synthesizers/OscLow';
import Immutable from 'immutable';
import ScatterTones from './Synthesizers/ScatterTones'
import {Grid, Row, Col,Button,ButtonToolbar} from 'react-bootstrap';


class AudioItem extends Component {

	constructor(props) {
		super(props);
		this._onChange = this._onChange.bind(this);
		this.handleSwipe = this.handleSwipe.bind(this);
		this.handleRemove = this.handleRemove.bind(this);

		this.state = {
			StreamID_index: this.props.location,
			SlideState: Store.getSlideState(),
			Latest: this.getLatest(),
			inWindow: null,
		}
	};
	componentDidMount(){
		Store.addSlideListener(this._onChange);

	};
	componentWillUnmount(){
		Store.removeSlideListener(this._onChange);
	};
	handleSwipe(){
		//console.log('swiping location: ' + this.props.location);
		Actions.swipe(this.props.location);
	};
	handleZoom(delta){
		Actions.zoom(this.props.location,delta)
	};
	handleRemove(){
		Actions.remove(this.props.location);
	};

	getLatest(){

		return this.props.stream.get('Data').get(Store.getSlideState()+Store.getShift()-1);
	};

	//ADDED JUNE 1ST: CONSIDER REMOVING IF PROBLEMS ARISE
	shouldComponentUpdate(nextprops,nextstate){
		console.log(nextprops.synth , this.props.synth);
		return(
			nextprops.stream.get('Coords') != this.props.stream.get('Coords') ||
			nextprops.center !== this.props.center) ||
			nextprops.spb !== this.props.spb ||
			nextprops.synth !== this.props.synth ||
			nextprops.ff !== this.props.ff ||
			nextprops.scale_factor !== this.props.scale_factor ||
			nextprops.gain !== this.props.gain
	}
	getItemsInWindow(){
		//console.log('in getItemsInWindow with slide shift: ' + Store.getShift());
	//	console.log('getItemsInWindow fft: ' + JSON.stringify(this.props.fft));
		const inWindow =
			this.props.fft ?
			Immutable.fromJS(this.props.stream.get('fft').slice(0,50).map((point) => point.y)):
			this.props.stream.get('Data').slice(Store.getSlideState(),Store.getSlideState() + Store.getShift());
		return inWindow;
	}


	_onChange(props){
		this.setState({
				StreamID_index: this.props.location,
				SlideState: Store.getSlideState(),
				Latest: this.getLatest(),
				inWindow: this.getItemsInWindow()
		});

	};


	render(){
		//console.log('passing: ' + JSON.stringify(this.props.center));
		var scaled_center = this.props.AMSInvScale(Store.getCenter()[0],Store.getCenter()[1]);
		console.log('TEMPO new spb in audio item: ' + this.props.spb.spb);
		var scaled_coords = this.props.stream.get('Coords');
		//console.log('scaled coords: ' + scaled_coords.get('x'));
		//console.log('scaled coords: ' + JSON.stringify(scaled_coords));
		var spatialcoords = {x: scaled_coords.get('x') - scaled_center.x,
							 y: scaled_coords.get('y') - scaled_center.y,
							 z: 300 };



		var connectDragSource = this.props.connectDragSource;
		var connectDragPreview = this.props.connectDragPreview;
		var isDragging = this.props.isDragging;
		//var didDrop = this.props.didDrop;
		var itemstyle;

		const latest = this.state.Latest;
		//console.log('latest is: ' + latest);
		const inWindow = this.getItemsInWindow();
		//console.log('inwindow being sent: ' + JSON.stringify(inWindow));
		const all_data = this.props.fft ? this.props.fft : Store.getData(this.props.location);
		var SynthType = {component: this.props.synth};

		console.log('Synth in AudioItem: ' + SynthType.component);
		console.log('plotmode in AudioItem: ' + this.props.stream.get('plot_mode'));
		console.log('gain in audioitem: ' + this.props.gain);

 		if(this.props.synth === 'WebAudioOsc')
		{
			if(this.props.stream.get('plot_mode') === 'high')
			{
				return(
					<div>


						<div>

							<h4 key={this.props.stream.get('ID')}>{this.props.stream.get('header')}</h4>
							{
							<OscHigh
								key={this.props.key}
								st_ID={this.props.ID}
								latest={latest}
								inWindow={inWindow}
								all_data={all_data}
								shift={Store.getShift()}
								position={Store.getSlideState()}
								context={this.props.context}
								spb={this.props.spb}
								keynum={this.props.location}
								setbeat={this.props.setbeat}
								approxbeat={this.props.approxbeat}
								nextTime={this.props.nextTime}
								setNextTime={this.props.setNextTime}
								spatialcoords={scaled_coords}
								center={scaled_center}
								spatialize={this.props.spatialize}
								scale_factor={this.props.scale_factor}
								ff={this.props.ff}
								gain={this.props.gain}
						 	/>
						 	}

						</div>
						</div>
				)
			}
			else if(this.props.stream.get('plot_mode') === 'low')
			{
				return(
					<div>


						<div>

							<h4 key={this.props.stream.get('ID')}>{this.props.stream.get('header')}</h4>
							{
							<OscLow
								key={this.props.key}
								st_ID={this.props.ID}
								latest={latest}
								inWindow={inWindow}
								all_data={all_data}
								shift={Store.getShift()}
								position={Store.getSlideState()}
								context={this.props.context}
								spb={this.props.spb}
								keynum={this.props.location}
								setbeat={this.props.setbeat}
								approxbeat={this.props.approxbeat}
								nextTime={this.props.nextTime}
								setNextTime={this.props.setNextTime}
								spatialcoords={scaled_coords}
								center={scaled_center}
								spatialize={this.props.spatialize}
								scale_factor={this.props.scale_factor}
								ff={this.props.ff}
								gain={this.props.gain}
						 	/>
						 	}

						</div>
						</div>
				)
			}
			else if (this.props.stream.get('plot_mode') === 'clicks')
			{
				return(
					<div>


						<div>

							<h4 key={this.props.stream.get('ID')}>{this.props.stream.get('header')}</h4>
							{
							<Clicks
								key={this.props.key}
								st_ID={this.props.ID}
								latest={latest}
								inWindow={inWindow}
								all_data={all_data}
								shift={Store.getShift()}
								position={Store.getSlideState()}
								context={this.props.context}
								spb={this.props.spb}
								keynum={this.props.location}
								setbeat={this.props.setbeat}
								approxbeat={this.props.approxbeat}
								nextTime={this.props.nextTime}
								setNextTime={this.props.setNextTime}
								spatialcoords={scaled_coords}
								center={scaled_center}
								spatialize={this.props.spatialize}
								scale_factor={this.props.scale_factor}
								ff={this.props.ff}
								freq={this.props.freq}
								gain={this.props.gain}
						 	/>
						 	}

						</div>
						</div>
				)

			}
			else if (this.props.stream.get('plot_mode') === 'scatter')
			{
				return(
					<div>


						<div>

							<h4 key={this.props.stream.get('ID')}>{this.props.stream.get('header')}</h4>
							{
							<Clicks
								key={this.props.key}
								st_ID={this.props.ID}
								latest={latest}
								inWindow={inWindow}
								all_data={all_data}
								shift={Store.getShift()}
								position={Store.getSlideState()}
								context={this.props.context}
								spb={this.props.spb}
								keynum={this.props.location}
								setbeat={this.props.setbeat}
								approxbeat={this.props.approxbeat}
								nextTime={this.props.nextTime}
								setNextTime={this.props.setNextTime}
								spatialcoords={scaled_coords}
								center={scaled_center}
								spatialize={this.props.spatialize}
								scale_factor={this.props.scale_factor}
								ff={this.props.ff}
								freq={this.props.freq}
								gain={this.props.gain}
						 	/>
						 	}

						</div>
						</div>
				)

			}
			else if(this.props.stream.get('plot_mode') === 'noise'){
				return(
					<div>
							<h4 key={this.props.stream.get('ID')}>{this.props.stream.get('header')}</h4>

							<NoiseSynth
								key={this.props.key}
								st_ID={this.props.ID}
								latest={latest}
								inWindow={inWindow}
								all_data={all_data}
								shift={Store.getShift()}
								position={Store.getSlideState()}
								context={this.props.context}
								spb={this.props.spb}
								keynum={this.props.location}
								setbeat={this.props.setbeat}
								approxbeat={this.props.approxbeat}
								nextTime={this.props.nextTime}
								setNextTime={this.props.setNextTime}
								spatialcoords={scaled_coords}
								center={scaled_center}
								spatialize={this.props.spatialize}
								scale_factor={this.props.scale_factor}
								ff={this.props.ff}
								gain={this.props.gain}
						 	/>


						</div>
				)

			}
		else if(this.props.stream.get('plot_mode') === 'envelope'){
				return(
					<div>
							<h4 key={this.props.stream.get('ID')}>{this.props.stream.get('header')}</h4>

							<OscLow
								key={this.props.key}
								st_ID={this.props.ID}
								latest={latest}
								inWindow={inWindow}
								all_data={all_data}
								shift={Store.getShift()}
								position={Store.getSlideState()}
								context={this.props.context}
								spb={this.props.spb}
								keynum={this.props.location}
								setbeat={this.props.setbeat}
								approxbeat={this.props.approxbeat}
								nextTime={this.props.nextTime}
								setNextTime={this.props.setNextTime}
								spatialcoords={scaled_coords}
								center={scaled_center}
								spatialize={this.props.spatialize}
								scale_factor={this.props.scale_factor}
								ff={this.props.ff}
								gain={this.props.gain}
						 	/>


						</div>
				)

			}
		}
		else{
			return(
				<div>


					<div>

						<h4 key={this.props.stream.get('ID')}>{this.props.stream.get('header')}</h4>
						{
						<DirectSynth
							key={this.props.key}
							st_ID={this.props.ID}
							latest={latest}
							inWindow={inWindow}
							all_data={all_data}
							shift={Store.getShift()}
							position={Store.getSlideState()}
							context={this.props.context}
							spb={this.props.spb}
							keynum={this.props.location}
							setbeat={this.props.setbeat}
							approxbeat={this.props.approxbeat}
							nextTime={this.props.nextTime}
							setNextTime={this.props.setNextTime}
							spatialcoords={scaled_coords}
							center={scaled_center}
							spatialize={this.props.spatialize}



					 	/>
					 	}

					</div>
					</div>
			)

		}

	}
};

export default AudioItem;
//export default Item;
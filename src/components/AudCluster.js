import React, {Component}  from 'react';
import Actions from '../Actions';
import Item from './Item';
import UploadZone from 'react-dropzone';
//import DropZone from './DropZone';
import Store from '../Store';
import Resizable from './Resizable';
import Scatter from './Scatter';
import { Button, Grid, Row, Col } from 'react-bootstrap';
import Immutable from 'immutable';


class AudCluster extends Component {

	constructor(props) {

		super(props);

		//this.find_index = this.find_index.bind(this);
		this.state = {
			visualBounds:Immutable.Map({left:65,top:400,length:150,width:150}),
			audioBounds: Immutable.Map({left:235, top:400, length:150,width:150}),
			states: null,
		}
 	};
	//helper function for adjusting immutable states
	getMode(x,y){
		return this.refs.scatter.getMode(x,y);
	}
	setModes(){
	this.refs.scatter.getInViz()[0].map(function(stream) {
		if(stream != null)
		{
			Actions.setMode(stream.ref,stream.mode)
		}
		});
	};

	setModesUp(){
		return this.refs.scatter.getInViz();
	}

	onBoundsResize(type, side, del_size) {


			const mode = (type === 'visual') ? 'visualBounds' : 'audioBounds' ;

			//this.setState({[type]:this.state[type].update(....)});
			if(side==='top' || side==='topRight' || side==='topLeft')
			{
				this.setState({[mode]:this.state[mode].update('top', v => v-del_size.height)});
			    Actions.resize(this.state[mode].update('top', v => v-del_size.height),mode);
			}
			if(side==='left' || side==='topLeft' || side==='bottomLeft')
			{
				this.setState({[mode]:this.state[mode].update('left', v => v-del_size.width)});
			    Actions.resize(this.state[mode].update('left', v => v-del_size.width),mode);
			}
			if(side==='top' || side==='bottom' || side==='topRight' || side==='topLeft' || side==='bottomLeft' || side==='bottomRight')
			{
				this.setState({[mode]:this.state[mode].update('length', v => v+del_size.height)});
			    Actions.resize(this.state[mode].update('length', v => v+del_size.height),mode);
			}
			if(side==='left' || side==='right' || side==='topRight' || side==='topLeft' || side==='bottomLeft' || side==='bottomRight')
			{
				  this.setState({[mode]:this.state[mode].update('width', v => v+del_size.width)});
				  Actions.resize(this.state[mode].update('width', v => v+del_size.width),mode);
			}

 		this.setModes();
	};



	onShapeDrag(type, offset){
		//console.log('dragging');



		//Actions.resize(this.state.visualBounds,'viz');
		//Actions.resize(this.state.audioBounds,'aud');

		//this.setModes();

	}
	onShapeDragStop(type, offset){
		//console.log('offset');
		const mode = (type === 'visual') ? 'visualBounds' : 'audioBounds' ;

		this.setState({[mode]: this.state[mode].update('left', v => offset.left)});
	    this.setState({[mode]: this.state[mode].update('top', v => offset.top)});

	    Actions.resize(this.state[mode].update('left', v => offset.left),mode);
	    Actions.resize(this.state[mode].update('top', v => offset.top),mode);
	    //console.log('setting left to ' + offset.left);

		this.setModes();
	}
	render(){

		//var lisatItems = this.props.items
		const { findPlotIndex, Streams, handleFile} = this.props;
		const height = 400;
		var file;
		var style;
		console.log('UI in audcluster: ' + this.props.UI);
		if(this.props.UI === 'bio')
		{
			file = './BioSchematic2.png'
			style = {paddingBottom: 100, paddingLeft: 50, height:1.2 * height, position:'absolute'};
		}
		else if(this.props.UI === 'space')
		{
			file = './AMSSensorSchematic.png'
			style = {height:.8125 * height, position:'absolute'}
		}
		else if(this.props.UI === 'shor')
		{
			file = './ShorCircuit.png'
			style = {paddingLeft: 20, paddingTop: 60, height: .65 * height, position:'absolute'}
		}
		this.schem = require(file);

	return (

		<div>
			<div>
	        <h1> Data Node Map: {Store.getAuto() === 'play' ? <font color="red">PLAYING</font> : null}</h1>
	      	</div>

	      	<div>
	      		<Resizable type='auditory' onBoundsResize={this.onBoundsResize.bind(this,'auditory')} onShapeDrag={this.onShapeDrag.bind(this,'auditory')} onShapeDragStop={this.onShapeDragStop.bind(this,'auditory')}/>
				<Resizable type='visual'   onBoundsResize={this.onBoundsResize.bind(this,'visual')} onShapeDrag={this.onShapeDrag.bind(this,'visual')} onShapeDragStop={this.onShapeDragStop.bind(this,'visual')}/>
				<div style={{paddingLeft:40}}>
				<img style={style} src={this.schem}/>
	      		</div>
	      		<div style={{position:'absolute'}}>
	      		<Scatter
	      			height={height}
	      			ref={'scatter'}
	      			findPlotIndex={findPlotIndex}
	      			Streams={Streams}
	      			audioBounds={this.state.audioBounds}
	      			visualBounds={this.state.visualBounds}
	      		/>
	      		</div>
	      		{/*
	      		<svg style={{position:'absolute'}} width="50" height="50">
					  <line x1="30" y1="10" x2="240" y2="280" stroke="gray" strokeWidth="5"  />
				</svg> */}
	      		{/*
				<DropZone zone={0} handler={this.props.findPlotIndex} slidestate={Store.getSlideState()} stream={Store.getStream(Store.getOccupancy(0))}   />

				<DropZone zone={1} handler={this.props.findPlotIndex} slidestate={Store.getSlideState()} stream={Store.getStream(Store.getOccupancy(1))}  />

				<DropZone zone={2} handler={this.props.findPlotIndex} slidestate={Store.getSlideState()} stream={Store.getStream(Store.getOccupancy(2))}   />

				<DropZone zone={3} handler={this.props.findPlotIndex} slidestate={Store.getSlideState()} stream={Store.getStream(Store.getOccupancy(3))}  />
				*/}
	      	</div>

	     </div>

		) //closes return
	}//closes render function
};

export default AudCluster
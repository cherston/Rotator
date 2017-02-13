import React, {Component} from 'react';
import Actions from '../Actions';
import Item from './Item';
import Immutable from 'immutable';
import { DropTarget } from 'react-dnd';
import { DragTypes } from '../DragConstants';
import {Rectangle} from 'react-shapes';
const { Button } = require('react-bootstrap');
import MultiPlot from './MultiPlot';
import Store from '../Store';

const vizTarget = {
	drop(props, monitor) {
		console.log()
		return {zone:'viz'}
	}
};
function collect(connect, monitor) {

	return {
		connectDropTarget: connect.dropTarget(),
		isOver: monitor.isOver(),
	};
}

class ListViz extends Component{

	constructor(props) {
		super(props);
		this.handleCollapse = this.handleCollapse.bind(this);
	};

	handleCollapse(){

	}

	render(){
		console.log('renewing ListViz with collapsed: ' + this.props.collapsed);
		const { connectDropTarget, isOver} = this.props;
		const { Streams, handleFile, findPlotIndex, collapsed } = this.props;

		//console.log('tempo: ' + this.props.spb.spb);

		//console.log('rerendering listviz');
	//NOTE: For now, I am leaving StreamUI in the respective list components since I'm taking a chance and generalizing
	//the Item component. If I later find I need distinct Audio/Visual item components, then likely to change.
	//I am keeping listaud and list vid separate because I anticipate a very different render function in each case
 	const color = isOver ? '#2477ba' : '#2409ba';
 	var vizStyle = {background: '#fff'};
 	var VizUI;

 	if(isOver)
 		vizStyle['background'] = '#F0F0F0';
 	if(Streams.size > 0)
 	{
 		if(collapsed === false)
 		{
	 		VizUI = Streams.map((stream,i) => <div key={i + 10} style={{paddingBottom:5}}>
	 			<Item
	 				key={i}
	 				ID={stream.get('ID')}
	 				stream={stream}
	 				location={this.props.findPlotIndex(stream.get('ID'))}
	 				type={stream.get('SwipeState')}
	 				shift={this.props.shift}
	 				slidestate={this.props.slidestate}
	 				header={stream.get('header')}
	 				beatnum={this.props.beatnum}
	 				spb={this.props.spb}
	 				numViz={Streams.size}
	 				synth={this.props.synth}

	 			/>
	 			</div>)
 		}
 		else if(collapsed === true){
 			VizUI = <div style={{backgroundColor: 'AliceBlue', borderRadius: 0}}>
				<h3> All Data Streams</h3>


				<MultiPlot
					height={200}
					all_data={Streams.map((stream) => [{data:stream.get('Data').toJS(), plot_type:stream.get('plot_type'), color:color}])}
					shift={Store.getShift()}
					position={this.props.slidestate}
					beatnum={this.props.beatnum}
					spb={this.props.spb.spb}
					numViz={this.props.numViz}
					synth={this.props.synth}
					/>
     			<div style={{paddingLeft:25}}>
				<Button bsSize="small" onClick={this.handleRemove}>Remove</Button>
				</div>
			</div>
 		}
 	}
 	else{
 		VizUI = <h3>None Right Now!</h3>
 	}

	return connectDropTarget(
		<div>
		<div style={vizStyle}>
			<h1>Visual Items:</h1>
	      	<div>


	      			{VizUI}
	      	</div>
	      </div>
	     </div>





		) //closes return
	}//closes render function
};

export default DropTarget(DragTypes.ITEM, vizTarget, collect)(ListViz);
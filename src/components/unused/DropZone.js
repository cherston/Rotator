import React, {Component, PropTypes} from 'react';
import { DragTypes } from '../DragConstants';
import { DropTarget } from 'react-dnd';
import Actions from '../Actions';
import Store from '../Store'; //would be muuch better to pass thru props rather than import store here
import Item from './Item';

import {Circle} from 'react-shapes';



const squareTarget = {
	drop(props, monitor) {
		return {zone:props.zone}

	}
};
function collect(connect, monitor) {

	return {
		connectDropTarget: connect.dropTarget(),
		isOver: monitor.isOver(),
		item: monitor.getItem(),
		canDrop: monitor.canDrop(),

	}
};
function canDrop(props,monitor){
	_Store.getOccupancy(props.zone) === null
};


class DropZone extends Component {
  constructor(props){
  	super(props);
	this.state = {
		solo: false
	}
  };

  handleSolo(){
  	this.state.solo = true;
  }

  render() {
  	const { connectDropTarget, isOver, item, canDrop,didDrop} = this.props;
  	const occupied = Store.getOccupancy(this.props.zone);
  	const stream = Store.getStream(Store.getOccupancy(this.props.zone));
  	const solo = this.state.solo;
  	var render_item;

  	if(occupied !== null && stream !== null)
  	{
  		console.log('Stream: ' + stream);
  		const location = this.props.handler(stream.get('ID'));
  		render_item = <Item key={stream.get('ID')} stream={stream} location={location} didDrop={didDrop}/>
  	}
  	else
  		render_item = null;

  	var audcolor = isOver && occupied===null ? '#E65243': '#FFDFBF'
	var circle = {
	    width: 150,
	    height: 150,
	    borderRadius: 150/2,
	    backgroundColor: audcolor,
	    //marginLeft: this.props.zone%2*30 , //small hack to get audio zones distributed evenly
	}

  	//console.log('rerendering drop zone: ' + this.props.zone + ' It will render: ' + render_item);
	    return connectDropTarget(
		<div>

			<div style={circle}>

			{render_item}

			</div>
			{solo ? <div>Solo!</div> : null}


		</div>

    );
  }
};



export default DropTarget(DragTypes.ITEM, squareTarget, collect)(DropZone);




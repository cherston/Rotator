import React, { Component } from 'react';
import ResizableAndMovable from 'react-resizable-and-movable';
import Store from '../Store';
import Actions from '../Actions';


export default class Resizable extends Component {

constructor(props) {
	super(props)
}
drag(evt){
	this.props.onShapeDrag({left: evt.left, top: evt.top});

}
dragStop(evt){
	this.props.onShapeDragStop({left: evt.left, top: evt.top});
}
resize(evt,evt2,evt4){
	//console.log('new width: ' + evt2.width + ' new height: ' + evt2.height);
	this.props.onBoundsResize(evt, {width:evt4.width, height: evt4.height})
}

render() {
	const color = this.props.type === 'auditory' ? '#000' : '#E42';
	const offset = this.props.type === 'auditory' ? 170 : 0;


	const style = {
	textAlign: 'center',
	padding: '10px',
	border: 'solid 3px' + color,
	borderRadius: '20px',
	color: color,
	backgroundColor:  'rgba(255, 255, 255, 0)',
	};

    return (
    <ResizableAndMovable
	  x={65 + offset}
	  y={400}
	  width={150}
	  height={150}
	  minWidth={50}
	  minHeight={50}
	  style={style}
	  bounds={{left:0, top:0, right:700, bottom:500}}
	  onResizeStop={(evt,evt2,evt3,evt4)=>{this.resize(evt,evt2, evt4)}}
	  onDrag={(evt,UI)=>{this.drag(UI.position)}}
	  onDragStop={(evt,UI) => (this.dragStop(UI.position))}

		>
	  <p style={{ paddingBottom:'25%' }}>{this.props.type}</p>
	  {/*{img}*/}
	</ResizableAndMovable>

    );
  }
}
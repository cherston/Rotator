import React, {Component}  from 'react';
import Actions from '../Actions';
import Item from './Item';
import UploadZone from 'react-dropzone';
import DropZone from './DropZone';
import Store from '../Store';


import { Button, Grid, Row, Col } from 'react-bootstrap';

var head = require('./backofhead.png');

class ListAudSpatial extends Component {

	constructor(props) {
		super(props);
		//this.find_index = this.find_index.bind(this);
	};
	render(){
		console.log('rerendering listAud...');
		//var lisatItems = this.props.items
		const { Streams, handleFile} = this.props;
		console.log('auto? ' + Store.getAuto());

	return (
		<div>

			<div>
	        <h1> Audio Streams: {Store.getAuto() === 'play' ? <font color="red">PLAYING</font> : null}</h1>
	      	</div>
	      	<div>
	      			<Grid>
	      			<Row className="show-grid">
	      			<Col xs={6} md={3}><DropZone zone={0} handler={this.props.findPlotIndex} slidestate={Store.getSlideState()} stream={Store.getStream(Store.getOccupancy(0))}   /></Col>

	      			<Col xs={6} md={3}><DropZone zone={1} handler={this.props.findPlotIndex} slidestate={Store.getSlideState()} stream={Store.getStream(Store.getOccupancy(1))}  /></Col>
	      			</Row>
	      			</Grid>
	      	</div>
	      	<div>
	      			<div style={{marginLeft:140}}><img style={{height:200, width:200}} src={head}/></div>
	      			<Grid>
	      			<Row>

	      			<Col xs={6} md={3}><DropZone zone={2} handler={this.props.findPlotIndex} slidestate={Store.getSlideState()} stream={Store.getStream(Store.getOccupancy(2))}  /></Col>

	      			<Col xs={6} md={3}><DropZone zone={3} handler={this.props.findPlotIndex} slidestate={Store.getSlideState()} stream={Store.getStream(Store.getOccupancy(3))}  /></Col>

	      			</Row>
	      			</Grid>
	      	</div>
	     </div>

		) //closes return
	}//closes render function
};

export default ListAudSpatial